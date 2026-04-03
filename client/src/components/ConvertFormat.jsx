import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { convertFormat } from '../api';
import './Compress.css';
import { API_BASE_URL } from '../config';

const ConvertFormat = () => {
  const [file, setFile] = useState(null);
  const [fromFormat, setFromFormat] = useState('mp4');
  const [toFormat, setToFormat] = useState('mkv');
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState(null);
  const navigate = useNavigate();

  // Helper to get download URL
  const getDownloadUrl = (path) => {
    if (!path) return '#';
    const baseUrl = API_BASE_URL.replace('/api', '');
    return `${baseUrl}${path}`;
  };

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) {
      alert('Please select a video');
      return;
    }

    if (fromFormat === toFormat) {
      alert('Source and target formats must be different');
      return;
    }

    setLoading(true);
    setProgress(0);
    setResult(null);

    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 90) {
          clearInterval(progressInterval);
          return 90;
        }
        return prev + Math.random() * 12;
      });
    }, 250);

    try {
      const response = await convertFormat(file, fromFormat, toFormat);
      clearInterval(progressInterval);
      setProgress(100);
      setTimeout(() => {
        setResult(response.data);
        alert('✓ Conversion ready! ' + response.data.note);
      }, 300);
    } catch (error) {
      clearInterval(progressInterval);
      setProgress(0);
      alert('✗ ' + (error.response?.data?.error || 'Conversion failed'));
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
      <h1>Convert Video Format</h1>
      <form onSubmit={handleSubmit} className="compress-form">
        <div className="form-group">
          <label htmlFor="video">Select Video:</label>
          <input
            type="file"
            id="video"
            accept="video/mp4,video/x-matroska"
            onChange={handleFileChange}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="fromFormat">From Format:</label>
          <select
            id="fromFormat"
            value={fromFormat}
            onChange={(e) => setFromFormat(e.target.value)}
          >
            <option value="mp4">MP4</option>
            <option value="mkv">MKV</option>
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="toFormat">To Format:</label>
          <select
            id="toFormat"
            value={toFormat}
            onChange={(e) => setToFormat(e.target.value)}
          >
            <option value="mkv">MKV</option>
            <option value="mp4">MP4</option>
          </select>
        </div>

        <button type="submit" disabled={loading}>
          {loading && <span className="loading-spinner"></span>}
          {loading ? 'Processing...' : 'Convert Format'}
        </button>

        {loading && (
          <div className="progress-container">
            <div className="progress-bar">
              <div className="progress-fill" style={{ width: `${progress}%` }}>
                <span className="progress-text">{Math.round(progress)}%</span>
              </div>
            </div>
            <div className="progress-message">
              {progress < 30 && '📂 Reading file...'}
              {progress >= 30 && progress < 60 && '🔄 Converting format...'}
              {progress >= 60 && progress < 90 && '⚙️ Encoding video...'}
              {progress >= 90 && '✨ Finishing up...'}
            </div>
          </div>
        )}
      </form>

      {result && (
        <div className="result-container">
          <h2>✓ Conversion Ready!</h2>
          <div className="result-info">
            <p><strong>Original Size:</strong> {result.originalSize}</p>
            {result.convertedSize && <p><strong>Converted Size:</strong> {result.convertedSize}</p>}
            <p><strong>Converting:</strong> {result.fromFormat.toUpperCase()} → {result.toFormat.toUpperCase()}</p>
            <p className="result-note">
              <strong>Note:</strong> {result.note}
            </p>
            <p style={{ fontSize: '12px', marginTop: '10px' }}>
              {result.instructions}
            </p>
            {result.downloadUrl && (
              <a href={getDownloadUrl(result.downloadUrl)} download className="download-btn" style={{ textDecoration: 'none', display: 'block', marginTop: '20px', textAlign: 'center' }}>
                Download Converted Video
              </a>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ConvertFormat;
