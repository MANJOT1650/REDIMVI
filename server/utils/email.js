// ─────────────────────────────────────────────────────────────────────────────
// Email Utility — sends verification emails via SMTP (Nodemailer)
// ─────────────────────────────────────────────────────────────────────────────
// Configure via environment variables:
//   SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM
//
// Works with any SMTP provider (Gmail, Outlook, SendGrid, Resend, AWS SES).
// For Gmail: enable 2FA → create an App Password → use it as SMTP_PASS.
// ─────────────────────────────────────────────────────────────────────────────

const nodemailer = require('nodemailer');

// Create reusable SMTP transport — connection is pooled automatically
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT, 10) || 587,
  secure: false, // true for 465, false for 587 (STARTTLS)
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

/**
 * Send the email verification link to a newly registered user.
 *
 * @param {string} toEmail     – recipient address
 * @param {string} username    – display name for the greeting
 * @param {string} verifyUrl   – full verification URL with token
 */
const sendVerificationEmail = async (toEmail, username, verifyUrl) => {
  const mailOptions = {
    from: process.env.SMTP_FROM || `"Redimvi" <${process.env.SMTP_USER}>`,
    to: toEmail,
    subject: 'Verify your Redimvi account',

    // Plain-text fallback
    text: `Hi ${username},\n\nWelcome to Redimvi! Please verify your email by visiting:\n${verifyUrl}\n\nThis link expires in 24 hours.\n\nIf you didn't create this account, you can safely ignore this email.\n\n— The Redimvi Team`,

    // Styled HTML email
    html: `
      <!DOCTYPE html>
      <html lang="en">
      <head><meta charset="UTF-8"></head>
      <body style="margin:0;padding:0;background:#0f0f23;font-family:'Segoe UI',Roboto,Arial,sans-serif;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background:#0f0f23;padding:40px 20px;">
          <tr>
            <td align="center">
              <table width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:linear-gradient(135deg,#1a1a2e 0%,#16213e 100%);border-radius:16px;border:1px solid rgba(102,126,234,0.2);overflow:hidden;">
                <!-- Header -->
                <tr>
                  <td style="padding:40px 40px 24px;text-align:center;">
                    <div style="font-size:40px;margin-bottom:8px;">🎬</div>
                    <h1 style="margin:0;font-size:28px;font-weight:800;background:linear-gradient(135deg,#667eea,#764ba2);-webkit-background-clip:text;-webkit-text-fill-color:transparent;">RedImVi</h1>
                  </td>
                </tr>
                <!-- Body -->
                <tr>
                  <td style="padding:0 40px 32px;">
                    <h2 style="margin:0 0 12px;color:#e0e0ff;font-size:20px;font-weight:600;">Hi ${username} 👋</h2>
                    <p style="margin:0 0 24px;color:#a0a0c0;font-size:15px;line-height:1.6;">
                      Welcome to Redimvi! Please verify your email address to activate your account and start compressing media.
                    </p>
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td align="center">
                          <a href="${verifyUrl}" style="display:inline-block;padding:14px 36px;background:linear-gradient(135deg,#667eea 0%,#764ba2 100%);color:#ffffff;text-decoration:none;border-radius:10px;font-size:16px;font-weight:700;box-shadow:0 4px 15px rgba(102,126,234,0.4);">
                            ✓&nbsp; Verify My Email
                          </a>
                        </td>
                      </tr>
                    </table>
                    <p style="margin:24px 0 0;color:#6a6a8e;font-size:13px;line-height:1.5;">
                      This link expires in <strong style="color:#a0a0c0;">24 hours</strong>.<br/>
                      If you didn't create this account, you can safely ignore this email.
                    </p>
                  </td>
                </tr>
                <!-- Footer -->
                <tr>
                  <td style="padding:20px 40px;border-top:1px solid rgba(102,126,234,0.1);text-align:center;">
                    <p style="margin:0;color:#4a4a6a;font-size:12px;letter-spacing:0.5px;">Secure • Fast • Reliable</p>
                  </td>
                </tr>
              </table>
              <!-- Sub-footer -->
              <p style="margin:20px 0 0;color:#3a3a5a;font-size:11px;">
                Can't click the button? Copy and paste this link:<br/>
                <a href="${verifyUrl}" style="color:#667eea;word-break:break-all;">${verifyUrl}</a>
              </p>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('✓ Verification email sent to', toEmail, '| Message ID:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('✗ Failed to send verification email:', error.message);
    throw new Error('Failed to send verification email. Please try again later.');
  }
};

module.exports = { sendVerificationEmail };
