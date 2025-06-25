import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../utils/api';


const Profile = () => {
  const user = JSON.parse(localStorage.getItem('user')) || { id: null, name: 'Guest', email: 'N/A' };
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!user.id) {
      setLoading(false);
      return;
    }
    const fetchData = async () => {
      try {
        const [profileResponse, itemsResponse] = await Promise.all([
          api.get(`/users/${user.id}`),
          api.get(`/items/user/${user.id}`),
        ]);
        setProfile(profileResponse.data);
        setItems(itemsResponse.data);
        setLoading(false);
      } catch (err) {
        setError('Failed to load profile or items');
        setLoading(false);
      }
    };
    fetchData();
  }, [user.id]);

  const handleLogout = () => {
    localStorage.removeItem('user');
    navigate('/login');
  };

  if (!user.id) {
    return (
      <div className="min-h-screen bg-gray-100 flex flex-col justify-center items-center">
        <p className="text-gray-600 mb-4 text-lg font-medium">Please log in to view your profile.</p>
        <Link
          to="/login"
          className="px-6 py-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-colors duration-200"
        >
          Log In
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      {/* Main Content */}
      <main className="container mx-auto px-4 py-6 flex-grow">
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <svg
              className="animate-spin h-10 w-10 text-blue-600"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
            </svg>
          </div>
        ) : error ? (
          <p className="text-red-600 text-center text-lg font-medium">{error}</p>
        ) : (
          <div className="max-w-4xl mx-auto">
            {/* Profile Header */}
            <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
              <div className="flex flex-col sm:flex-row items-center sm:items-start space-y-4 sm:space-y-0 sm:space-x-6">
                <div className="relative">
                  {profile?.profile_image_url ? (
                    <img
                      src={`${profile.profile_image_url}?w=120&h=120&f=auto&q=80`}
                      alt={profile.name}
                      className="w-24 h-24 sm:w-32 sm:h-32 rounded-full object-cover border-4 border-white shadow-md"
                    />
                  ) : (
                    <div className="w-24 h-24 sm:w-32 sm:h-32 bg-gray-200 rounded-full flex items-center justify-center border-4 border-white shadow-md">
                      <span className="text-gray-500 text-xl font-semibold">
                        {profile?.name?.charAt(0) || 'G'}
                      </span>
                    </div>
                  )}
                </div>
                <div className="flex-1 text-center sm:text-left">
                  <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">{profile?.name || 'User'}</h1>
                  <p className="text-gray-600 mt-1">{profile?.email}</p>
                  {profile?.bio ? (
                    <p className="text-gray-700 mt-2 text-sm sm:text-base leading-relaxed">{profile.bio}</p>
                  ) : (
                    <p className="text-gray-500 mt-2 text-sm sm:text-base italic">No bio provided</p>
                  )}
                  <div className="mt-4 flex flex-wrap justify-center sm:justify-start gap-4">
                    <Link
                      to="/edit-profile"
                      className="px-4 py-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-colors duration-200 text-sm font-medium"
                    >
                      Edit Profile
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="px-4 py-2 bg-red-600 text-white rounded-full hover:bg-red-700 transition-colors duration-200 text-sm font-medium"
                    >
                      Logout
                    </button>
                  </div>
                </div>
              </div>

              {/* Profile Details */}
              <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <span className="block text-sm font-medium text-gray-600">Gender</span>
                  <p className="text-gray-800 capitalize">{profile?.gender || 'Not specified'}</p>
                </div>
                <div>
                  <span className="block text-sm font-medium text-gray-600">Enrollment</span>
                  <p className="text-gray-800">{profile?.rollno || 'Not specified'}</p>
                </div>
                <div>
                  <span className="block text-sm font-medium text-gray-600">Department</span>
                  <p className="text-gray-800">{profile?.department || 'Not specified'}</p>
                </div>
                <div>
                  <span className="block text-sm font-medium text-gray-600">Year of Study</span>
                  <p className="text-gray-800">{profile?.year_of_study || 'Not specified'}</p>
                </div>
                <div>
                  <span className="block text-sm font-medium text-gray-600">Phone</span>
                  <p className="text-gray-800">{profile?.phone || 'Not specified'}</p>
                </div>
              </div>
            </div>

            {/* Reported Items */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">{items.length} Reported Items</h2>
              {items.length === 0 ? (
                <p className="text-gray-500 text-center text-lg">You haven't reported any items yet.</p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {items.map((item) => (
                    <div
                      key={item.id}
                      className="bg-gray-50 rounded-xl shadow-sm p-4 hover:shadow-md transition-shadow duration-200"
                    >
                      {item.image_url ? (
                        <img
                          src={`${item.image_url}?w=300&h=200&f=auto&q=80`}
                          alt={item.description}
                          className="w-full h-40 object-cover rounded-lg mb-3"
                          loading="lazy"
                        />
                      ) : (
                        <div className="w-full h-40 bg-gray-200 rounded-lg mb-3 flex items-center justify-center">
                          <span className="text-gray-500">No Image</span>
                        </div>
                      )}
                      <h3 className="text-lg font-medium text-gray-800 truncate">{item.description}</h3>
                      <p className="text-gray-600 text-sm mt-1">Location: {item.location}</p>
                      <p className="text-gray-600 text-sm capitalize">Type: {item.item_type}</p>
                      <p className="text-gray-600 text-sm capitalize">Status: {item.status}</p>
                      <Link
                        to={`/edit-item/${item.id}`}
                        className="mt-3 inline-block px-3 py-1 bg-green-600 text-white rounded-full hover:bg-green-700 transition-colors duration-200 text-sm"
                      >
                        Edit
                      </Link>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-8 mt-auto">
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
                  <Link to="/" className="text-gray-400 hover:text-white text-sm transition-colors duration-200">
                    Dashboard
                  </Link>
                </li>
                <li>
                  <Link to="/report" className="text-gray-400 hover:text-white text-sm transition-colors duration-200">
                    Report Item
                  </Link>
                </li>
                <li>
                  <Link to="/claim" className="text-gray-400 hover:text-white text-sm transition-colors duration-200">
                    Claim Item
                  </Link>
                </li>
                <li>
                  <Link to="/profile" className="text-gray-400 hover:text-white text-sm transition-colors duration-200">
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

export default Profile;