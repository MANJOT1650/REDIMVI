const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const sharp = require('sharp');
const { authenticateToken } = require('../middleware/auth');
const ffmpeg = require('fluent-ffmpeg');
const ffmpegPath = require('ffmpeg-static');

// Setup ffmpeg paths
ffmpeg.setFfmpegPath(ffmpegPath);

// Try to setup ffprobe if available
try {
  const ffprobePath = require('ffprobe-static').path;
  ffmpeg.setFfprobePath(ffprobePath);
} catch (e) {
  console.warn('ffprobe-static not found, size-based compression might fail');
}

const router = express.Router();

// Configure multer for file uploads
const upload = multer({
  dest: 'uploads/',
  limits: { fileSize: 500 * 1024 * 1024 }, // 500MB
  fileFilter: (req, file, cb) => {
    const allowedMimes = [
      'video/mp4',
      'video/x-matroska',
      'image/png',
      'image/jpeg',
      'image/jpg',
    ];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type'));
    }
  },
});

// Image compression endpoint
router.post('/image', authenticateToken, upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }


    const { quality = 80, targetSize } = req.body;
    const inputPath = req.file.path;

    // Get exact original file extension from the uploaded filename
    const originalExtension = path.extname(req.file.originalname).toLowerCase().slice(1); // Remove the dot
    const originalFormat = req.file.mimetype.split('/')[1]; // 'png', 'jpeg', etc.

    // Use the exact original extension (preserves jpg vs jpeg)
    const outputFilename = `compressed_${Date.now()}.${originalExtension}`;
    const outputPath = path.join('uploads', outputFilename);

    // Create Sharp instance with auto-rotation to fix EXIF orientation
    const sharpInstance = sharp(inputPath, { failOnError: false }).rotate();

    // Helper function to compress buffer at specific quality
    const compressWithQuality = async (q) => {
      const qInt = parseInt(q);
      if (originalFormat === 'png') {
        const compressionLevel = Math.floor((100 - qInt) / 10);
        return sharpInstance
          .clone()
          .png({
            quality: qInt,
            compressionLevel: compressionLevel,
            palette: true
          })
          .toBuffer();
      } else {
        return sharpInstance
          .clone()
          .jpeg({
            quality: qInt,
            mozjpeg: true
          })
          .toBuffer();
      }
    };

    let finalBuffer;
    let finalQuality = parseInt(quality);

    if (targetSize) {
      // Target Mode: Iterative compression algorithm
      const targetBytes = parseFloat(targetSize) * 1024; // convert KB to bytes

      let minQ = 5;
      let maxQ = 95;
      let currentQ = 80;
      let bestBuffer = null;
      let bestDiff = Infinity;

      // Binary search for optimal quality (max 6 iterations)
      for (let i = 0; i < 6; i++) {
        const buffer = await compressWithQuality(currentQ);

        if (buffer.length <= targetBytes) {
          // It fits! 
          bestBuffer = buffer;
          finalQuality = currentQ;
          minQ = currentQ + 1; // Try Higher quality
        } else {
          // Too big
          maxQ = currentQ - 1; // Try Lower quality
        }

        if (minQ > maxQ) break;
        currentQ = Math.floor((minQ + maxQ) / 2);
      }

      // Fallback if we couldn't meet target (or just use best found)
      if (!bestBuffer) {
        // If we strictly failed to meet target, return the smallest possible (quality 5)
        // or just the last attempt? Let's go with lowest safe quality
        bestBuffer = await compressWithQuality(5);
        finalQuality = 5;
      }

      finalBuffer = bestBuffer;
    } else {
      // Quality Mode: Single pass
      finalBuffer = await compressWithQuality(quality);
    }

    // Write final buffer to file
    fs.writeFileSync(outputPath, finalBuffer);

    // Get file sizes for comparison
    const inputStats = fs.statSync(inputPath);
    const outputStats = fs.statSync(outputPath);
    const compressionRatio = (
      ((inputStats.size - outputStats.size) / inputStats.size) * 100
    ).toFixed(2);

    // Delete original uploaded file
    fs.unlinkSync(inputPath);

    res.json({
      message: 'Image compressed successfully',
      filename: outputFilename,
      format: originalExtension.toUpperCase(),
      originalSize: `${(inputStats.size / 1024).toFixed(2)} KB`,
      compressedSize: `${(outputStats.size / 1024).toFixed(2)} KB`,
      compressionRatio: `${compressionRatio}%`,
      downloadUrl: `/api/compress/download/${outputFilename}`,
      quality: finalQuality,
    });
  } catch (error) {
    console.error('Image compression error:', error);
    // Cleanup input file on error
    try { if (req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path); } catch (e) { }
    res.status(500).json({ error: error.message || 'Image compression failed' });
  }
});

