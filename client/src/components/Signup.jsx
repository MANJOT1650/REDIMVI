import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { signup } from '../api';
import './Login.css';

const Signup = () => {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [isRegistered, setIsRegistered] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState('');
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await signup(
        formData.username,
        formData.email,
        formData.password,
        formData.confirmPassword
      );

      if (response.data.demoMode) {
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.user));
        setError('✓ Account created (Demo Mode - No Database)');
        setTimeout(() => navigate('/dashboard'), 1000);
      } else {
        setRegisteredEmail(formData.email);
        setIsRegistered(true);
      }
    } catch (err) {
      const errMsg = err.response?.data?.error || 'Signup failed. Please try again.';
      const errDetails = err.response?.data?.details;
      setError(errDetails ? `${errMsg}: ${errDetails}` : errMsg);
    } finally {
      setLoading(false);
    }
  };


  return (
    <div className="login-container">
      {/* Animated Background */}
      <div className="login-background">
        <div className="gradient-orb orb-1"></div>
        <div className="gradient-orb orb-2"></div>
        <div className="gradient-orb orb-3"></div>
      </div>

      {/* Signup Card */}
      <div className="login-card">
        <div className="login-header">
          <div className="logo-container">
            <div className="logo-icon">🎬</div>
            <h1>RedImVi</h1>
          </div>
          <p className="subtitle">{isRegistered ? 'Verify Your Email' : 'Create Your Account'}</p>
        </div>

        {isRegistered ? (
          <div className="login-form" style={{ textAlign: 'center', gap: '20px' }}>
            <div style={{ fontSize: '48px', color: 'var(--color-primary)', marginBottom: '8px' }}>📧</div>
            <p style={{ color: 'var(--text-primary)', fontSize: '16px', fontWeight: '600' }}>
              We've sent a verification link to:
            </p>
            <p style={{ color: 'var(--color-primary)', fontSize: '18px', fontWeight: '700', wordBreak: 'break-all' }}>
              {registeredEmail}
            </p>
            <p style={{ color: 'var(--text-secondary)', fontSize: '14px', lineHeight: '1.6' }}>
              Please check your inbox (and spam folder) and click the link to verify your account. Once verified, you can log in.
            </p>
            <Link to="/login" className="login-button" style={{ textDecoration: 'none', display: 'inline-flex', justifyContent: 'center', alignItems: 'center', marginTop: '12px' }}>
              Go to Login →
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="login-form">
            {/* Username Input */}
            <div className="input-group">
              <label htmlFor="username">Username</label>
              <div className="input-wrapper">
                <span className="input-icon">👤</span>
                <input
                  type="text"
                  id="username"
                  name="username"
                  placeholder="Choose a username"
                  value={formData.username}
                  onChange={handleChange}
                  required
                  autoComplete="username"
                />
              </div>
            </div>

            {/* Email Input */}
            <div className="input-group">
              <label htmlFor="email">Email Address</label>
              <div className="input-wrapper">
                <span className="input-icon">📧</span>
                <input
                  type="email"
                  id="email"
                  name="email"
                  placeholder="Enter your email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  autoComplete="email"
                />
              </div>
            </div>

            {/* Password Input */}
            <div className="input-group">
              <label htmlFor="password">Password</label>
              <div className="input-wrapper">
                <span className="input-icon">🔒</span>
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  name="password"
                  placeholder="Create a password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  className="toggle-password"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label="Toggle password visibility"
                >
                  {showPassword ? '👁️' : '👁️‍🗨️'}
                </button>
              </div>
            </div>

            {/* Confirm Password Input */}
            <div className="input-group">
              <label htmlFor="confirmPassword">Confirm Password</label>
              <div className="input-wrapper">
                <span className="input-icon">🔐</span>
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  id="confirmPassword"
                  name="confirmPassword"
                  placeholder="Confirm your password"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  required
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  className="toggle-password"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  aria-label="Toggle confirm password visibility"
                >
                  {showConfirmPassword ? '👁️' : '👁️‍🗨️'}
                </button>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className={`message ${error.startsWith('✓') ? 'success' : 'error'}`}>
                {error}
              </div>
            )}

            {/* Submit Button */}
            <button type="submit" className="login-button" disabled={loading}>
              {loading ? (
                <>
                  <span className="spinner"></span>
                  Creating Account...
                </>
              ) : (
                <>
                  <span>Create Account</span>
                  <span className="arrow">→</span>
                </>
              )}
            </button>
          </form>
        )}


        {/* Login Link */}
        <div className="signup-prompt">
          <p>
            Already have an account?{' '}
            <Link to="/login" className="signup-link">
              Login here
            </Link>
          </p>
        </div>

        {/* Footer */}
        <div className="login-footer">
          <p>Secure • Fast • Reliable</p>
        </div>
      </div>
    </div>
  );
};

export default Signup;
