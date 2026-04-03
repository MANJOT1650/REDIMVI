import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { compressVideo } from '../api';
import './Compress.css';

const CompressVideo = () => {
  const [file, setFile] = useState(null);
  const [compressionMode, setCompressionMode] = useState('quality'); // 'quality' or 'size'
  const [qualityScore, setQualityScore] = useState(50); // 0-100 for slider
  const [quality, setQuality] = useState('medium'); // derived from score or straight selection
  const [targetSize, setTargetSize] = useState('');
  const [sizeUnit, setSizeUnit] = useState('MB');
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState(null);
  const navigate = useNavigate();

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const getQualityLabel = (score) => {
    if (score >= 75) return 'High (Better quality)';
    if (score >= 35) return 'Medium (Balanced)';
    return 'Low (Smaller size)';
  };

  // Update string quality when slider changes
  const handleQualityChange = (e) => {
    const val = parseInt(e.target.value);
    setQualityScore(val);
    if (val >= 75) setQuality('high');
    else if (val >= 35) setQuality('medium');
    else setQuality('low');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) {
      alert('Please select a video');
      return;
    }

    if (compressionMode === 'size' && !targetSize) {
      alert('Please enter target size');
      return;
    }

    setLoading(true);
    setProgress(0);
    setResult(null);

    // Progress simulation (slower for video)
    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 90) {
          clearInterval(progressInterval);
          return 90;
        }
        return prev + Math.random() * 2; // slower progress
      });
    }, 500);

    try {
      // Calculate target size in MB (API expects MB usually for video, or we standardize)
      // The current API implementation passes 'targetSize' as string.
      // Let's pass the raw targetSize and unit or normalize it.
      // Video compression is heavy, let's normalize to MB usually.

      let finalTargetSize = null;
      if (compressionMode === 'size') {
        // If unit is KB, convert to MB. If MB, keep as is.
        // Actually, backend 'compress.js' for video placeholder currently takes 'targetSize' directly.
        // We will implement functional backend later.
        // For now, let's pass it compatible with what we will build.
        // Let's pass "sizeInMB".
        finalTargetSize = sizeUnit === 'KB' ? parseFloat(targetSize) / 1024 : parseFloat(targetSize);
      }

      const response = await compressVideo(file, finalTargetSize, quality);

      clearInterval(progressInterval);
      setProgress(100);

      setTimeout(() => {
        setResult(response.data);
        alert('✓ Video processed! ' + (response.data.note || ''));
      }, 300);
    } catch (error) {
      clearInterval(progressInterval);
      setProgress(0);
      alert('✗ ' + (error.response?.data?.error || 'Compression failed'));
    } finally {
      setTimeout(() => {
        setLoading(false);
        setProgress(0);
      }, 500);
    }
  };

  return (
    <div className="compress-container">
      <button className="back-button" onClick={() => navigate('/dashboard')}>
        Back to Dashboard
      </button>
      <h1>Compress Video</h1>
      <form onSubmit={handleSubmit} className="compress-form">
        <div className="form-group">
          <label htmlFor="video">Select Video (MP4, MKV):</label>
          <input
            type="file"
            id="video"
            accept="video/mp4,video/x-matroska"
            onChange={handleFileChange}
            required
          />
        </div>

        {/* Compression Mode Selection */}
        <div className="form-group">
          <label>Compression Mode:</label>
          <div className="mode-selector">
            <button
              type="button"
              className={`mode-btn ${compressionMode === 'quality' ? 'active' : ''}`}
              onClick={() => setCompressionMode('quality')}
            >
              📊 By Quality
            </button>
            <button
              type="button"
              className={`mode-btn ${compressionMode === 'size' ? 'active' : ''}`}
              onClick={() => setCompressionMode('size')}
            >
              📏 By Target Size
            </button>
          </div>
        </div>

        {/* Quality Mode */}
        {compressionMode === 'quality' && (
          <div className="form-group">
            <label htmlFor="quality">
              Quality: {getQualityLabel(qualityScore)}
            </label>
            <input
              type="range"
              id="quality"
              min="1"
              max="100"
              value={qualityScore}
              onChange={handleQualityChange}
            />
            <div className="quality-info">
              <small>💡 Higher quality = Larger file size</small>
            </div>
          </div>
        )}

        {/* Target Size Mode */}
        {compressionMode === 'size' && (
          <div className="form-group">
            <label htmlFor="targetSize">Target File Size:</label>
            <div className="size-input-group">
              <input
                type="number"
                id="targetSize"
                className="target-size-input"
                placeholder="Enter size"
                value={targetSize}
                onChange={(e) => setTargetSize(e.target.value)}
                min="1"
                step="0.1"
                autoComplete="off"
                required={compressionMode === 'size'}
              />
              <select
                value={sizeUnit}
                onChange={(e) => setSizeUnit(e.target.value)}
                className="unit-selector"
              >
                <option value="MB">MB</option>
                <option value="KB">KB</option>
              </select>
            </div>
            <div className="quality-info">
              <small>💡 Video will be compressed to approximately this size</small>
            </div>
          </div>
        )}

        <button type="submit" disabled={loading}>
          {loading && <span className="loading-spinner"></span>}
          {loading ? 'Processing...' : 'Compress Video'}
        </button>

        {loading && (
          <div className="progress-container">
            <div className="progress-bar">
              <div className="progress-fill" style={{ width: `${progress}%` }}>
                <span className="progress-text">{Math.round(progress)}%</span>
              </div>
            </div>
            <div className="progress-message">
              {progress < 30 && '🎬 Loading video...'}
              {progress >= 30 && progress < 60 && '⚙️ Processing frames...'}
              {progress >= 60 && progress < 90 && '🎨 Compressing video...'}
              {progress >= 90 && '✨ Finalizing...'}
            </div>
          </div>
        )}
      </form>

      {result && (
        <div className="result-container">
          <h2>Processing Complete!</h2>
          <div className="result-info">
            <p><strong>Original Size:</strong> {result.originalSize}</p>
            {result.quality && <p><strong>Quality:</strong> {result.quality}</p>}
            {result.targetSize && result.targetSize !== 'Not specified' && result.targetSize !== 'null MB' && (
              <p><strong>Target Size:</strong> {result.targetSize}</p>
            )}

            {result.note && (
              <p className="result-note">
                <strong>Note:</strong> {result.note}
              </p>
            )}
            {result.instructions && (
              <p style={{ fontSize: '12px', marginTop: '10px' }}>
                {result.instructions}
              </p>
            )}
          </div>

          {result.downloadUrl && (
            <a
              href={result.downloadUrl}
              className="download-btn"
              style={{ display: 'block', textAlign: 'center', marginTop: '20px', textDecoration: 'none' }}
            >
              Download Compressed Video
            </a>
          )}
        </div>
      )}
    </div>
  );
};

export default CompressVideo;
