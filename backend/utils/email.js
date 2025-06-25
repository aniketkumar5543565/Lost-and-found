// utils/email.js
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail', // you can use another service
  auth: {
    user: 'kumarvinay86618@gmail.com', // replace with your email
    pass: 'tswa kmkf ijer gzut'   // replace with your email password or app password
  }
});

// Send verification email with OTP
exports.sendVerificationEmail = async (email, otp) => {
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: 'Verify Your Email - OTP',
    html: `
      <h2>Email Verification</h2>
      <p>Your One-Time Password (OTP) is: <strong>${otp}</strong></p>
      <p>Please enter this OTP in the verification form to verify your email.</p>
      <p>This OTP is valid for 10 minutes.</p>
    `,
  };

  await transporter.sendMail(mailOptions);
};

// Send forgot password email with OTP
exports.sendEmailForgotPassword = async (email, otp) => {
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: 'Password Reset - OTP',
    html: `
      <h2>Reset Your Password</h2>
      <p>Your One-Time Password (OTP) is: <strong>${otp}</strong></p>
      <p>Please enter this OTP and your new password in the reset form.</p>
      <p>This OTP is valid for 10 minutes.</p>
    `,
  };

  await transporter.sendMail(mailOptions);
};