// Video compression endpoint
router.post('/video', authenticateToken, upload.single('video'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const { targetSize, quality = 'medium' } = req.body;
    const inputPath = req.file.path;
    const outputFilename = `compressed_video_${Date.now()}.mp4`;
    const outputPath = path.join('uploads', outputFilename);
    const inputStats = fs.statSync(inputPath);

    // Create ffmpeg command
    const command = ffmpeg(inputPath);

    // Function to run compression
    const runCompression = (options) => {
      return new Promise((resolve, reject) => {
        const cmd = command.output(outputPath);

        // Apply options
        if (options.crf) {
          cmd.videoCodec('libx264').addOption('-crf', options.crf);
        }
        if (options.videoBitrate) {
          cmd.videoBitrate(options.videoBitrate).audioBitrate(128);
        }

        cmd
          .on('end', () => resolve())
          .on('error', (err) => reject(err))
          .run();
      });
    };

    // Determine mode
    if (targetSize) {
      // Target Size Mode (Requires Probe)
      const targetMB = parseFloat(targetSize);

      // Get duration
      await new Promise((resolve, reject) => {
        ffmpeg.ffprobe(inputPath, async (err, metadata) => {
          if (err) return reject(new Error('Failed to probe video info'));

          const duration = metadata.format.duration;
          if (!duration) return reject(new Error('Could not determine video duration'));

          // Calculate bitrate: (Size(MB) * 8 * 1024 * 1024) / Duration(s)
          // Result is in bits/s. ffmpeg expects kbps or number?
          // fluent-ffmpeg .videoBitrate() expects kbps if number, or string '1000k'.
          // Let's use bits/s -> kbps

          const totalBits = targetMB * 8 * 1024 * 1024;
          const totalBitrate = totalBits / duration;
          const audioBitrate = 128 * 1000; // 128 kbps audio approx
          let videoBitrate = totalBitrate - audioBitrate;

          if (videoBitrate < 100000) videoBitrate = 100000; // Min 100kbps video

          const videoBitrateKbps = Math.floor(videoBitrate / 1000);

          try {
            await runCompression({ videoBitrate: videoBitrateKbps });
            resolve();
          } catch (e) {
            reject(e);
          }
        });
      });

    } else {
      // Quality Mode (CRF)
      // Adjusted to ensure size reduction:
      let crf = 28; // Medium - solid compression (approx 50-70% reduction)
      if (quality === 'high') crf = 23;      // High - standard quality
      else if (quality === 'low') crf = 32;  // Low - heavy compression (small size)

      await runCompression({ crf });
    }

    // Success response
    const outputStats = fs.statSync(outputPath);
    const compressionRatio = (((inputStats.size - outputStats.size) / inputStats.size) * 100).toFixed(2);

    res.json({
      message: 'Video compressed successfully',
      filename: outputFilename,
      originalSize: `${(inputStats.size / 1024 / 1024).toFixed(2)} MB`,
      compressedSize: `${(outputStats.size / 1024 / 1024).toFixed(2)} MB`,
      quality: quality,
      targetSize: targetSize ? `${targetSize} MB` : 'Not specified',
      downloadUrl: `/api/compress/download/${outputFilename}`,
      note: `Compression Ratio: ${compressionRatio}%`,
    });

    // Cleanup input
    fs.unlinkSync(inputPath);

  } catch (error) {
    console.error('Video compression error:', error);
    // Cleanup input file on error
    try { if (req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path); } catch (e) { }
    res.status(500).json({ error: error.message || 'Video compression failed' });
  }
});

