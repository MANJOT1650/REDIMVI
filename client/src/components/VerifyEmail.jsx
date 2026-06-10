import React, { useEffect, useState, useRef } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import { verifyEmail, resendVerification } from '../api';
import './Login.css';

const VerifyEmail = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const navigate = useNavigate();

  const [status, setStatus] = useState('verifying'); // verifying, success, error, resending, resend_success
  const [message, setMessage] = useState('Verifying your email address...');
  const [errorDetails, setErrorDetails] = useState('');
  const [emailForResend, setEmailForResend] = useState('');
  const [cooldown, setCooldown] = useState(0);
  const verifyAttempted = useRef(false);

  // Cooldown timer for resending verification email
  useEffect(() => {
    let timer;
    if (cooldown > 0) {
      timer = setInterval(() => {
        setCooldown((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [cooldown]);

  // Run verification once on mount
  useEffect(() => {
    if (verifyAttempted.current) return;
    verifyAttempted.current = true;

    if (!token) {
      setStatus('error');
      setMessage('Invalid Verification Link');
      setErrorDetails('No verification token was provided in the link. Please check your email or log in to request a new link.');
      return;
    }

    const verify = async () => {
      try {
        const response = await verifyEmail(token);
        setStatus('success');
        setMessage(response.data.message || 'Email verified successfully!');
        
        // Auto-redirect to login after 3 seconds on success
        setTimeout(() => {
          navigate('/login?verified=true');
        }, 3000);
      } catch (err) {
        setStatus('error');
        setMessage(err.response?.data?.error || 'Verification Failed');
        setErrorDetails(
          err.response?.data?.expired
            ? 'This verification link has expired. Verification links are only valid for 24 hours.'
            : 'The link might be invalid, or your email has already been verified.'
        );
      }
    };

    verify();
  }, [token, navigate]);

  const handleResend = async (e) => {
    e.preventDefault();
    if (!emailForResend) {
      setErrorDetails('Please enter your email address to request a new link.');
      return;
    }

    setStatus('resending');
    try {
      const response = await resendVerification(emailForResend);
      setStatus('resend_success');
      setMessage(response.data.message || 'Verification email resent successfully!');
      setErrorDetails('');
      setCooldown(60); // 60s cooldown
    } catch (err) {
      setStatus('error');
      setMessage('Failed to resend verification link');
      setErrorDetails(err.response?.data?.error || 'An error occurred while resending the email.');
      if (err.response?.status === 429) {
        // Handle rate limiting from server
        setCooldown(err.response.data.retryAfter || 60);
      }
    }
  };

  return (
    <div className="login-container">
      {/* Animated Background Orbs */}
      <div className="login-background">
        <div className="gradient-orb orb-1"></div>
        <div className="gradient-orb orb-2"></div>
        <div className="gradient-orb orb-3"></div>
      </div>

      {/* Verify Card */}
      <div className="login-card">
        <div className="login-header">
          <div className="logo-container">
            <div className="logo-icon">🎬</div>
            <h1>RedImVi</h1>
          </div>
          <p className="subtitle">Email Verification</p>
        </div>

        <div className="login-form" style={{ textAlign: 'center', gap: '16px' }}>
          {status === 'verifying' && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
              <span className="spinner" style={{ width: '40px', height: '40px', borderWidth: '4px' }}></span>
              <p style={{ color: 'var(--text-secondary)', fontSize: '16px', fontWeight: '500' }}>
                {message}
              </p>
            </div>
          )}

          {status === 'success' && (
            <div>
              <div style={{ fontSize: '48px', color: 'var(--color-success)', marginBottom: '16px' }}>✓</div>
              <p style={{ color: 'var(--color-success)', fontSize: '18px', fontWeight: '700', marginBottom: '8px' }}>
                {message}
              </p>
              <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginBottom: '24px' }}>
                Redirecting you to the login page...
              </p>
              <Link to="/login?verified=true" className="login-button" style={{ textDecoration: 'none' }}>
                Go to Login →
              </Link>
            </div>
          )}

          {(status === 'error' || status === 'resending' || status === 'resend_success') && (
            <div>
              {status === 'resend_success' ? (
                <>
                  <div style={{ fontSize: '48px', color: 'var(--color-success)', marginBottom: '16px' }}>📧</div>
                  <p style={{ color: 'var(--color-success)', fontSize: '18px', fontWeight: '700', marginBottom: '16px' }}>
                    {message}
                  </p>
                </>
              ) : (
                <>
                  <div style={{ fontSize: '48px', color: 'var(--color-error)', marginBottom: '16px' }}>⚠</div>
                  <p style={{ color: 'var(--color-error)', fontSize: '18px', fontWeight: '700', marginBottom: '16px' }}>
                    {message}
                  </p>
                  {errorDetails && (
                    <p style={{ color: 'var(--text-secondary)', fontSize: '14px', lineHeight: '1.6', marginBottom: '24px' }}>
                      {errorDetails}
                    </p>
                  )}
                </>
              )}

              {/* Form to resend verification link */}
              <form onSubmit={handleResend} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div className="input-group" style={{ textAlign: 'left' }}>
                  <label htmlFor="emailForResend">Email Address</label>
                  <div className="input-wrapper">
                    <span className="input-icon">📧</span>
                    <input
                      type="email"
                      id="emailForResend"
                      placeholder="Enter your email"
                      value={emailForResend}
                      onChange={(e) => setEmailForResend(e.target.value)}
                      required
                      disabled={status === 'resending'}
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="login-button"
                  disabled={status === 'resending' || cooldown > 0}
                >
                  {status === 'resending' ? (
                    <>
                      <span className="spinner"></span>
                      Resending Email...
                    </>
                  ) : cooldown > 0 ? (
                    `Resend email in ${cooldown}s`
                  ) : (
                    'Resend Verification Email'
                  )}
                </button>
              </form>
            </div>
          )}
        </div>

        {/* Back to Login link */}
        <div className="signup-prompt">
          <p>
            Remembered your credentials?{' '}
            <Link to="/login" className="signup-link">
              Go to Login
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

export default VerifyEmail;
