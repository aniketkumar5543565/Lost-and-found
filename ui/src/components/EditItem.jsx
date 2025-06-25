import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import api from '../utils/api';
import axios from 'axios';

const Cloud_url = import.meta.env.VITE_CLOUDINARY_URL ;

const EditItem = () => {
  const { itemId } = useParams();
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user'));
  const reporterId = user?.id;

  const [formData, setFormData] = useState({
    description: '',
    location: '',
    item_type: 'lost',
    reporter_id: reporterId || null,
  });
  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [existingImageUrl, setExistingImageUrl] = useState(null);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (!reporterId) {
      setMessage('Please log in to edit items.');
      setTimeout(() => navigate('/login'), 2000);
      return;
    }
    const fetchItem = async () => {
      try {
        const response = await api.get(`/items/${itemId}`);
        const item = response.data;
        if (item.reporter_id !== reporterId) {
          setMessage('You are not authorized to edit this item.');
          setTimeout(() => navigate('/profile'), 2000);
          return;
        }
        setFormData({
          description: item.description,
          location: item.location,
          item_type: item.item_type,
          reporter_id: reporterId,
        });
        setExistingImageUrl(item.image_url);
        setImagePreview(item.image_url);
        setLoading(false);
      } catch (error) {
        setMessage('Failed to load item');
        setLoading(false);
      }
    };
    fetchItem();
  }, [itemId, reporterId, navigate]);

  const validateForm = () => {
    const newErrors = {};
    if (!formData.description.trim()) newErrors.description = 'Description is required';
    if (!formData.location.trim()) newErrors.location = 'Location is required';
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

  const uploadImageToCloudinary = async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', 'lost-and-found');
    formData.append('folder', 'lost-and-found-items');

    try {
      const response = await axios.post(
        `${Cloud_url}/image/upload`,
        formData
      );
      return {
        public_id: response.data.public_id,
      };
    } catch (error) {
      throw new Error('Image upload failed: ' + (error.response?.data?.error?.message || error.message));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!reporterId) {
      setMessage('Please log in to edit items.');
      setTimeout(() => navigate('/login'), 2000);
      return;
    }
    if (!validateForm()) return;

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
        reporter_id: formData.reporter_id,
        image_public_id: imageData?.public_id || null,
      };

      await api.put(`/items/${itemId}`, payload);
      setMessage('Item updated successfully');
      setTimeout(() => navigate('/profile'), 1500);
    } catch (error) {
      setMessage(error.response?.data?.message || 'Error updating item');
    } finally {
      setLoading(false);
      if (imagePreview && image) URL.revokeObjectURL(imagePreview);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <main className="container mx-auto px-4 py-16 flex-grow">
        <div className="max-w-lg mx-auto bg-white rounded-lg shadow-sm p-8">
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Edit Item</h1>
          <p className="text-gray-500 mb-6">Update the details of your reported item.</p>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all resize-y ${
                  errors.description ? 'border-red-500' : 'border-gray-200'
                }`}
                placeholder="Describe the item"
                rows="4"
                required
              />
              {errors.description && (
                <p id="description-error" className="mt-1 text-sm text-red-600">{errors.description}</p>
              )}
            </div>

            <div>
              <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-1">
                Location
              </label>
              <input
                id="location"
                name="location"
                type="text"
                value={formData.location}
                onChange={handleChange}
                className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all ${
                  errors.location ? 'border-red-500' : 'border-gray-200'
                }`}
                placeholder="Where was it lost or found?"
                required
              />
              {errors.location && (
                <p id="location-error" className="mt-1 text-sm text-red-600">{errors.location}</p>
              )}
            </div>

            <div>
              <label htmlFor="item_type" className="block text-sm font-medium text-gray-700 mb-1">
                Item Type
              </label>
              <select
                id="item_type"
                name="item_type"
                value={formData.item_type}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
              >
                <option value="lost">Lost</option>
                <option value="found">Found</option>
              </select>
            </div>

            <div>
              <label htmlFor="image" className="block text-sm font-medium text-gray-700 mb-1">
                Upload New Image (Optional)
              </label>
              <input
                id="image"
                type="file"
                accept="image/jpeg,image/png"
                onChange={handleImageChange}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
              />
              {imagePreview && (
                <div className="mt-3">
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="max-w-full h-40 object-contain rounded-lg"
                  />
                </div>
              )}
              {errors.image && (
                <p id="image-error" className="mt-1 text-sm text-red-600">{errors.image}</p>
              )}
            </div>

            {message && (
              <div
                className={`p-3 rounded-lg text-sm text-center ${
                  message.includes('success') ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                }`}
              >
                {message}
              </div>
            )}

            <div className="flex justify-between">
              <button
                type="submit"
                disabled={loading || !reporterId}
                className={`py-3 px-4 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all ${
                  loading || !reporterId ? 'opacity-50 cursor-not-allowed' : ''
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
                  'Update Item'
                )}
              </button>
              <Link
                to="/profile"
                className="py-3 px-4 bg-gray-600 text-white font-medium rounded-lg hover:bg-gray-700 transition-colors"
              >
                Cancel
              </Link>
            </div>
          </form>
        </div>
      </main>

      <footer className="bg-gray-800 text-white py-8 mt-auto">
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
                  <Link to="/" className="text-gray-400 hover:text-white text-sm">
                    Dashboard
                  </Link>
                </li>
                <li>
                  <Link to="/report" className="text-gray-400 hover:text-white text-sm">
                    Report Item
                  </Link>
                </li>
                <li>
                  <Link to="/claim" className="text-gray-400 hover:text-white text-sm">
                    Claim Item
                  </Link>
                </li>
                <li>
                  <Link to="/profile" className="text-gray-400 hover:text-white text-sm">
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

export default EditItem;