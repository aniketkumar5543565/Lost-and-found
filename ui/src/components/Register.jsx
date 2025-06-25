import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../utils/api';
import { UserPlus, CheckCircle, XCircle } from 'lucide-react';

const Register = () => {
  const [formData, setFormData] = useState({ name: '', email: '', password: '', confirmPassword: '' });
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState(''); // 'success' or 'error'
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
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
    if (!formData.name.trim()) newErrors.name = 'Name is required';
    else if (formData.name.length < 2) newErrors.name = 'Name must be at least 2 characters';
    if (!formData.email.trim()) newErrors.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = 'Invalid email format';
    if (!formData.password) newErrors.password = 'Password is required';
    else if (formData.password.length < 8) newErrors.password = 'Password must be at least 8 characters';
    else if (!/[A-Z]/.test(formData.password)) newErrors.password = 'Password must include an uppercase letter';
    else if (!/[0-9]/.test(formData.password)) newErrors.password = 'Password must include a number';
    if (formData.password !== formData.confirmPassword) newErrors.confirmPassword = 'Passwords do not match';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setErrors({ ...errors, [e.target.name]: '' });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    setLoading(true);
    try {
      const payload = {
        name: formData.name,
        email: formData.email,
        password: formData.password,
        role: 'user', // Default role; admins assigned manually
      };
      const res = await api.post('/auth/register', payload);
      setMessage(res.data.message || 'Registration successful! Please verify your email.');
      setMessageType('success');
      setTimeout(() => navigate('/verify-email'), 1500); // Redirect to email verification
    } catch (error) {
      setMessage(error.response?.data?.message || 'Registration failed. Please try again.');
      setMessageType('error');
    } finally {
      setLoading(false);
    }
  };

  const handleSocialLogin = (provider) => {
    // Placeholder; implement OAuth redirect
    alert(`Register with ${provider} (Not implemented)`);
  };

  return (
    <div className={`min-h-screen flex flex-col ${darkMode ? 'dark bg-gray-900' : 'bg-gray-50'}`}>
      <main className="container mx-auto px-4 py-16 flex-grow flex items-center justify-center">
        <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-xl shadow-sm p-8">
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white text-center mb-2 flex items-center justify-center gap-2">
            <UserPlus size={24} /> Create an Account
          </h1>
          <p className="text-gray-500 dark:text-gray-400 text-center mb-6">
            Join our community to report and claim lost or found items.
          </p>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Name <span className="text-red-500">*</span>
              </label>
              <input
                id="name"
                name="name"
                type="text"
                value={formData.name}
                onChange={handleChange}
                className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all dark:bg-gray-700 dark:text-white dark:border-gray-600 ${
                  errors.name ? 'border-red-500' : 'border-gray-200'
                }`}
                placeholder="Enter your name"
                required
                aria-invalid={errors.name ? 'true' : 'false'}
                aria-describedby={errors.name ? 'name-error' : undefined}
              />
              {errors.name && (
                <p id="name-error" className="mt-1 text-sm text-red-600">{errors.name}</p>
              )}
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Email <span className="text-red-500">*</span>
              </label>
              <input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all dark:bg-gray-700 dark:text-white dark:border-gray-600 ${
                  errors.email ? 'border-red-500' : 'border-gray-200'
                }`}
                placeholder="Enter your email"
                required
                aria-invalid={errors.email ? 'true' : 'false'}
                aria-describedby={errors.email ? 'email-error' : undefined}
              />
              {errors.email && (
                <p id="email-error" className="mt-1 text-sm text-red-600">{errors.email}</p>
              )}
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Password <span className="text-red-500">*</span>
              </label>
              <input
                id="password"
                name="password"
                type="password"
                value={formData.password}
                onChange={handleChange}
                className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all dark:bg-gray-700 dark:text-white dark:border-gray-600 ${
                  errors.password ? 'border-red-500' : 'border-gray-200'
                }`}
                placeholder="Enter your password"
                required
                aria-invalid={errors.password ? 'true' : 'false'}
                aria-describedby={errors.password ? 'password-error' : undefined}
              />
              {errors.password && (
                <p id="password-error" className="mt-1 text-sm text-red-600">{errors.password}</p>
              )}
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Confirm Password <span className="text-red-500">*</span>
              </label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                value={formData.confirmPassword}
                onChange={handleChange}
                className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all dark:bg-gray-700 dark:text-white dark:border-gray-600 ${
                  errors.confirmPassword ? 'border-red-500' : 'border-gray-200'
                }`}
                placeholder="Confirm your password"
                required
                aria-invalid={errors.confirmPassword ? 'true' : 'false'}
                aria-describedby={errors.confirmPassword ? 'confirmPassword-error' : undefined}
              />
              {errors.confirmPassword && (
                <p id="confirmPassword-error" className="mt-1 text-sm text-red-600">{errors.confirmPassword}</p>
              )}
            </div>

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
              aria-label="Register"
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
                'Register'
              )}
            </button>
          </form>

          <div className="mt-6">
            <p className="text-sm text-gray-500 dark:text-gray-400 text-center mb-4">Or register with</p>
            <div className="flex gap-4">
              <button
                onClick={() => handleSocialLogin('Google')}
                className="flex-1 flex items-center justify-center py-2 px-4 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-all"
                aria-label="Register with Google"
              >
                <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.51h5.84c-.25 1.37-.81 2.53-1.74 3.31v2.75h2.82c1.65-1.52 2.68-3.76 2.68-6.32z" />
                  <path fill="#34A853" d="M12 23c3.24 0 5.96-1.08 7.94-2.91l-2.82-2.75c-1.08.73-2.46 1.16-4.12 1.16-3.16 0-5.84-2.13-6.79-5H3.13v2.81C5.1 20.92 8.37 23 12 23z" />
                  <path fill="#FBBC05" d="M5.21 14.25c-.24-.73-.38-1.51-.38-2.25s.14-1.52.38-2.25V7.94H3.13C2.43 9.32 2 10.62 2 12s.43 3.68 1.13 5.06l2.08-1.81z" />
                  <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.61 1.81l3.45-3.45C17.96 1.08 15.24 0 12 0 8.37 0 5.1 2.08 3.13 4.94l2.08 1.81c.95-2.87 3.63-5 6.79-5z" />
                </svg>
                Google
              </button>
              <button
                onClick={() => handleSocialLogin('Facebook')}
                className="flex-1 flex items-center justify-center py-2 px-4 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-all"
                aria-label="Register with Facebook"
              >
                <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="#3B5998">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                </svg>
                Facebook
              </button>
            </div>
          </div>

          <p className="mt-6 text-center text-sm text-gray-600 dark:text-gray-400">
            Already have an account?{' '}
            <Link to="/login" className="text-blue-600 dark:text-blue-400 hover:underline">
              Log in
            </Link>
          </p>
          <p className="mt-2 text-center text-sm text-gray-600 dark:text-gray-400">
            Need to verify email?{' '}
            <Link to="/verify-email" className="text-blue-600 dark:text-blue-400 hover:underline">
              Verify Email
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

export default Register;