import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../utils/api';
import axios from 'axios';
import { Upload, MapPin, X, CheckCircle } from 'lucide-react';
const Cloud_url = import.meta.env.VITE_CLOUDINARY_URL; 

const ReportItem = () => {
  const user = JSON.parse(localStorage.getItem('user'));
  const reporterId = user?.id;
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    description: '',
    location: '',
    item_type: 'lost',
    category: 'other',
    reporter_id: reporterId || null,
  });
  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [uploadProgress, setUploadProgress] = useState(0);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [locationSuggestions, setLocationSuggestions] = useState([]);
  const [darkMode, setDarkMode] = useState(document.documentElement.classList.contains('dark'));
  const fileInputRef = useRef(null);

  const categories = ['electronics', 'clothing', 'accessories', 'books', 'other'];

  // Sync dark mode with global state
  useEffect(() => {
    const observer = new MutationObserver(() => {
      setDarkMode(document.documentElement.classList.contains('dark'));
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);

  // Mock location suggestions (replace with API if available)
  const fetchLocationSuggestions = (query) => {
    if (!query) return [];
    const mockLocations = ['Library', 'Cafeteria', 'Lecture Hall', 'Park', 'Bus Stop'];
    return mockLocations.filter((loc) => loc.toLowerCase().includes(query.toLowerCase()));
  };

  const handleLocationChange = (e) => {
    const value = e.target.value;
    setFormData({ ...formData, location: value });
    setErrors({ ...errors, location: '' });
    setLocationSuggestions(fetchLocationSuggestions(value));
  };

  const selectLocation = (location) => {
    setFormData({ ...formData, location });
    setLocationSuggestions([]);
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.description.trim()) newErrors.description = 'Description is required';
    if (!formData.location.trim()) newErrors.location = 'Location is required';
    if (!formData.category) newErrors.category = 'Category is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setErrors({ ...errors, [e.target.name]: '' });
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setErrors({ ...errors, image: 'Image size must be under 5MB' });
        return;
      }
      if (!['image/jpeg', 'image/png'].includes(file.type)) {
        setErrors({ ...errors, image: 'Only JPEG or PNG images are allowed' });
        return;
      }
      setImage(file);
      setImagePreview(URL.createObjectURL(file));
      setErrors({ ...errors, image: '' });
    }
  };

  const removeImage = () => {
    setImage(null);
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const uploadImageToCloudinary = async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', 'lost-and-found'); // Verify this preset exists
    formData.append('folder', 'lost-and-found-items');

    try {
      const response = await axios.post(
        `${Cloud_url}/image/upload`, // Replace with your Cloudinary URL
        formData,
        {
          onUploadProgress: (progressEvent) => {
            const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            setUploadProgress(percent);
          },
        }
      );
      return {
        public_id: response.data.public_id,
        secure_url: response.data.secure_url,
      };
    } catch (error) {
      throw new Error('Image upload failed: ' + (error.response?.data?.error?.message || error.message));
    }
  };

  const logActivity = async (message) => {
    if (!reporterId) return;
    try {
      await api.post(`/users/${reporterId}/activity`, { message });
    } catch (err) {
      console.error('Error logging activity:', err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!reporterId) {
      setMessage('Please log in to report items.');
      setTimeout(() => navigate('/login'), 2000);
      return;
    }
    if (!validateForm()) return;

    setShowConfirmation(true);
  };

  const confirmSubmit = async () => {
    setShowConfirmation(false);
    setLoading(true);
    try {
      let imageData = null;
      if (image) {
        imageData = await uploadImageToCloudinary(image);
      }

      const payload = {
        description: formData.description,
        location: formData.location,
        item_type: formData.item_type,
        category: formData.category,
        reporter_id: formData.reporter_id,
        image_url: imageData?.secure_url || null,
        image_public_id: imageData?.public_id || null,
        status: 'pending',
      };

      const response = await api.post('/items', payload); // Changed to /items
      await logActivity(`Reported a ${formData.item_type} item: ${formData.description}`);
      setMessage('Item reported successfully!');
      setTimeout(() => {
        navigate('/');
        setFormData({
          description: '',
          location: '',
          item_type: 'lost',
          category: 'other',
          reporter_id: reporterId,
        });
        setImage(null);
        setImagePreview(null);
      }, 1500);
    } catch (error) {
      setMessage(
        error.response?.data?.message ||
          error.message ||
          'Error reporting item. Please try again.'
      );
    } finally {
      setLoading(false);
      setUploadProgress(0);
      if (imagePreview) URL.revokeObjectURL(imagePreview);
    }
  };

  return (
    <div className={`min-h-screen flex flex-col ${darkMode ? 'dark bg-gray-900' : 'bg-gray-50'}`}>
      {/* Main Content */}
      <main className="container mx-auto px-4 py-16 flex-grow">
        <div className="max-w-lg mx-auto bg-white dark:bg-gray-800 rounded-xl shadow-sm p-8">
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">
            Report an Item
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mb-6">
            Fill in the details below to report a lost or found item.
          </p>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Description <span className="text-red-500">*</span>
              </label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all resize-y dark:bg-gray-700 dark:text-white dark:border-gray-600 ${
                  errors.description ? 'border-red-500' : 'border-gray-200'
                }`}
                placeholder="Describe the item (e.g., black wallet, red umbrella)"
                rows="4"
                required
                aria-invalid={errors.description ? 'true' : 'false'}
                aria-describedby={errors.description ? 'description-error' : undefined}
              />
              {errors.description && (
                <p id="description-error" className="mt-1 text-sm text-red-600">
                  {errors.description}
                </p>
              )}
            </div>

            <div className="relative">
              <label htmlFor="location" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Location <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <MapPin className="absolute left-3 top-3 text-gray-400" size={18} />
                <input
                  id="location"
                  name="location"
                  type="text"
                  value={formData.location}
                  onChange={handleLocationChange}
                  className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all dark:bg-gray-700 dark:text-white dark:border-gray-600 ${
                    errors.location ? 'border-red-500' : 'border-gray-200'
                  }`}
                  placeholder="Where was it lost or found?"
                  required
                  aria-invalid={errors.location ? 'true' : 'false'}
                  aria-describedby={errors.location ? 'location-error' : undefined}
                />
              </div>
              {locationSuggestions.length > 0 && (
                <ul className="absolute z-10 w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg mt-1 shadow-lg max-h-40 overflow-y-auto">
                  {locationSuggestions.map((loc, i) => (
                    <li
                      key={i}
                      onClick={() => selectLocation(loc)}
                      className="px-4 py-2 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer"
                    >
                      {loc}
                    </li>
                  ))}
                </ul>
              )}
              {errors.location && (
                <p id="location-error" className="mt-1 text-sm text-red-600">
                  {errors.location}
                </p>
              )}
            </div>

            <div>
              <label htmlFor="item_type" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Item Type
              </label>
              <select
                id="item_type"
                name="item_type"
                value={formData.item_type}
                onChange={handleChange}
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all dark:bg-gray-700 dark:text-white dark:border-gray-600"
                aria-label="Select item type"
              >
                <option value="lost">Lost</option>
                <option value="found">Found</option>
              </select>
            </div>

            <div>
              <label htmlFor="category" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Category <span className="text-red-500">*</span>
              </label>
              <select
                id="category"
                name="category"
                value={formData.category}
                onChange={handleChange}
                className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all dark:bg-gray-700 dark:text-white dark:border-gray-600 ${
                  errors.category ? 'border-red-500' : 'border-gray-200'
                }`}
                aria-invalid={errors.category ? 'true' : 'false'}
                aria-describedby={errors.category ? 'category-error' : undefined}
              >
                {categories.map((cat) => (
                  <option key={cat} value={cat} className="capitalize">
                    {cat}
                  </option>
                ))}
              </select>
              {errors.category && (
                <p id="category-error" className="mt-1 text-sm text-red-600">
                  {errors.category}
                </p>
              )}
            </div>

            <div>
              <label htmlFor="image" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Upload Image (Optional)
              </label>
              <div
                onClick={() => fileInputRef.current?.click()}
                className={`w-full p-4 border-2 border-dashed rounded-lg text-center cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-all ${
                  errors.image ? 'border-red-500' : 'border-gray-200 dark:border-gray-600'
                }`}
              >
                <Upload className="mx-auto text-gray-400" size={24} />
                <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                  {image ? image.name : 'Click to upload an image (JPEG/PNG, max 5MB)'}
                </p>
                <input
                  id="image"
                  type="file"
                  accept="image/jpeg,image/png"
                  onChange={handleImageChange}
                  className="hidden"
                  ref={fileInputRef}
                />
              </div>
              {imagePreview && (
                <div className="mt-3 relative">
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="max-w-full h-48 object-contain rounded-lg"
                  />
                  <button
                    onClick={removeImage}
                    className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                    aria-label="Remove image"
                  >
                    <X size={16} />
                  </button>
                </div>
              )}
              {errors.image && (
                <p id="image-error" className="mt-1 text-sm text-red-600">
                  {errors.image}
                </p>
              )}
              {uploadProgress > 0 && uploadProgress < 100 && (
                <div className="mt-2">
                  <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
                    <div
                      className="bg-blue-600 h-2.5 rounded-full"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    Uploading: {uploadProgress}%
                  </p>
                </div>
              )}
            </div>

            {message && (
              <div
                className={`p-4 rounded-lg text-sm text-center flex items-center justify-center space-x-2 ${
                  message.includes('success')
                    ? 'bg-green-100 text-green-700'
                    : 'bg-red-100 text-red-700'
                }`}
              >
                {message.includes('success') && <CheckCircle size={20} />}
                <span>{message}</span>
              </div>
            )}
            <button
              type="button"
              onClick={() => {
                setFormData({ description: '', location: '', item_type: 'lost', category: 'other', reporter_id: reporterId });
                setImage(null);
                setImagePreview(null);
                setErrors({});
              }}
              className="w-full py-3 px-4 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-white rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-all mt-4"
            >
              Reset Form
            </button>
            <button
              type="submit"
              disabled={loading || !reporterId}
              className={`w-full py-3 px-4 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all dark:bg-blue-500 dark:hover:bg-blue-600 ${
                loading || !reporterId ? 'opacity-50 cursor-not-allowed' : ''
              }`}
              aria-label="Report item"
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
                'Report Item'
              )}
            </button>
          </form>
        </div>
      </main>

      {/* Confirmation Modal */}
      {showConfirmation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 max-w-sm w-full mx-4">
            <h2 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">
              Confirm Report
            </h2>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              Are you sure you want to report this {formData.item_type} item: "{formData.description}"?
            </p>
            <div className="flex space-x-4">
              <button
                onClick={confirmSubmit}
                className="flex-1 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all"
                aria-label="Confirm report"
              >
                Confirm
              </button>
              <button
                onClick={() => setShowConfirmation(false)}
                className="flex-1 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-white rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-all"
                aria-label="Cancel report"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
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
                <li>
                  <Link to="/" className="text-gray-400 hover:text-white text-sm transition-colors">
                    Dashboard
                  </Link>
                </li>
                <li>
                  <Link to="/report" className="text-gray-400 hover:text-white text-sm transition-colors">
                    Report Item
                  </Link>
                </li>
                <li>
                  <Link to="/claim" className="text-gray-400 hover:text-white text-sm transition-colors">
                    Claim Item
                  </Link>
                </li>
                <li>
                  <Link to="/profile" className="text-gray-400 hover:text-white text-sm transition-colors">
                    Profile
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4">Contact</h3>
              <p className="text-gray-400 text-sm">Email: support@lostfound.com</p>
              <p className="text-gray-400 text-sm">Phone: (123) 456-7890</p>
            </div>
          </div>
          <div className="mt-8 border-t border-gray-700 pt-4 text-center">
            <p className="text-gray-400 text-sm">
              © {new Date().getFullYear()} Lost & Found. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default ReportItem;