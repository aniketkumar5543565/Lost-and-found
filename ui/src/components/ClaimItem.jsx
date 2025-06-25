import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../utils/api';
import { Search, CheckCircle, XCircle, Eye } from 'lucide-react';

const ClaimItem = () => {
  const user = JSON.parse(localStorage.getItem('user'));
  const claimantId = user?.id;
  const navigate = useNavigate();

  const [formData, setFormData] = useState({ item_id: '', claimant_id: claimantId || null, proof: '' });
  const [items, setItems] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(document.documentElement.classList.contains('dark'));
  const [previewItem, setPreviewItem] = useState(null);
  const [claimHistory, setClaimHistory] = useState(null);

  // Sync dark mode
  useEffect(() => {
    const observer = new MutationObserver(() =>
      setDarkMode(document.documentElement.classList.contains('dark'))
    );
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);

  // Fetch items
  useEffect(() => {
    const fetchItems = async () => {
      try {
        const res = await api.get('/items');
        setItems(res.data.filter(item => item.status === 'pending' && item.item_type === 'found'));
      } catch (error) {
        setMessage(error.response?.data?.message || 'Error fetching items');
        setMessageType('error');
      }
    };
    fetchItems();
  }, []);

  // // Fetch recent claim history for user
  // useEffect(() => {
  //   if (!claimantId) return;
  //   api.get(`/users/${claimantId}/claims`)
  //     .then((res) => setClaimHistory(res.data.slice(0, 5)))
  //     .catch(() => {});
  // }, [claimantId]);

  const validateForm = () => {
    const newErrors = {};
    if (!formData.item_id.trim()) newErrors.item_id = 'Item ID is required';
    else if (!items.some(item => item.id === parseInt(formData.item_id)))
      newErrors.item_id = 'Invalid Item ID';
    if (!formData.proof.trim()) newErrors.proof = 'Proof of ownership is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const filteredItems = items.filter(item =>
    item.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.location?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.id?.toString().includes(searchTerm)
  );

  const handleChange = e => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setErrors({ ...errors, [e.target.name]: '' });
  };

  const handleSearchChange = e => setSearchTerm(e.target.value);

  const handleItemSelect = itemId => {
    setFormData({ ...formData, item_id: itemId.toString() });
    setSearchTerm('');
  };

  const handleSubmit = async e => {
    e.preventDefault();
    if (!claimantId) {
      setMessage('Please log in to claim items.');
      setMessageType('error');
      setTimeout(() => navigate('/login'), 1800);
      return;
    }
    if (!validateForm()) return;
    setConfirmOpen(true);
  };

  const confirmClaim = async () => {
    setLoading(true);
    try {
      await api.post('/claims', {
        item_id: parseInt(formData.item_id),
        claimant_id: formData.claimant_id,
        proof: formData.proof,
        status: 'pending',
      });
      setMessage('Claim submitted! Awaiting admin approval.');
      setMessageType('success');
      setConfirmOpen(false);
      setTimeout(() => navigate('/'), 1600);
    } catch (error) {
      setMessage(error.response?.data?.message || 'Error submitting claim');
      setMessageType('error');
      setConfirmOpen(false);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`min-h-screen flex flex-col ${darkMode ? 'dark bg-gray-900' : 'bg-gray-50'}`}>
      <main className="container mx-auto px-4 py-16 flex-grow">
        <div className="max-w-lg mx-auto bg-white dark:bg-gray-800 rounded-xl shadow-sm p-8">
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">Claim an Item</h1>
          <p className="text-gray-500 dark:text-gray-400 mb-6">
            Search, review, and submit proof to claim a found item.
          </p>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Search with images */}
            <div>
              <label htmlFor="search" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Search Items <span className="text-xs text-gray-400">(by description, location, or ID)</span>
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <input
                  id="search"
                  type="text"
                  value={searchTerm}
                  onChange={handleSearchChange}
                  className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all dark:bg-gray-700 dark:text-white dark:border-gray-600"
                  placeholder="Search found items..."
                  aria-label="Search items"
                  autoComplete="off"
                />
              </div>
              {searchTerm && filteredItems.length > 0 && (
                <div className="mt-2 max-h-52 overflow-y-auto bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm">
                  {filteredItems.map(item => (
                    <div key={item.id} className="flex items-center gap-2 border-b border-dashed last:border-0 px-2 py-2 hover:bg-blue-50 dark:hover:bg-gray-700 transition">
                      {item.image_url ?
                        <img src={item.image_url + "?w=60&h=40&fit=cover&q=70"} alt={item.description} className="w-14 h-10 rounded object-cover" /> :
                        <div className="w-14 h-10 rounded bg-gray-200 text-gray-400 flex items-center justify-center text-xs">No Img</div>
                      }
                      <button
                        type="button"
                        className="flex-1 text-left text-gray-700 dark:text-gray-200"
                        onClick={() => handleItemSelect(item.id)}
                      >
                        <span className="font-medium">ID: {item.id}</span> {item.description} ({item.location})
                      </button>
                      <button
                        type="button"
                        className="ml-3 text-blue-600 dark:text-blue-300 hover:underline"
                        onClick={() => setPreviewItem(item)}
                        aria-label="Preview item"
                        tabIndex={0}
                      >
                        <Eye size={18} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
              {searchTerm && filteredItems.length === 0 && (
                <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">No items found.</p>
              )}
            </div>

            {/* Item ID Field */}
            <div>
              <label htmlFor="item_id" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Item ID <span className="text-red-500">*</span>
              </label>
              <input
                id="item_id"
                name="item_id"
                type="text"
                value={formData.item_id}
                onChange={handleChange}
                className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all dark:bg-gray-700 dark:text-white dark:border-gray-600 ${errors.item_id ? 'border-red-500' : 'border-gray-200'}`}
                placeholder="Enter or select the Item ID"
                autoComplete="off"
                aria-invalid={!!errors.item_id}
                aria-describedby={errors.item_id ? "item_id-error" : undefined}
              />
              <div className="text-xs text-gray-400 mt-1">
                Example: valid ID is listed in the item search above. 
              </div>
              {errors.item_id && (
                <p id="item_id-error" className="mt-1 text-sm text-red-600">{errors.item_id}</p>
              )}
            </div>

            <div>
              <label htmlFor="proof" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Proof of Ownership <span className="text-red-500">*</span>
              </label>
              <textarea
                id="proof"
                name="proof"
                value={formData.proof}
                onChange={handleChange}
                className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all dark:bg-gray-700 dark:text-white dark:border-gray-600 ${errors.proof ? 'border-red-500' : 'border-gray-200'}`}
                placeholder="Describe details that prove the item is yours (unique marks, receipts, etc.)"
                rows="4"
                required
                aria-invalid={!!errors.proof}
                aria-describedby={errors.proof ? "proof-error" : undefined}
              />
              {errors.proof && (
                <p id="proof-error" className="mt-1 text-sm text-red-600">{errors.proof}</p>
              )}
            </div>

            {message && (
              <div className={`p-4 rounded-lg text-sm text-center flex items-center justify-center gap-2 ${messageType === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                {messageType === 'success' ? <CheckCircle size={20}/> : <XCircle size={20}/>}
                {message}
              </div>
            )}

            <div className="flex gap-4">
              <button
                type="submit"
                disabled={loading || !claimantId}
                className={`flex-1 py-3 px-4 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all dark:bg-blue-500 dark:hover:bg-blue-600 ${loading || !claimantId ? 'opacity-50 cursor-not-allowed' : ''}`}
                aria-label="Submit claim"
              >
                {loading ? (
                  <svg className="animate-spin h-5 w-5 mx-auto text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                  </svg>
                ) : 'Claim Item'}
              </button>
              <button
                type="button"
                onClick={() => navigate(-1)}
                className="flex-1 py-3 px-4 border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-200 font-medium rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 transition-all"
                aria-label="Go back"
              >
                Back
              </button>
            </div>
          </form>
        </div>

        {/* User claim history */}
        {claimHistory && claimHistory.length > 0 && (
          <div className="max-w-lg mx-auto mt-8 bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Your Recent Claims</h2>
            <ul className="divide-y divide-gray-100 dark:divide-gray-700 text-sm">
              {claimHistory.map((claim, idx) => (
                <li key={claim.id || idx} className="py-2 flex flex-col md:flex-row md:items-center md:justify-between gap-1">
                  <span><span className="font-medium">Item #{claim.item_id}</span> ({claim.status})</span>
                  <span className="text-gray-400">{new Date(claim.created_at).toLocaleString()}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* confirmation*/}
        {confirmOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 max-w-sm w-full">
            <h2 className="text-lg font-bold text-gray-800 dark:text-white mb-4 text-center">
              Confirm Claim
            </h2>
            <p className="text-gray-600 dark:text-gray-300 text-center mb-6">
              Are you sure you want to submit a claim for this item? An admin will review your proof.
            </p>
            <div className="flex gap-4">
              <button
                onClick={() => setConfirmOpen(false)}
                className="flex-1 py-2 px-4 border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 transition-all"
                aria-label="Cancel claim"
              >
                Cancel
              </button>
              <button
                onClick={confirmClaim}
                disabled={loading}
                className={`flex-1 py-2 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all dark:bg-blue-500 dark:hover:bg-blue-600 ${
                  loading ? 'opacity-50 cursor-not-allowed' : ''
                }`}
                aria-label="Confirm claim"
              >
                {loading ? 'Submitting...' : 'Yes, Claim'}
              </button>
            </div>
          </div>
        </div>
      )}

        {/* Quick Preview Modal */}
        {previewItem && (
          <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center" tabIndex={-1} role="dialog" aria-modal="true" onClick={() => setPreviewItem(null)}>
            <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl p-6 w-full max-w-md relative" onClick={e => e.stopPropagation()}>
              <button className="absolute right-4 top-2 text-2xl text-gray-400 hover:text-gray-900" onClick={() => setPreviewItem(null)} aria-label="Close preview">
                ×
              </button>
              <h3 className="text-lg font-bold mb-2 text-gray-800 dark:text-white">{previewItem.description}</h3>
              {previewItem.image_url ? (
                <img src={previewItem.image_url + "?w=440&h=260&fit=cover"} alt={previewItem.description} className="object-cover rounded shadow mb-2 w-full" />
              ) : (
                <div className="bg-gray-200 dark:bg-gray-700 h-40 rounded flex items-center justify-center mb-2">No image</div>
              )}
              <div className="mb-2">
                <span className="mr-2 bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200 px-2 py-0.5 rounded-full text-xs capitalize">{previewItem.item_type}</span>
                <span className="bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-100 px-2 py-0.5 rounded-full text-xs capitalize">{previewItem.category || "Other"}</span>
              </div>
              <div className="text-gray-600 dark:text-gray-300 mb-2">{previewItem.location}</div>
              <span className={`inline-block px-2 py-1 text-xs font-semibold rounded-full ${
                previewItem.status === 'available' ? 'bg-green-100 text-green-800' :
                previewItem.status === 'claimed' ? 'bg-purple-100 text-purple-800' :
              'bg-yellow-100 text-yellow-800'}`}>{previewItem.status}</span>
            </div>
          </div>
        )}

      </main>
      <footer className="bg-gray-800 dark:bg-gray-900 text-white py-8 mt-auto">
        {/* ...footer code unchanged... */}
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <h3 className="text-lg font-semibold mb-4">Lost & Found</h3>
              <p className="text-gray-400 text-sm">Helping you reconnect with your lost items or find owners for found treasures.</p>
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

export default ClaimItem;