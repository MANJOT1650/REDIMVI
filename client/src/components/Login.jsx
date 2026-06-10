import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { login, resendVerification } from '../api';
import './Login.css';

const Login = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [needsVerification, setNeedsVerification] = useState(false);
  const [verificationEmail, setVerificationEmail] = useState('');
  const [resendCooldown, setResendCooldown] = useState(0);
  const [resendLoading, setResendLoading] = useState(false);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Show "Email verified" success message if the URL has ?verified=true
  useEffect(() => {
    if (searchParams.get('verified') === 'true') {
      setSuccessMessage('✓ Email verified successfully! You can now log in.');
    }
  }, [searchParams]);

  // Handle resend cooldown
  useEffect(() => {
    let timer;
    if (resendCooldown > 0) {
      timer = setInterval(() => {
        setResendCooldown((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [resendCooldown]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setError(''); // Clear error on input change
    setSuccessMessage('');
    setNeedsVerification(false);
  };

  const handleResend = async () => {
    if (!verificationEmail) return;
    setResendLoading(true);
    try {
      const response = await resendVerification(verificationEmail);
      setSuccessMessage('✓ ' + (response.data.message || 'Verification email resent!'));
      setError('');
      setNeedsVerification(false);
      setResendCooldown(60);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to resend verification email.');
      if (err.response?.status === 429) {
        setResendCooldown(err.response.data.retryAfter || 60);
      }
    } finally {
      setResendLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccessMessage('');
    setNeedsVerification(false);

    try {
      const response = await login(formData.email, formData.password);

      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));

      if (rememberMe) {
        localStorage.setItem('rememberMe', 'true');
      }

      // Show success message if demo mode
      if (response.data.demoMode) {
        setError('✓ Logged in (Demo Mode - No Database)');
        setTimeout(() => navigate('/dashboard'), 1000);
      } else {
        navigate('/dashboard');
      }
    } catch (err) {
      const responseData = err.response?.data;
      if (responseData?.needsVerification) {
        setNeedsVerification(true);
        setVerificationEmail(responseData.email || formData.email);
        setError(responseData.error || 'Please verify your email before logging in.');
      } else {
        setError(responseData?.error || 'Login failed. Please try again.');
      }
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

      {/* Login Card */}
      <div className="login-card">
        <div className="login-header">
          <div className="logo-container">
            <div className="logo-icon">🎬</div>
            <h1>RedImVi</h1>
          </div>
          <p className="subtitle">Media Compression Platform</p>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
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
                placeholder="Enter your password"
                value={formData.password}
                onChange={handleChange}
                required
                autoComplete="current-password"
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

          {/* Remember Me & Forgot Password */}
          <div className="form-options">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
              />
              <span>Remember me</span>
            </label>
            <a href="#" className="forgot-password">Forgot password?</a>
          </div>

          {/* Success Message */}
          {successMessage && (
            <div className="message success">
              {successMessage}
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="message error">
              <div>{error}</div>
              {needsVerification && (
                <div style={{ marginTop: '10px' }}>
                  <button
                    type="button"
                    onClick={handleResend}
                    disabled={resendLoading || resendCooldown > 0}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'var(--color-primary)',
                      textDecoration: 'underline',
                      font: 'inherit',
                      cursor: 'pointer',
                      padding: 0,
                      fontWeight: '700'
                    }}
                  >
                    {resendLoading ? 'Resending...' : resendCooldown > 0 ? `Resend link in ${resendCooldown}s` : 'Resend Verification Link'}
                  </button>
                </div>
              )}
            </div>
          )}


          {/* Submit Button */}
          <button type="submit" className="login-button" disabled={loading}>
            {loading ? (
              <>
                <span className="spinner"></span>
                Logging in...
              </>
            ) : (
              <>
                <span>Login</span>
                <span className="arrow">→</span>
              </>
            )}
          </button>
        </form>

        {/* Sign Up Link */}
        <div className="signup-prompt">
          <p>
            Don't have an account?{' '}
            <Link to="/signup" className="signup-link">
              Create one now
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

export default Login;
