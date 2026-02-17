const nodemailer = require('nodemailer');
require('dotenv').config();

// Create reusable transporter object using SMTP transport
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.EMAIL_PORT || '587'),
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// Verify transporter configuration
transporter.verify(function (error, success) {
  if (error) {
    console.log('Email service configuration error:', error);
  } else {
    console.log('Email service is ready to send messages');
  }
});

/**
 * Send OTP email to user
 * @param {string} email - Recipient email address
 * @param {string} otpCode - 6-digit OTP code
 * @param {string} purpose - Purpose of OTP (signup, login, password_reset)
 * @returns {Promise<Object>} - Email send result
 */
async function sendOtpEmail(email, otpCode, purpose = 'signup') {
  const purposeText = {
    signup: 'Email Verification',
    login: 'Login Verification',
    password_reset: 'Password Reset'
  }[purpose] || 'Verification';

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${purposeText} - Bazaarly</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
      <table role="presentation" style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="padding: 20px 0; text-align: center; background-color: #1e40af;">
            <h1 style="color: #ffffff; margin: 0; font-size: 28px;">Bazaarly</h1>
          </td>
        </tr>
        <tr>
          <td style="padding: 40px 20px; background-color: #ffffff;">
            <table role="presentation" style="width: 100%; max-width: 600px; margin: 0 auto;">
              <tr>
                <td>
                  <h2 style="color: #1e40af; margin-top: 0;">${purposeText}</h2>
                  <p style="color: #333333; font-size: 16px; line-height: 1.6;">
                    Your verification code is:
                  </p>
                  <div style="background-color: #f3f4f6; border: 2px dashed #1e40af; border-radius: 8px; padding: 20px; text-align: center; margin: 30px 0;">
                    <h1 style="color: #1e40af; font-size: 36px; letter-spacing: 8px; margin: 0; font-family: 'Courier New', monospace;">
                      ${otpCode}
                    </h1>
                  </div>
                  <p style="color: #666666; font-size: 14px; line-height: 1.6;">
                    This code will expire in <strong>10 minutes</strong>. Please do not share this code with anyone.
                  </p>
                  <p style="color: #666666; font-size: 14px; line-height: 1.6; margin-top: 20px;">
                    If you didn't request this code, please ignore this email.
                  </p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
        <tr>
          <td style="padding: 20px; text-align: center; background-color: #f9fafb;">
            <p style="color: #6b7280; font-size: 12px; margin: 0;">
              © ${new Date().getFullYear()} Bazaarly. All rights reserved.
            </p>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;

  const textContent = `
    ${purposeText} - Bazaarly
    
    Your verification code is: ${otpCode}
    
    This code will expire in 10 minutes. Please do not share this code with anyone.
    
    If you didn't request this code, please ignore this email.
    
    © ${new Date().getFullYear()} Bazaarly. All rights reserved.
  `;

  const mailOptions = {
    from: process.env.EMAIL_FROM || process.env.EMAIL_USER || 'noreply@bazaarly.com',
    to: email,
    subject: `${purposeText} - Your OTP Code`,
    text: textContent,
    html: htmlContent
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('OTP email sent successfully:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Error sending OTP email:', error);
    throw new Error('Failed to send OTP email. Please try again later.');
  }
}

module.exports = {
  sendOtpEmail
};