// Format conversion endpoint
router.post('/convert', authenticateToken, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const { fromFormat, toFormat } = req.body;
    const inputPath = req.file.path;
    const outputFilename = `converted_${Date.now()}.${toFormat.toLowerCase()}`;
    const outputPath = path.join('uploads', outputFilename);
    const inputStats = fs.statSync(inputPath);

    if (fromFormat === toFormat) {
      fs.unlinkSync(inputPath);
      return res.status(400).json({ error: 'Source and target formats must be different' });
    }

    // Create ffmpeg command
    const command = ffmpeg(inputPath);

    await new Promise((resolve, reject) => {
      command.output(outputPath)
        .on('end', () => resolve())
        .on('error', (err) => reject(err))
        .run();
    });

    const outputStats = fs.statSync(outputPath);

    // Delete original uploaded file
    fs.unlinkSync(inputPath);

    res.json({
      message: 'Video format converted successfully',
      filename: outputFilename,
      originalSize: `${(inputStats.size / 1024 / 1024).toFixed(2)} MB`,
      convertedSize: `${(outputStats.size / 1024 / 1024).toFixed(2)} MB`,
      fromFormat: fromFormat.toUpperCase(),
      toFormat: toFormat.toUpperCase(),
      downloadUrl: `/api/compress/download/${outputFilename}`,
      note: 'Conversion completed successfully',
      instructions: `Converted from ${fromFormat.toUpperCase()} to ${toFormat.toUpperCase()}`
    });

  } catch (error) {
    console.error('Conversion error:', error);
    // Cleanup input file on error
    try { if (req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path); } catch (e) { }
    res.status(500).json({ error: error.message || 'Conversion failed' });
  }
});

// Download compressed file endpoint
router.get('/download/:filename', (req, res) => {
  try {
    const filename = req.params.filename;
    const filePath = path.join(__dirname, '..', 'uploads', filename);

    // Security check: prevent directory traversal
    const normalizedPath = path.normalize(filePath);
    const uploadsDir = path.resolve(path.join(__dirname, '..', 'uploads'));

    if (!normalizedPath.startsWith(uploadsDir)) {
      return res.status(403).json({ error: 'Access denied' });
    }

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'File not found' });
    }

    // Send file
    res.download(filePath, filename, (err) => {
      if (err) {
        console.error('Download error:', err);
      } else {
        // Delete file after successful download
        try {
          fs.unlinkSync(filePath);
          console.log(`Deleted file after download: ${filename}`);
        } catch (unlinkErr) {
          console.error(`Error deleting file ${filename}:`, unlinkErr);
        }
      }
    });
  } catch (error) {
    console.error('Download error:', error);
    res.status(500).json({ error: error.message || 'Download failed' });
  }
});

// List uploaded files (for debugging)
router.get('/list', authenticateToken, (req, res) => {
  try {
    const uploadsDir = path.join(__dirname, '..', 'uploads');
    const files = fs.readdirSync(uploadsDir);

    const filesList = files.map(file => {
      const filePath = path.join(uploadsDir, file);
      const stats = fs.statSync(filePath);
      return {
        filename: file,
        size: `${(stats.size / 1024).toFixed(2)} KB`,
        created: stats.birthtime,
      };
    });

    res.json({ files: filesList });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Image format conversion endpoint
router.post('/convert-image', authenticateToken, upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const { toFormat } = req.body;
    const inputPath = req.file.path;
    const originalExtension = path.extname(req.file.originalname).toLowerCase().slice(1);

    if (!toFormat) {
      fs.unlinkSync(inputPath);
      return res.status(400).json({ error: 'Target format is required' });
    }

    if (originalExtension === toFormat.toLowerCase()) {
      fs.unlinkSync(inputPath);
      return res.status(400).json({ error: 'Source and target formats must be different' });
    }

    const outputFilename = `converted_image_${Date.now()}.${toFormat.toLowerCase()}`;
    const outputPath = path.join('uploads', outputFilename);
    const inputStats = fs.statSync(inputPath);

    const sharpInstance = sharp(inputPath, { failOnError: false }).rotate();

    // Convert logic
    await sharpInstance
      .toFormat(toFormat.toLowerCase())
      .toFile(outputPath);

    const outputStats = fs.statSync(outputPath);

    // Delete original uploaded file
    fs.unlinkSync(inputPath);

    res.json({
      message: 'Image converted successfully',
      filename: outputFilename,
      originalSize: `${(inputStats.size / 1024).toFixed(2)} KB`,
      convertedSize: `${(outputStats.size / 1024).toFixed(2)} KB`,
      fromFormat: originalExtension.toUpperCase(),
      toFormat: toFormat.toUpperCase(),
      downloadUrl: `/api/compress/download/${outputFilename}`,
      note: 'Conversion completed successfully',
      instructions: `Converted from ${originalExtension.toUpperCase()} to ${toFormat.toUpperCase()}`
    });

  } catch (error) {
    console.error('Image conversion error:', error);
    // Cleanup input file on error
    try { if (req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path); } catch (e) { }
    res.status(500).json({ error: error.message || 'Image conversion failed' });
  }
});

module.exports = router;
