import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../utils/api';
import { CheckCircle, XCircle } from 'lucide-react';

const EmailVerification = () => {
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [isOtpSent, setIsOtpSent] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState(''); // 'success' or 'error'
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [darkMode, setDarkMode] = useState(document.documentElement.classList.contains('dark'));
  const navigate = useNavigate();

  // Sync dark mode
  useEffect(() => {
    const observer = new MutationObserver(() => {
      setDarkMode(document.documentElement.classList.contains('dark'));
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);

  const validateForm = () => {
    const newErrors = {};
    if (!email.trim()) newErrors.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(email)) newErrors.email = 'Invalid email format';
    if (isOtpSent) {
      if (!otp.trim()) newErrors.otp = 'OTP is required';
      else if (!/^\d{6}$/.test(otp)) newErrors.otp = 'OTP must be a 6-digit number';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSendOtp = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    setLoading(true);
    setMessage('');
    setMessageType('');

    try {
      await api.post('/auth/resend-otp', { email });
      setIsOtpSent(true);
      setMessage('OTP sent to your email!');
      setMessageType('success');
    } catch (error) {
      setMessage(error.response?.data?.message || 'Failed to send OTP. Please try again.');
      setMessageType('error');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    setLoading(true);
    setMessage('');
    setMessageType('');

    try {
      await api.post('/auth/verify-otp', { email, otp });
      setMessage('Email verified successfully!');
      setMessageType('success');
      setTimeout(() => navigate('/login'), 1500);
    } catch (error) {
      setMessage(error.response?.data?.message || 'Invalid OTP. Please try again.');
      setMessageType('error');
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (!validateForm()) return;
    setLoading(true);
    setMessage('');
    setMessageType('');

    try {
      await api.post('/auth/resend-otp', { email });
      setMessage('OTP resent successfully!');
      setMessageType('success');
    } catch (error) {
      setMessage(error.response?.data?.message || 'Too many requests. Please wait a minute.');
      setMessageType('error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`min-h-screen flex flex-col ${darkMode ? 'dark bg-gray-900' : 'bg-gray-50'}`}>
      <main className="container mx-auto px-4 py-16 flex-grow flex items-center justify-center">
        <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-xl shadow-sm p-8">
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white text-center mb-2">
            Verify Your Email
          </h1>
          <p className="text-gray-500 dark:text-gray-400 text-center mb-6">
            {isOtpSent
              ? `Enter the OTP sent to ${email}.`
              : 'Enter your email to receive a verification OTP.'}
          </p>

          <form onSubmit={isOtpSent ? handleVerifyOtp : handleSendOtp} className="space-y-6">
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
              >
                Email <span className="text-red-500">*</span>
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setErrors({ ...errors, email: '' });
                }}
                disabled={isOtpSent}
                className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all dark:bg-gray-700 dark:text-white dark:border-gray-600 ${
                  errors.email ? 'border-red-500' : 'border-gray-200'
                } ${isOtpSent ? 'bg-gray-100 dark:bg-gray-700 cursor-not-allowed' : ''}`}
                placeholder="Enter your email"
                required
                aria-invalid={errors.email ? 'true' : 'false'}
                aria-describedby={errors.email ? 'email-error' : undefined}
              />
              {errors.email && (
                <p id="email-error" className="mt-1 text-sm text-red-600">{errors.email}</p>
              )}
            </div>

            {isOtpSent && (
              <div>
                <label
                  htmlFor="otp"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                >
                  OTP <span className="text-red-500">*</span>
                </label>
                <input
                  id="otp"
                  type="text"
                  value={otp}
                  onChange={(e) => {
                    setOtp(e.target.value);
                    setErrors({ ...errors, otp: '' });
                  }}
                  className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all dark:bg-gray-700 dark:text-white dark:border-gray-600 ${
                    errors.otp ? 'border-red-500' : 'border-gray-200'
                  }`}
                  placeholder="Enter 6-digit OTP"
                  pattern="\d{6}"
                  maxLength="6"
                  required
                  aria-invalid={errors.otp ? 'true' : 'false'}
                  aria-describedby={errors.otp ? 'otp-error' : undefined}
                />
                {errors.otp && (
                  <p id="otp-error" className="mt-1 text-sm text-red-600">{errors.otp}</p>
                )}
              </div>
            )}

            {message && (
              <div
                className={`p-4 rounded-lg text-sm text-center flex items-center justify-center gap-2 ${
                  messageType === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                }`}
              >
                {messageType === 'success' ? <CheckCircle size={20} /> : <XCircle size={20} />}
                {message}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className={`w-full py-3 px-4 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all dark:bg-blue-500 dark:hover:bg-blue-600 ${
                loading ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              {loading ? (
                <svg
                  className="animate-spin h-5 w-5 mx-auto text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8v8H4z"
                  />
                </svg>
              ) : isOtpSent ? (
                'Verify OTP'
              ) : (
                'Send OTP'
              )}
            </button>

            {isOtpSent && (
              <button
                type="button"
                onClick={handleResendOtp}
                disabled={loading}
                className={`w-full py-3 px-4 bg-gray-600 text-white font-medium rounded-lg hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 transition-all dark:bg-gray-500 dark:hover:bg-gray-600 ${
                  loading ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                {loading ? (
                  <svg
                    className="animate-spin h-5 w-5 mx-auto text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8v8H4z"
                    />
                  </svg>
                ) : (
                  'Resend OTP'
                )}
              </button>
            )}
          </form>

          {isOtpSent && (
            <p className="mt-4 text-center text-sm text-gray-600 dark:text-gray-400">
              <button
                type="button"
                onClick={() => {
                  setIsOtpSent(false);
                  setOtp('');
                  setErrors({});
                  setMessage('');
                }}
                className="text-blue-600 dark:text-blue-400 hover:underline"
              >
                Change Email
              </button>
            </p>
          )}

          <p className="mt-4 text-center text-sm text-gray-600 dark:text-gray-400">
            Back to{' '}
            <Link to="/login" className="text-blue-600 dark:text-blue-400 hover:underline">
              Log in
            </Link>
          </p>
        </div>
      </main>

      <footer className="bg-gray-800 dark:bg-gray-900 text-white py-8 mt-auto">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <h3 className="text-lg font-semibold mb-4">Lost & Found</h3>
              <p className="text-gray-400 text-sm">
                Helping you reconnect with your lost items or find owners for found treasures.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4">Quick Links</h3>
              <ul className="space-y-2">
                <li><Link to="/" className="text-gray-400 hover:text-white text-sm transition-colors">Dashboard</Link></li>
                <li><Link to="/report" className="text-gray-400 hover:text-white text-sm transition-colors">Report Item</Link></li>
                <li><Link to="/claim" className="text-gray-400 hover:text-white text-sm transition-colors">Claim Item</Link></li>
                <li><Link to="/profile" className="text-gray-400 hover:text-white text-sm transition-colors">Profile</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4">Contact</h3>
              <p className="text-gray-400 text-sm">Email: support@lostfound.com</p>
              <p className="text-gray-400 text-sm">Phone: (123) 456-7890</p>
            </div>
          </div>
          <div className="mt-8 border-t border-gray-700 pt-4 text-center">
            <p className="text-gray-400 text-sm">© {new Date().getFullYear()} Lost & Found. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default EmailVerification;