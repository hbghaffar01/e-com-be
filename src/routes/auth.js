const express = require('express');
const router = express.Router();
const db = require('../db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { sendOtpEmail } = require('../utils/emailService');

const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret';

function signToken(user) {
  return jwt.sign({ sub: user.id, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
}

// Generate 6-digit OTP
function generateOtp() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Check if email already exists
async function emailExists(email) {
  if (!email) return false;
  const result = await db.query('SELECT id FROM users WHERE email = $1', [email]);
  return result.rows.length > 0;
}

// Invalidate old OTPs for an email
async function invalidateOldOtps(email, purpose) {
  await db.query(
    'UPDATE user_otps SET verified = true WHERE email = $1 AND purpose = $2 AND verified = false',
    [email, purpose]
  );
}

// POST /api/auth/signup - Send OTP instead of creating user
router.post('/signup', async (req, res, next) => {
  try {
    const { name, email, username, password, phone, role = 'customer', merchantCompanyName, taxId } = req.body || {};
    if (!email && !username) return res.status(400).json({ error: 'email or username required' });
    if (!password || String(password).length < 6) return res.status(400).json({ error: 'password min length 6' });

    // Check if email already exists
    if (email && await emailExists(email)) {
      return res.status(400).json({ error: 'email already registered' });
    }

    // Check if username already exists
    if (username) {
      const usernameCheck = await db.query('SELECT id FROM users WHERE username = $1', [username]);
      if (usernameCheck.rows.length > 0) {
        return res.status(400).json({ error: 'username already taken' });
      }
    }

    // Generate OTP
    const otpCode = generateOtp();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes from now

    // Invalidate old OTPs for this email
    await invalidateOldOtps(email || '', 'signup');

    // Store OTP in database (we'll store signup data temporarily in a JSON field or use email as key)
    // For now, we'll store the signup data in the OTP record's purpose field or create a temp signup data table
    // Since we need to store signup data, we'll use a JSONB approach or store it separately
    // For simplicity, we'll store it in a temporary signup_data table or use the OTP table with additional fields
    // Actually, let's store the signup data as JSON in a separate approach - we'll need to store it somewhere
    // For MVP, let's store it in localStorage on frontend and send it again during verify-otp
    // But for better security, let's create a temp_signup_data approach
    
    // Store OTP with signup data
    const signupData = {
      name,
      email,
      username,
      password: await bcrypt.hash(String(password), 10), // Hash password before storing
      phone,
      role,
      merchantCompanyName,
      taxId
    };

    await db.query(
      `INSERT INTO user_otps (email, otp_code, purpose, expires_at, verified, attempts, signup_data)
       VALUES ($1, $2, $3, $4, false, 0, $5)`,
      [email || '', otpCode, 'signup', expiresAt, JSON.stringify(signupData)]
    );

    // Store signup data temporarily (we'll use a simple approach: store as JSON in a temp table or use the OTP record)
    // For now, let's create a simple approach: store signup data in a JSON column in user_otps
    // Actually, let's add a signup_data JSONB column to user_otps table
    // But for now, let's use a simpler approach: frontend will send signup data again during verify-otp
    // OR we can add a temp_signup_data table
    
    // Send OTP email
    if (email) {
      try {
        await sendOtpEmail(email, otpCode, 'signup');
      } catch (emailError) {
        console.error('Failed to send OTP email:', emailError);
        return res.status(500).json({ error: 'Failed to send OTP email. Please try again later.' });
      }
    }

    res.status(200).json({ 
      success: true, 
      message: email ? 'OTP sent to your email' : 'OTP generated (email not provided)',
      email: email || null
    });
  } catch (e) { 
    console.error('Signup error:', e);
    next(e); 
  }
});

// POST /api/auth/verify-otp
router.post('/verify-otp', async (req, res, next) => {
  try {
    const { email, otp } = req.body || {};
    if (!email || !otp) return res.status(400).json({ error: 'email and otp required' });

    // Find the most recent unverified OTP for this email
    const otpResult = await db.query(
      `SELECT * FROM user_otps 
       WHERE email = $1 AND purpose = 'signup' AND verified = false 
       ORDER BY created_at DESC LIMIT 1`,
      [email]
    );

    if (otpResult.rows.length === 0) {
      return res.status(400).json({ error: 'No OTP found. Please request a new OTP.' });
    }

    const otpRecord = otpResult.rows[0];

    // Check if OTP is expired
    if (new Date(otpRecord.expires_at) < new Date()) {
      return res.status(400).json({ error: 'OTP has expired. Please request a new OTP.' });
    }

    // Check if too many attempts
    if (otpRecord.attempts >= 5) {
      return res.status(400).json({ error: 'Too many failed attempts. Please request a new OTP.' });
    }

    // Verify OTP
    if (otpRecord.otp_code !== otp) {
      // Increment attempts
      await db.query(
        'UPDATE user_otps SET attempts = attempts + 1 WHERE id = $1',
        [otpRecord.id]
      );
      return res.status(400).json({ error: 'Invalid OTP code. Please try again.' });
    }

    // OTP is valid - create user
    // Parse signup_data if it's a string (JSONB from PostgreSQL)
    let signupData = otpRecord.signup_data;
    if (typeof signupData === 'string') {
      try {
        signupData = JSON.parse(signupData);
      } catch (e) {
        return res.status(400).json({ error: 'Invalid signup data. Please sign up again.' });
      }
    }
    if (!signupData) {
      return res.status(400).json({ error: 'Signup data not found. Please sign up again.' });
    }

    const id = 'U-' + Math.random().toString(36).slice(2, 10);
    const roleVal = signupData.role || 'customer';

    // Create user
    await db.query(
      `INSERT INTO users (id, email, username, password_hash, name, phone, role, email_verified) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [
        id,
        signupData.email || null,
        signupData.username || null,
        signupData.password,
        signupData.name || null,
        signupData.phone || null,
        roleVal,
        true // Email verified
      ]
    );

    // Create merchant if applicable
    let merchant_id = null;
    if (roleVal === 'merchant' && signupData.merchantCompanyName) {
      merchant_id = 'M-' + Math.random().toString(36).slice(2, 10);
      await db.query(
        `INSERT INTO merchants (id, company_name, owner_name, email, phone, tax_id, store_status, joined_date)
         VALUES ($1, $2, $3, $4, $5, $6, 'Approved', NOW())`,
        [merchant_id, signupData.merchantCompanyName, signupData.name || '', signupData.email || '', signupData.phone || '', signupData.taxId || null]
      );
      await db.query(`UPDATE users SET merchant_id = $1 WHERE id = $2`, [merchant_id, id]);
    }

    // Mark OTP as verified
    await db.query('UPDATE user_otps SET verified = true WHERE id = $1', [otpRecord.id]);

    // Generate token
    const token = signToken({ id, role: roleVal });
    res.status(201).json({ 
      token, 
      user: { 
        id, 
        name: signupData.name, 
        email: signupData.email, 
        phone: signupData.phone, 
        role: roleVal 
      } 
    });
  } catch (e) {
    console.error('Verify OTP error:', e);
    next(e);
  }
});

// POST /api/auth/resend-otp
router.post('/resend-otp', async (req, res, next) => {
  try {
    const { email } = req.body || {};
    if (!email) return res.status(400).json({ error: 'email required' });

    // Check if there's a pending signup OTP
    const otpResult = await db.query(
      `SELECT * FROM user_otps 
       WHERE email = $1 AND purpose = 'signup' AND verified = false 
       ORDER BY created_at DESC LIMIT 1`,
      [email]
    );

    if (otpResult.rows.length === 0) {
      return res.status(400).json({ error: 'No pending signup found. Please sign up again.' });
    }

    const oldOtp = otpResult.rows[0];

    // Check cooldown - prevent resending too quickly (minimum 30 seconds between resends)
    const thirtySecondsAgo = new Date(Date.now() - 30 * 1000);
    const recentResend = await db.query(
      `SELECT created_at FROM user_otps 
       WHERE email = $1 AND purpose = 'signup' AND created_at > $2 
       ORDER BY created_at DESC LIMIT 1`,
      [email, thirtySecondsAgo]
    );

    if (recentResend.rows.length > 0) {
      return res.status(429).json({ error: 'Please wait 30 seconds before requesting another OTP.' });
    }

    // Check rate limiting - max 5 OTPs per hour (excluding verified/invalidated ones)
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const recentOtps = await db.query(
      `SELECT COUNT(*) as count FROM user_otps 
       WHERE email = $1 AND purpose = 'signup' AND created_at > $2 AND verified = false`,
      [email, oneHourAgo]
    );

    if (parseInt(recentOtps.rows[0].count) >= 5) {
      return res.status(429).json({ error: 'Too many OTP requests. Please try again later.' });
    }

    // Generate new OTP
    const otpCode = generateOtp();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Invalidate old OTPs
    await invalidateOldOtps(email, 'signup');

    // Store new OTP with same signup data
    await db.query(
      `INSERT INTO user_otps (email, otp_code, purpose, expires_at, verified, attempts, signup_data)
       VALUES ($1, $2, $3, $4, false, 0, $5)`,
      [email, otpCode, 'signup', expiresAt, oldOtp.signup_data]
    );

    // Send OTP email
    try {
      await sendOtpEmail(email, otpCode, 'signup');
      res.json({ success: true, message: 'OTP resent to your email' });
    } catch (emailError) {
      console.error('Failed to send OTP email:', emailError);
      return res.status(500).json({ error: 'Failed to send OTP email. Please try again later.' });
    }
  } catch (e) {
    console.error('Resend OTP error:', e);
    next(e);
  }
});

// POST /api/auth/signin
router.post('/signin', async (req, res, next) => {
  try {
    const { identifier, password } = req.body || {};
    if (!identifier || !password) return res.status(400).json({ error: 'identifier and password required' });

    const byEmail = identifier.includes('@');
    const q = byEmail ? 'SELECT * FROM users WHERE email = $1' : 'SELECT * FROM users WHERE username = $1';
    const result = await db.query(q, [identifier]);
    if (result.rows.length === 0) return res.status(401).json({ error: 'invalid credentials' });

    const user = result.rows[0];
    
    // Check if email is verified
    if (!user.email_verified) {
      return res.status(403).json({ error: 'Email not verified. Please verify your email first.' });
    }

    const ok = await bcrypt.compare(String(password), user.password_hash);
    if (!ok) return res.status(401).json({ error: 'invalid credentials' });

    const token = signToken({ id: user.id, role: user.role });
    res.json({ token, user: { id: user.id, name: user.name, email: user.email, phone: user.phone, role: user.role } });
  } catch (e) { next(e); }
});

// GET /api/auth/me
router.get('/me', async (req, res, next) => {
  try {
    const auth = req.headers.authorization || '';
    const token = auth.startsWith('Bearer ') ? auth.slice(7) : null;
    if (!token) return res.status(401).json({ error: 'missing token' });
    let payload;
    try { payload = jwt.verify(token, JWT_SECRET); } catch { return res.status(401).json({ error: 'invalid token' }); }

    const result = await db.query('SELECT id, name, email, phone, role, avatar_url, email_verified FROM users WHERE id = $1', [payload.sub]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'user not found' });
    
    // Update last login
    await db.query('UPDATE users SET last_login = NOW() WHERE id = $1', [payload.sub]);
    
    res.json({ user: result.rows[0] });
  } catch (e) { next(e); }
});

// PUT /api/auth/profile
router.put('/profile', async (req, res, next) => {
  try {
    const auth = req.headers.authorization || '';
    const token = auth.startsWith('Bearer ') ? auth.slice(7) : null;
    if (!token) return res.status(401).json({ error: 'missing token' });
    let payload;
    try { payload = jwt.verify(token, JWT_SECRET); } catch { return res.status(401).json({ error: 'invalid token' }); }

    const { name, phone, avatar_url } = req.body;
    
    await db.query(
      `UPDATE users SET 
       name = COALESCE($1, name),
       phone = COALESCE($2, phone),
       avatar_url = COALESCE($3, avatar_url)
       WHERE id = $4`,
      [name, phone, avatar_url, payload.sub]
    );
    
    const result = await db.query('SELECT id, name, email, phone, role, avatar_url, email_verified FROM users WHERE id = $1', [payload.sub]);
    res.json({ user: result.rows[0] });
  } catch (e) { next(e); }
});

// POST /api/auth/change-password
router.post('/change-password', async (req, res, next) => {
  try {
    const auth = req.headers.authorization || '';
    const token = auth.startsWith('Bearer ') ? auth.slice(7) : null;
    if (!token) return res.status(401).json({ error: 'missing token' });
    let payload;
    try { payload = jwt.verify(token, JWT_SECRET); } catch { return res.status(401).json({ error: 'invalid token' }); }

    const { currentPassword, newPassword } = req.body;
    
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Current password and new password required' });
    }
    
    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'New password must be at least 6 characters' });
    }
    
    // Verify current password
    const userResult = await db.query('SELECT password_hash FROM users WHERE id = $1', [payload.sub]);
    if (userResult.rows.length === 0) return res.status(404).json({ error: 'user not found' });
    
    const isValidPassword = await bcrypt.compare(currentPassword, userResult.rows[0].password_hash);
    if (!isValidPassword) {
      return res.status(400).json({ error: 'Current password is incorrect' });
    }
    
    // Update password
    const newHash = await bcrypt.hash(newPassword, 10);
    await db.query('UPDATE users SET password_hash = $1 WHERE id = $2', [newHash, payload.sub]);
    
    res.json({ success: true, message: 'Password updated successfully' });
  } catch (e) { next(e); }
});

// POST /api/auth/forgot-password
router.post('/forgot-password', async (req, res, next) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }
    
    const userResult = await db.query('SELECT id FROM users WHERE email = $1', [email]);
    
    // Always return success to prevent email enumeration
    if (userResult.rows.length === 0) {
      return res.json({ success: true, message: 'If the email exists, a reset link has been sent' });
    }
    
    const userId = userResult.rows[0].id;
    const resetToken = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    const expiresAt = new Date(Date.now() + 3600000); // 1 hour from now
    
    // Store reset token
    await db.query(
      'INSERT INTO password_reset_tokens (user_id, token, expires_at) VALUES ($1, $2, $3)',
      [userId, resetToken, expiresAt]
    );
    
    // In production, send email here
    console.log(`Password reset token for ${email}: ${resetToken}`);
    
    res.json({ success: true, message: 'If the email exists, a reset link has been sent' });
  } catch (e) { next(e); }
});

// POST /api/auth/reset-password
router.post('/reset-password', async (req, res, next) => {
  try {
    const { token, newPassword } = req.body;
    
    if (!token || !newPassword) {
      return res.status(400).json({ error: 'Token and new password are required' });
    }
    
    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }
    
    // Find valid token
    const tokenResult = await db.query(
      'SELECT user_id FROM password_reset_tokens WHERE token = $1 AND expires_at > NOW() AND used = FALSE',
      [token]
    );
    
    if (tokenResult.rows.length === 0) {
      return res.status(400).json({ error: 'Invalid or expired token' });
    }
    
    const userId = tokenResult.rows[0].user_id;
    
    // Update password
    const newHash = await bcrypt.hash(newPassword, 10);
    await db.query('UPDATE users SET password_hash = $1 WHERE id = $2', [newHash, userId]);
    
    // Mark token as used
    await db.query('UPDATE password_reset_tokens SET used = TRUE WHERE token = $1', [token]);
    
    res.json({ success: true, message: 'Password reset successfully' });
  } catch (e) { next(e); }
});

module.exports = router;