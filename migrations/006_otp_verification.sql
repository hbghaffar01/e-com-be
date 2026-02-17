-- OTP Verification and Email Verification

-- Add email_verified column to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT FALSE;

-- Create user_otps table for storing OTP codes
CREATE TABLE IF NOT EXISTS user_otps (
  id SERIAL PRIMARY KEY,
  email TEXT NOT NULL,
  otp_code TEXT NOT NULL,
  purpose TEXT NOT NULL DEFAULT 'signup', -- 'signup', 'login', 'password_reset'
  expires_at TIMESTAMPTZ NOT NULL,
  verified BOOLEAN DEFAULT FALSE,
  attempts INTEGER DEFAULT 0, -- Track failed verification attempts
  signup_data JSONB, -- Store temporary signup data for signup OTPs
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_otp_email ON user_otps(email);
CREATE INDEX IF NOT EXISTS idx_otp_email_purpose ON user_otps(email, purpose);
CREATE INDEX IF NOT EXISTS idx_otp_expires ON user_otps(expires_at);

-- Clean up expired OTPs older than 24 hours (can be run periodically)
-- This is just a comment for reference, actual cleanup should be done via cron job or scheduled task
