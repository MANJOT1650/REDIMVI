import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { compressImage } from '../api';
import './Compress.css';

const CompressImage = () => {
  const [file, setFile] = useState(null);
  const [compressionMode, setCompressionMode] = useState('quality'); // 'quality' or 'size'
  const [quality, setQuality] = useState(80);
  const [targetSize, setTargetSize] = useState('');
  const [sizeUnit, setSizeUnit] = useState('KB'); // 'KB' or 'MB'
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState(null);
  const navigate = useNavigate();

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) {
      alert('Please select an image');
      return;
    }

    if (compressionMode === 'size' && !targetSize) {
      alert('Please enter target size');
      return;
    }

    setLoading(true);
    setProgress(0);
    setResult(null);

    // Simulate progress
    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 90) {
          clearInterval(progressInterval);
          return 90;
        }
        return prev + Math.random() * 15;
      });
    }, 200);

    try {
      // Calculate target size in KB if in size mode
      let activeTargetSize = null;
      if (compressionMode === 'size') {
        activeTargetSize = sizeUnit === 'MB' ? parseFloat(targetSize) * 1024 : parseFloat(targetSize);
      }

      const response = await compressImage(file, quality, activeTargetSize);

      clearInterval(progressInterval);
      setProgress(100);

      setTimeout(() => {
        setResult(response.data);
        alert('✓ Image compressed successfully!');
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

  const handleDownload = (downloadUrl) => {
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.click();
  };

  const getQualityDescription = () => {
    if (quality >= 90) return 'Best Quality (Larger file)';
    if (quality >= 70) return 'High Quality (Balanced)';
    if (quality >= 50) return 'Medium Quality (Smaller file)';
    if (quality >= 30) return 'Low Quality (Much smaller)';
    return 'Minimum Quality (Smallest file)';
  };

  return (
    <div className="compress-container">
      <button className="back-button" onClick={() => navigate('/dashboard')}>
        Back to Dashboard
      </button>
      <h1>Compress Image</h1>
      <form onSubmit={handleSubmit} className="compress-form">
        <div className="form-group">
          <label htmlFor="image">Select Image (PNG, JPG, JPEG):</label>
          <input
            type="file"
            id="image"
            accept="image/png,image/jpeg,image/jpg"
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
              Quality: {quality}%
              <span className="quality-desc"> - {getQualityDescription()}</span>
            </label>
            <input
              type="range"
              id="quality"
              min="10"
              max="100"
              value={quality}
              onChange={(e) => setQuality(e.target.value)}
            />
            <div className="quality-info">
              <small>💡 Higher quality = Better image, larger file size</small>
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
                step="1"
                autoComplete="off"
                required={compressionMode === 'size'}
              />
              <select
                value={sizeUnit}
                onChange={(e) => setSizeUnit(e.target.value)}
                className="unit-selector"
              >
                <option value="KB">KB</option>
                <option value="MB">MB</option>
              </select>
            </div>
            <div className="quality-info">
              <small>💡 Image will be compressed to approximately this size</small>
            </div>
          </div>
        )}

        <button type="submit" disabled={loading}>
          {loading && <span className="loading-spinner"></span>}
          {loading ? 'Compressing...' : 'Compress Image'}
        </button>

        {/* Progress Bar */}
        {loading && (
          <div className="progress-container">
            <div className="progress-bar">
              <div
                className="progress-fill"
                style={{ width: `${progress}%` }}
              >
                <span className="progress-text">{Math.round(progress)}%</span>
              </div>
            </div>
            <div className="progress-message">
              {progress < 30 && '🔍 Analyzing image...'}
              {progress >= 30 && progress < 60 && '⚙️ Optimizing pixels...'}
              {progress >= 60 && progress < 90 && '🎨 Applying compression...'}
              {progress >= 90 && '✨ Almost done...'}
            </div>
          </div>
        )}
      </form>

      {result && (
        <div className="result-container">
          <h2>✓ Compression Successful!</h2>
          <div className="result-info">
            {result.format && <p><strong>Format:</strong> {result.format}</p>}
            <p><strong>Original Size:</strong> {result.originalSize}</p>
            <p><strong>Compressed Size:</strong> {result.compressedSize}</p>
            <p><strong>Compression Ratio:</strong> {result.compressionRatio}</p>
            <p><strong>Quality:</strong> {result.quality}%</p>
          </div>
          <button
            className="download-btn"
            onClick={() => handleDownload(result.downloadUrl)}
          >
            ⬇️ Download Compressed Image
          </button>
        </div>
      )}
    </div>
  );
};

export default CompressImage;
