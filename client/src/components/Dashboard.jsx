import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Dashboard.css';

const Dashboard = () => {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const [activeCategory, setActiveCategory] = useState('image');

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const imageFeatures = [
    {
      icon: '🖼️',
      title: 'Image Compression',
      description: 'Compress PNG, JPG, JPEG images with custom quality',
      route: '/compress-image',
      gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
    },
    {
      icon: '🔄',
      title: 'Image Format Conversion',
      description: 'Convert images between PNG, JPG, WEBP formats',
      route: '/convert-image',
      gradient: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)'
    }
  ];

  const videoFeatures = [
    {
      icon: '🎥',
      title: 'Video Compression',
      description: 'Compress MP4, MKV videos by percentage or target size',
      route: '/compress-video',
      gradient: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)'
    },
    {
      icon: '🔄',
      title: 'Video Format Conversion',
      description: 'Convert between MP4 and MKV video formats',
      route: '/convert',
      gradient: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)'
    }
  ];

  const currentFeatures = activeCategory === 'image' ? imageFeatures : videoFeatures;

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <div className="header-left">
          <span className="logo-emoji">🎬</span>
          <h1>RedImVi Dashboard</h1>
        </div>
        <button onClick={handleLogout} className="logout-btn">
          Logout
        </button>
      </header>

      <main className="dashboard-main">
        <section className="welcome-section">
          <h2>Welcome, {user.username}!</h2>
          <p>Your media compression platform</p>
        </section>

        <section className="category-nav">
          <button
            className={`category-btn ${activeCategory === 'image' ? 'active' : ''}`}
            onClick={() => setActiveCategory('image')}
          >
            <span className="category-icon">🖼️</span>
            <span className="category-label">Image Tools</span>
          </button>
          <button
            className={`category-btn ${activeCategory === 'video' ? 'active' : ''}`}
            onClick={() => setActiveCategory('video')}
          >
            <span className="category-icon">🎥</span>
            <span className="category-label">Video Tools</span>
          </button>
        </section>

        <section className="features-grid">
          {currentFeatures.map((feature, index) => (
            <div
              key={index}
              className="feature-card"
              style={{ '--card-gradient': feature.gradient }}
              onClick={() => navigate(feature.route)}
            >
              {/* Left Side: Identity */}
              <div className="card-left">
                <div className="feature-icon">{feature.icon}</div>
                <h3>{feature.title}</h3>
              </div>

              {/* Right Side: Action */}
              <div className="card-right">
                <p>{feature.description}</p>
                <button className="start-btn">
                  Start
                </button>
              </div>
            </div>
          ))}
        </section>
      </main>
    </div>
  );
};

export default Dashboard;
