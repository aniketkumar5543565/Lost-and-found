const pool = require('../config/db');
require('dotenv').config();

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { sendVerificationEmail, sendEmailForgotPassword } = require('../utils/email');

const JWT_SECRET = process.env.JWT_SECRET; // Change for production

// REGISTER USER
exports.register = (req, res) => {
  const { name, email, password, role = 'user' } = req.body;
  const salt = bcrypt.genSaltSync(10);
  const hash = bcrypt.hashSync(password, salt);
  const otp = crypto.randomInt(100000, 1000000).toString(); // 6-digit OTP
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // Expires in 10 minutes

  // Check if user already exists
  pool.query(
    'SELECT * FROM users WHERE email = ?',
    [email],
    (err, results) => {
      if (err) {
        console.error('Error fetching user:', err);
        return res.status(500).json({ message: 'Internal server error' });
      }

      if (results.length !== 0) {
        if (results[0].verified) {
          return res.status(400).json({ message: 'Email already exists, please log in' });
        }
        return res.status(400).json({ message: 'Email already exists, please verify your email' });
      }

      // Insert user
      pool.query(
        'INSERT INTO users (name, email, password, verified, role) VALUES (?, ?, ?, ?, ?)',
        [name, email, hash, 0, role],
        (err, result) => {
          if (err) {
            console.error('Error registering user:', err);
            return res.status(500).json({ message: 'Error registering user' });
          }

          const userId = result.insertId;

          // Insert OTP
          pool.query(
            'INSERT INTO otp_verification (user_id, otp_code, expires_at) VALUES (?, ?, ?)',
            [userId, otp, expiresAt],
            (otpErr) => {
              if (otpErr) {
                console.error('Error storing OTP:', otpErr);
                return res.status(500).json({ message: 'Error storing OTP' });
              }

              // Send verification email
              sendVerificationEmail(email, otp);
              res.status(201).json({ message: 'User registered. Please check your email for OTP verification.' });
            }
          );
        }
      );
    }
  );
};

// VERIFY EMAIL
exports.verifyEmail = (req, res) => {
  const { email, otp } = req.body;

  if (!email || !otp) {
    return res.status(400).json({ message: 'Email and OTP are required' });
  }

  // Find user and OTP
  pool.query(
    `SELECT u.id, u.email, o.otp_code, o.expires_at 
     FROM users u 
     JOIN otp_verification o ON u.id = o.user_id 
     WHERE u.email = ? AND o.otp_code = ?`,
    [email, otp],
    (err, results) => {
      if (err) {
        console.error('Error fetching OTP:', err);
        return res.status(500).json({ message: 'Internal server error' });
      }

      if (results.length === 0) {
        return res.status(400).json({ message: 'Invalid OTP or email' });
      }

      const { expires_at, id: userId } = results[0];

      // Check OTP expiration
      if (new Date() > new Date(expires_at)) {
        return res.status(400).json({ message: 'OTP has expired' });
      }

      // Mark user as verified
      pool.query(
        'UPDATE users SET verified = 1 WHERE id = ?',
        [userId],
        (updateErr) => {
          if (updateErr) {
            console.error('Error updating verification:', updateErr);
            return res.status(500).json({ message: 'Error updating verification status' });
          }

          // Clear OTP
          pool.query(
            'DELETE FROM otp_verification WHERE user_id = ? AND otp_code = ?',
            [userId, otp],
            (deleteErr) => {
              if (deleteErr) {
                console.error('Error deleting OTP:', deleteErr);
              }

              res.status(200).json({ message: 'Email verified successfully' });
            }
          );
        }
      );
    }
  );
};

// RESEND OTP
exports.resendOtp = (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ message: 'Email is required' });
  }

  pool.query(
    'SELECT id FROM users WHERE email = ?',
    [email],
    (err, results) => {
      if (err) {
        console.error('Error fetching user:', err);
        return res.status(500).json({ message: 'Internal server error' });
      }

      if (results.length === 0) {
        return res.status(400).json({ message: 'Email not found' });
      }

      const userId = results[0].id;
      const otp = crypto.randomInt(100000, 1000000).toString();
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

      // Clear existing OTPs for this user
      pool.query(
        'DELETE FROM otp_verification WHERE user_id = ?',
        [userId],
        (deleteErr) => {
          if (deleteErr) {
            console.error('Error deleting old OTPs:', deleteErr);
            return res.status(500).json({ message: 'Error clearing old OTPs' });
          }

          // Insert new OTP
          pool.query(
            'INSERT INTO otp_verification (user_id, otp_code, expires_at) VALUES (?, ?, ?)',
            [userId, otp, expiresAt],
            (otpErr) => {
              if (otpErr) {
                console.error('Error storing OTP:', otpErr);
                return res.status(500).json({ message: 'Error storing OTP' });
              }

              // Send verification email
              sendVerificationEmail(email, otp);
              res.status(200).json({ message: 'OTP resent successfully' });
            }
          );
        }
      );
    }
  );
};

