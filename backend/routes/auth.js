const express = require('express');
const { register, login,resetPassword, forgotPassword, verifyEmail, resendOtp } = require('../controllers/authController');
const router = express.Router();

router.post('/register', register);
router.get('/verify-email', verifyEmail);  
router.post('/login', login);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);
router.post('/verify-otp', verifyEmail);
router.post('/resend-otp', resendOtp);

module.exports = router;
