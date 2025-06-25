import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../utils/api';
import axios from 'axios';
import { Cloud } from '@mui/icons-material';

const Cloud_url = import.meta.env.VITE_CLOUDINARY_URL;

const EditProfile = () => {
  const user = JSON.parse(localStorage.getItem('user')) || { id: null, name: '', email: '' };
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: user.name || '',
    gender: '',
    rollno: '',
    department: '',
    year_of_study: '',
    phone: '',
    bio: '',
  });
  const [profileImage, setProfileImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(user.profile_image_url || null);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (!user.id) {
      setMessage('Please log in to edit your profile.');
      setTimeout(() => navigate('/login'), 2000);
      return;
    }
    const fetchProfile = async () => {
      try {
        const response = await api.get(`/users/${user.id}`);
        const profile = response.data;
        setFormData({
          name: profile.name || '',
          gender: profile.gender || '',
          rollno: profile.rollno || '',
          department: profile.department || '',
          year_of_study: profile.year_of_study || '',
          phone: profile.phone || '',
          bio: profile.bio || '',
        });
        setImagePreview(profile.profile_image_url || null);
      } catch (error) {
        setMessage('Failed to load profile');
      }
    };
    fetchProfile();
  }, [user.id, navigate]);

  const validateForm = () => {
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = 'Name is required';
    if (formData.phone && !/^\+?\d{10,15}$/.test(formData.phone)) newErrors.phone = 'Invalid phone number';
    if (formData.bio.length > 500) newErrors.bio = 'Bio cannot exceed 500 characters';
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
      setProfileImage(file);
      setImagePreview(URL.createObjectURL(file));
      setErrors({ ...errors, image: '' });
    }
  };

  const uploadImageToCloudinary = async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', 'lost-and-found');
    formData.append('folder', 'profile-images');

    try {
      const response = await axios.post(
       `${Cloud_url}/image/upload`,
        formData
      );
      return {
        public_id: response.data.public_id,
        url: response.data.secure_url,
      };
    } catch (error) {
      throw new Error('Image upload failed: ' + (error.response?.data?.error?.message || error.message));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user.id) {
      setMessage('Please log in to edit your profile.');
      return;
    }
    if (!validateForm()) return;

    setLoading(true);
    try {
      let imageData = null;
      if (profileImage) {
        imageData = await uploadImageToCloudinary(profileImage);
      }

      const payload = {
        name: formData.name,
        gender: formData.gender || null,
        rollno: formData.rollno || null,
        department: formData.department || null,
        year_of_study: formData.year_of_study || null,
        phone: formData.phone || null,
        bio: formData.bio || null,
        profile_image_public_id: imageData?.public_id || null,
      };

      await api.put(`/users/${user.id}`, payload);
      const updatedUser = {
        ...user,
        name: formData.name,
        profile_image_url: imageData?.url || imagePreview,
      };
      localStorage.setItem('user', JSON.stringify(updatedUser));
      setMessage('Profile updated successfully');
      setTimeout(() => navigate('/profile'), 1500);
    } catch (error) {
      setMessage(error.response?.data?.message || 'Error updating profile');
    } finally {
      setLoading(false);
      if (imagePreview && profileImage) URL.revokeObjectURL(imagePreview);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <main className="container mx-auto px-4 py-16 flex-grow">
        <div className="max-w-lg mx-auto bg-white rounded-lg shadow-sm p-8">
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Edit Profile</h1>
          <p className="text-gray-500 mb-6">Update your personal information.</p>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                Name
              </label>
              <input
                id="name"
                name="name"
                type="text"
                value={formData.name}
                onChange={handleChange}
                className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all ${
                  errors.name ? 'border-red-500' : 'border-gray-200'
                }`}
                placeholder="Your full name"
                required
              />
              {errors.name && (
                <p id="name-error" className="mt-1 text-sm text-red-600">{errors.name}</p>
              )}
            </div>

            <div>
              <label htmlFor="gender" className="block text-sm font-medium text-gray-700 mb-1">
                Gender
              </label>
              <select
                id="gender"
                name="gender"
                value={formData.gender}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
              >
                <option value="">Select gender</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
                <option value="prefer_not_to_say">Prefer not to say</option>
              </select>
            </div>

            <div>
              <label htmlFor="rollno" className="block text-sm font-medium text-gray-700 mb-1">
                Enroll NO.
              </label>
              <input
                id="rollno"
                name="rollno"
                type="text"
                value={formData.rollno}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                placeholder="Your Enrollment No."
              />
            </div>

            <div>
              <label htmlFor="department" className="block text-sm font-medium text-gray-700 mb-1">
                Department
              </label>
              <input
                id="department"
                name="department"
                type="text"
                value={formData.department}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                placeholder="Your department"
              />
            </div>

            <div>
              <label htmlFor="year_of_study" className="block text-sm font-medium text-gray-700 mb-1">
                Year of Study
              </label>
              <input
                id="year_of_study"
                name="year_of_study"
                type="text"
                value={formData.year_of_study}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                placeholder="e.g., 2nd Year"
              />
            </div>

            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                Phone Number
              </label>
              <input
                id="phone"
                name="phone"
                type="text"
                value={formData.phone}
                onChange={handleChange}
                className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all ${
                  errors.phone ? 'border-red-500' : 'border-gray-200'
                }`}
                placeholder="+1234567890"
              />
              {errors.phone && (
                <p id="phone-error" className="mt-1 text-sm text-red-600">{errors.phone}</p>
              )}
            </div>

            <div>
              <label htmlFor="bio" className="block text-sm font-medium text-gray-700 mb-1">
                Bio
              </label>
              <textarea
                id="bio"
                name="bio"
                value={formData.bio}
                onChange={handleChange}
                className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all resize-y ${
                  errors.bio ? 'border-red-500' : 'border-gray-200'
                }`}
                placeholder="Tell us about yourself"
                rows="4"
              />
              {errors.bio && (
                <p id="bio-error" className="mt-1 text-sm text-red-600">{errors.bio}</p>
              )}
            </div>

            <div>
              <label htmlFor="profile_image" className="block text-sm font-medium text-gray-700 mb-1">
                Profile Image
              </label>
              <input
                id="profile_image"
                type="file"
                accept="image/jpeg,image/png"
                onChange={handleImageChange}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
              />
              {imagePreview && (
                <div className="mt-3">
                  <img
                    src={imagePreview}
                    alt="Profile preview"
                    className="w-32 h-32 object-cover rounded-full"
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
                disabled={loading}
                className={`py-3 px-4 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all ${
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
                  'Save Changes'
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

export default EditProfile;