// FORGOT PASSWORD
exports.forgotPassword = (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ message: 'Email is required' });
  }

  pool.query(
    'SELECT id, verified FROM users WHERE email = ?',
    [email],
    (err, results) => {
      if (err) {
        console.error('Error fetching user:', err);
        return res.status(500).json({ message: 'Internal server error' });
      }

      if (results.length === 0) {
        return res.status(400).json({ message: 'Email not found' });
      }

      const user = results[0];

      if (!user.verified) {
        return res.status(400).json({ message: 'Please verify your email first' });
      }

      const otp = crypto.randomInt(100000, 1000000).toString();
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

      // Clear existing OTPs for this user
      pool.query(
        'DELETE FROM otp_verification WHERE user_id = ?',
        [user.id],
        (deleteErr) => {
          if (deleteErr) {
            console.error('Error deleting old OTPs:', deleteErr);
            return res.status(500).json({ message: 'Error clearing old OTPs' });
          }

          // Insert new OTP
          pool.query(
            'INSERT INTO otp_verification (user_id, otp_code, expires_at) VALUES (?, ?, ?)',
            [user.id, otp, expiresAt],
            (otpErr) => {
              if (otpErr) {
                console.error('Error storing OTP:', otpErr);
                return res.status(500).json({ message: 'Error storing OTP' });
              }

              // Send password reset email
              sendEmailForgotPassword(email, otp);
              res.status(200).json({ message: 'Password reset OTP sent to email' });
            }
          );
        }
      );
    }
  );
};

// RESET PASSWORD
exports.resetPassword = (req, res) => {
  const { email, otp, password } = req.body;

  if (!email || !otp || !password) {
    return res.status(400).json({ message: 'Email, OTP, and password are required' });
  }

  // Find user and OTP
  pool.query(
    `SELECT u.id, u.email, u.password, o.otp_code, o.expires_at 
     FROM users u 
     JOIN otp_verification o ON u.id = o.user_id 
     WHERE u.email = ? AND o.otp_code = ?`,
    [email, otp],
    (err, results) => {
      if (err) {
        console.error('Error fetching OTP:', err);
        return res.status(500).json({ message: 'Internal server error' });
      }

      if (results.length === 0) {
        return res.status(400).json({ message: 'Invalid OTP or email' });
      }

      const { id: userId, password: currentPassword, expires_at } = results[0];

      // Check OTP expiration
      if (new Date() > new Date(expires_at)) {
        return res.status(400).json({ message: 'OTP has expired' });
      }

      // Check if new password is the same as the current one
      const isMatch = bcrypt.compareSync(password, currentPassword);
      if (isMatch) {
        return res.status(400).json({ message: 'New password cannot be the same as the current password' });
      }

      const salt = bcrypt.genSaltSync(10);
      const hash = bcrypt.hashSync(password, salt);

      // Update password
      pool.query(
        'UPDATE users SET password = ? WHERE id = ?',
        [hash, userId],
        (updateErr) => {
          if (updateErr) {
            console.error('Error updating password:', updateErr);
            return res.status(500).json({ message: 'Error updating password' });
          }

          // Clear OTP
          pool.query(
            'DELETE FROM otp_verification WHERE user_id = ? AND otp_code = ?',
            [userId, otp],
            (deleteErr) => {
              if (deleteErr) {
                console.error('Error deleting OTP:', deleteErr);
              }

              res.status(200).json({ message: 'Password reset successfully' });
            }
          );
        }
      );
    }
  );
};

// LOGIN USER
exports.login = (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required' });
  }

  pool.query(
    'SELECT * FROM users WHERE email = ?',
    [email],
    (err, results) => {
      if (err) {
        console.error('Error fetching user:', err);
        return res.status(500).json({ message: 'Internal server error' });
      }

      if (results.length === 0) {
        return res.status(400).json({ message: 'Email not found' });
      }

      const user = results[0];

      if (!user.verified) {
        return res.status(400).json({ message: 'Please verify your email first' });
      }

      const isMatch = bcrypt.compareSync(password, user.password);
      if (!isMatch) {
        return res.status(400).json({ message: 'Incorrect password' });
      }

      const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '1d' });
      res.status(200).json({ 
        token, 
        user: { id: user.id, name: user.name, email: user.email, role: user.role } 
      });
    }
  );
};