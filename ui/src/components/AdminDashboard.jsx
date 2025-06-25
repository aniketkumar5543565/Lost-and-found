import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { Shield, Trash2, Check, X, Search } from 'lucide-react';

const AdminDashboard = () => {
  const user = JSON.parse(localStorage.getItem('user'));
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [items, setItems] = useState([]);
  const [claims, setClaims] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');
  const [darkMode, setDarkMode] = useState(document.documentElement.classList.contains('dark'));

  // Check admin role
  useEffect(() => {
    if (!user || user.role !== 'admin') {
      setMessage('Access denied. Admins only.');
      setMessageType('error');
      setTimeout(() => navigate('/'), 2000);
      return;
    }

    // Sync dark mode
    const observer = new MutationObserver(() => {
      setDarkMode(document.documentElement.classList.contains('dark'));
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, [navigate, user]);

  // Fetch data
  useEffect(() => {
    if (user?.role === 'admin') {
      const fetchData = async () => {
        setLoading(true);
        try {
            api.get('/users').then((usersRes) => setUsers(usersRes.data));
            api.get('/items').then((itemsRes) => setItems(itemsRes.data));
            api.get('/claims').then((claimsRes) => setClaims(claimsRes.data));
        } catch (error) {
          setMessage(error.response?.data?.message || 'Error fetching data');
          setMessageType('error');
        } finally {
          setLoading(false);
        }
      };
      fetchData();
    }
  }, [user]);

  const handleDeleteUser = async (userId) => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      try {
        await api.delete(`/users/${userId}`);
        setUsers(users.filter((u) => u.id !== userId));
        setMessage('User deleted successfully');
        setMessageType('success');
      } catch (error) {
        setMessage(error.response?.data?.message || 'Error deleting user');
        setMessageType('error');
      }
    }
  };

  const handleDeleteItem = async (itemId) => {
    if (window.confirm('Are you sure you want to delete this item?')) {
      try {
        await api.delete(`/items/${itemId}`);
        setItems(items.filter((i) => i.id !== itemId));
        setMessage('Item deleted successfully');
        setMessageType('success');
      } catch (error) {
        setMessage(error.response?.data?.message || 'Error deleting item');
        setMessageType('error');
      }
    }
  };

  const handleClaimAction = async (claimId, action) => {
    try {
      const payload = { status: action };
      await api.put(`/claims/${claimId}`, payload);
      setClaims(claims.map((c) => (c.id === claimId ? { ...c, status: action } : c)));
      if (action === 'approved') {
        const claim = claims.find((c) => c.id === claimId);
        await api.put(`/items/${claim.item_id}`, { status: 'claimed' });
        setItems(items.map((i) => (i.id === claim.item_id ? { ...i, status: 'claimed' } : i)));
      }
      setMessage(`Claim ${action} successfully`);
      setMessageType('success');
    } catch (error) {
      setMessage(error.response?.data?.message || `Error ${action} claim`);
      setMessageType('error');
    }
  };

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
  };

  const filteredUsers = users.filter(
    (u) => u.name.toLowerCase().includes(searchTerm.toLowerCase()) || u.email.toLowerCase().includes(searchTerm.toLowerCase())
  );
  const filteredItems = items.filter(
    (i) => i.description.toLowerCase().includes(searchTerm.toLowerCase()) || i.location.toLowerCase().includes(searchTerm.toLowerCase())
  );
  const filteredClaims = claims.filter(
    (c) => {
      const item = items.find((i) => i.id === c.item_id);
      return item && (
        item.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.status.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
  );

  return (
    <div className={`min-h-screen ${darkMode ? 'dark bg-gray-900' : 'bg-gray-50'}`}>
      <div className="container mx-auto px-4 py-16">
        <h1 className="text-3xl font-bold text-gray-800 dark:text-white mb-8 flex items-center gap-2">
          <Shield size={28} /> Admin Dashboard
        </h1>

        {message && (
          <div
            className={`p-4 rounded-lg text-sm flex items-center gap-2 mb-6 ${
              messageType === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
            }`}
          >
            {messageType === 'success' ? <Check size={20} /> : <X size={20} />}
            {message}
          </div>
        )}

        <div className="mb-6">
          <label htmlFor="search" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Search
          </label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              id="search"
              type="text"
              value={searchTerm}
              onChange={handleSearch}
              className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all dark:bg-gray-700 dark:text-white dark:border-gray-600"
              placeholder="Search users, items, or claims..."
            />
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center">
            <svg
              className="animate-spin h-8 w-8 text-blue-600 dark:text-blue-400"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
            </svg>
          </div>
        ) : (
          <div className="space-y-12">
            {/* Admin Info Section */}
            <section className="mb-12">
                <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">Statistics</h2>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm">
                    <p className="text-gray-600 dark:text-gray-300">Total Users</p>
                    <p className="text-2xl font-bold text-gray-800 dark:text-white">{users.length}</p>
                    </div>
                    <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm">
                    <p className="text-gray-600 dark:text-gray-300">Total Items</p>
                    <p className="text-2xl font-bold text-gray-800 dark:text-white">{items.length}</p>
                    </div>
                    <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm">
                    <p className="text-gray-600 dark:text-gray-300">Pending Claims</p>
                    <p className="text-2xl font-bold text-gray-800 dark:text-white">{claims.filter((c) => c.status === 'pending').length}</p>
                    </div>
                </div>
            </section>
            {/* Users Section */}
            <section>
              <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">Manage Users</h2>
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-x-auto">
                <table className="w-full text-sm text-left text-gray-700 dark:text-gray-200">
                  <thead className="bg-gray-50 dark:bg-gray-700">
                    <tr>
                      <th className="px-6 py-3">Name</th>
                      <th className="px-6 py-3">Email</th>
                      <th className="px-6 py-3">Role</th>
                      <th className="px-6 py-3">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.map((u) => (
                      <tr key={u.id} className="border-b dark:border-gray-700">
                        <td className="px-6 py-4">{u.name}</td>
                        <td className="px-6 py-4">{u.email}</td>
                        <td className="px-6 py-4 capitalize">{u.role}</td>
                        <td className="px-6 py-4">
                          <button
                            onClick={() => handleDeleteUser(u.id)}
                            className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300"
                            aria-label={`Delete user ${u.name}`}
                          >
                            <Trash2 size={18} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {filteredUsers.length === 0 && (
                  <p className="p-6 text-gray-500 dark:text-gray-400 text-center">No users found.</p>
                )}
              </div>
            </section>

            {/* Items Section */}
            <section>
              <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">Manage Items</h2>
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-x-auto">
                <table className="w-full text-sm text-left text-gray-700 dark:text-gray-200">
                  <thead className="bg-gray-50 dark:bg-gray-700">
                    <tr>
                      <th className="px-6 py-3">ID</th>
                      <th className="px-6 py-3">Description</th>
                      <th className="px-6 py-3">Location</th>
                      <th className="px-6 py-3">Type</th>
                      <th className="px-6 py-3">Status</th>
                      <th className="px-6 py-3">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredItems.map((i) => (
                      <tr key={i.id} className="border-b dark:border-gray-700">
                        <td className="px-6 py-4">{i.id}</td>
                        <td className="px-6 py-4">{i.description}</td>
                        <td className="px-6 py-4">{i.location}</td>
                        <td className="px-6 py-4 capitalize">{i.item_type}</td>
                        <td className="px-6 py-4 capitalize">{i.status}</td>
                        <td className="px-6 py-4">
                          <button
                            onClick={() => handleDeleteItem(i.id)}
                            className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300"
                            aria-label={`Delete item ${i.description}`}
                          >
                            <Trash2 size={18} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {filteredItems.length === 0 && (
                  <p className="p-6 text-gray-500 dark:text-gray-400 text-center">No items found.</p>
                )}
              </div>
            </section>

            {/* Claims Section */}
            <section>
              <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">Manage Claims</h2>
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-x-auto">
                <table className="w-full text-sm text-left text-gray-700 dark:text-gray-200">
                  <thead className="bg-gray-50 dark:bg-gray-700">
                    <tr>
                      <th className="px-6 py-3">Claim ID</th>
                      <th className="px-6 py-3">Item</th>
                      <th className="px-6 py-3">Claimant</th>
                      <th className="px-6 py-3">Status</th>
                      <th className="px-6 py-3">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredClaims.map((c) => {
                      const item = items.find((i) => i.id === c.item_id);
                      const claimant = users.find((u) => u.id === c.claimant_id);
                      return (
                        <tr key={c.id} className="border-b dark:border-gray-700">
                          <td className="px-6 py-4">{c.id}</td>
                          <td className="px-6 py-4">{item ? item.description : 'N/A'}</td>
                          <td className="px-6 py-4">{claimant ? claimant.name : 'N/A'}</td>
                          <td className="px-6 py-4 capitalize">{c.status}</td>
                          <td className="px-6 py-4 flex gap-2">
                            {c.status === 'pending' && (
                              <>
                                <button
                                  onClick={() => handleClaimAction(c.id, 'approved')}
                                  className="text-green-600 dark:text-green-400 hover:text-green-800 dark:hover:text-green-300"
                                  aria-label={`Approve claim ${c.id}`}
                                >
                                  <Check size={18} />
                                </button>
                                <button
                                  onClick={() => handleClaimAction(c.id, 'rejected')}
                                  className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300"
                                  aria-label={`Reject claim ${c.id}`}
                                >
                                  <X size={18} />
                                </button>
                              </>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                {filteredClaims.length === 0 && (
                  <p className="p-6 text-gray-500 dark:text-gray-400 text-center">No claims found.</p>
                )}
              </div>
            </section>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;