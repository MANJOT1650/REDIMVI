import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { convertImageFormat } from '../api';
import './Compress.css';
import { API_BASE_URL } from '../config';

const ConvertImage = () => {
    const [file, setFile] = useState(null);
    const [toFormat, setToFormat] = useState('jpg');
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
            alert('Please select an image');
            return;
        }

        const originalExtension = file.name.split('.').pop().toLowerCase();
        // Normalize jpg/jpeg
        const normalizedOriginal = originalExtension === 'jpeg' ? 'jpg' : originalExtension;
        const normalizedTarget = toFormat === 'jpeg' ? 'jpg' : toFormat;

        if (normalizedOriginal === normalizedTarget) {
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
                return prev + Math.random() * 15;
            });
        }, 200);

        try {
            const response = await convertImageFormat(file, toFormat);
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
            <h1>Convert Image Format</h1>
            <form onSubmit={handleSubmit} className="compress-form">
                <div className="form-group">
                    <label htmlFor="image">Select Image:</label>
                    <input
                        type="file"
                        id="image"
                        accept="image/png,image/jpeg,image/jpg,image/webp"
                        onChange={handleFileChange}
                        required
                    />
                </div>

                <div className="form-group">
                    <label htmlFor="toFormat">To Format:</label>
                    <select
                        id="toFormat"
                        value={toFormat}
                        onChange={(e) => setToFormat(e.target.value)}
                    >
                        <option value="jpg">JPG</option>
                        <option value="png">PNG</option>
                        <option value="webp">WEBP</option>
                        <option value="tiff">TIFF</option>
                    </select>
                </div>

                <button type="submit" disabled={loading}>
                    {loading && <span className="loading-spinner"></span>}
                    {loading ? 'Processing...' : 'Convert Image'}
                </button>

                {loading && (
                    <div className="progress-container">
                        <div className="progress-bar">
                            <div className="progress-fill" style={{ width: `${progress}%` }}>
                                <span className="progress-text">{Math.round(progress)}%</span>
                            </div>
                        </div>
                        <div className="progress-message">
                            {progress < 100 ? '🔄 Converting format...' : '✨ Finishing up...'}
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
                        <p><strong>Converting:</strong> {result.fromFormat} → {result.toFormat}</p>

                        {result.downloadUrl && (
                            <a href={getDownloadUrl(result.downloadUrl)} download className="download-btn" style={{ textDecoration: 'none', display: 'block', marginTop: '20px', textAlign: 'center' }}>
                                Download Converted Image
                            </a>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default ConvertImage;
