import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Heart, Eye, Trash2, Search as SearchIcon, ChevronDown } from 'lucide-react';
import api from '../utils/api';

const SavedItems = () => {
  const user = JSON.parse(localStorage.getItem('user'));
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [allItems, setAllItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [removing, setRemoving] = useState(null);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [sortOrder, setSortOrder] = useState('newest');
  const [showModal, setShowModal] = useState(false);
  const [modalItem, setModalItem] = useState(null);

  // Fetch data
  useEffect(() => {
    if (!user?.id) {
      setLoading(false);
      return;
    }
    setLoading(true);
    Promise.all([
      api.get(`/users/${user.id}/saved-items`),
      api.get('/items')
    ]).then(([savedRes, itemsRes]) => {
      setAllItems(itemsRes.data);
      const filtered = itemsRes.data.filter((item) => savedRes.data.includes(item.id));
      setItems(filtered);
      setLoading(false);
    }).catch(() => {
      setError('Failed to load saved items.');
      setLoading(false);
    });
  }, [user?.id]);

  const handleRemove = async (itemId) => {
    if (!user?.id) return;
    setRemoving(itemId);
    try {
      await api.post(`/users/${user.id}/saved-items`, { itemId, action: 'remove' });
      setItems((items) => items.filter(i => i.id !== itemId));
    } catch {
      setError('Error removing item.');
    }
    setRemoving(null);
  };

  // Modal for preview
  const openModal = (item) => {
    setModalItem(item);
    setShowModal(true);
  };
  const closeModal = () => {
    setShowModal(false);
    setModalItem(null);
  };

  // Filtered and sorted list
  const filteredSortedItems = items
    .filter(item =>
      item.description?.toLowerCase().includes(search.toLowerCase()) ||
      item.location?.toLowerCase().includes(search.toLowerCase())
    )
    .sort((a, b) => {
      if (sortOrder === 'newest') return new Date(b.created_at) - new Date(a.created_at);
      else return new Date(a.created_at) - new Date(b.created_at);
    });

  return (
    <div className="container mx-auto px-4 py-6 dark:bg-gray-900 min-h-screen">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2 mb-2 sm:mb-0">
          <Heart className="text-red-500" /> Saved Items
        </h1>
        <div className="flex flex-col sm:flex-row gap-2 items-end">
          <div className="relative w-full sm:w-52">
            <input
              className="w-full pl-9 pr-4 py-2 rounded-full border dark:bg-gray-800 dark:text-white border-gray-200 dark:border-gray-700 focus:outline-none"
              placeholder="Search items..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              aria-label="Search saved items"
            />
            <SearchIcon size={18} className="text-gray-400 absolute left-2 top-2.5" />
          </div>
          <select
            className="bg-white dark:bg-gray-800 dark:text-white rounded-full px-3 py-2 border border-gray-200 dark:border-gray-700 focus:outline-none"
            value={sortOrder}
            onChange={e => setSortOrder(e.target.value)}
            aria-label="Sort items"
          >
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
          </select>
        </div>
      </div>

      {error && <p className="text-red-500 text-center mb-4">{error}</p>}

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 animate-pulse">
              <div className="w-full h-48 bg-gray-200 dark:bg-gray-700 rounded-lg mb-3"></div>
              <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-2/3 mb-2"></div>
              <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
            </div>
          ))}
        </div>
      ) : filteredSortedItems.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500 dark:text-gray-400 text-lg mb-4">No saved items.</p>
          <Link
            to="/"
            className="inline-block px-6 py-3 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-colors duration-200"
          >
            Browse Items
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredSortedItems.map((item) => (
            <div
              key={item.id}
              className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 hover:shadow-md transition-all duration-150 group relative"
              tabIndex={0}
            >
              {item.image_url ? (
                <img
                  src={item.image_url + "?w=350&h=250&fit=cover&q=80"}
                  alt={item.description}
                  className="w-full h-48 object-cover rounded-lg mb-3 transition group-hover:scale-105"
                  loading="lazy"
                  onClick={() => openModal(item)}
                  style={{ cursor: 'pointer' }}
                />
              ) : (
                <div className="w-full h-48 bg-gray-200 dark:bg-gray-700 rounded-lg mb-3 flex items-center justify-center">
                  <span className="text-gray-500 dark:text-gray-400">No Image</span>
                </div>
              )}
              <h3 className="text-lg font-medium text-gray-800 dark:text-gray-100 truncate mb-1">{item.description}</h3>
              <p className="text-gray-600 dark:text-gray-300 text-sm mb-2 truncate">Location: {item.location}</p>
              <div className="flex items-center gap-2 mb-2">
                <span className="bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200 px-2 py-0.5 rounded-full text-xs capitalize">{item.item_type}</span>
                <span className="bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-100 px-2 py-0.5 rounded-full text-xs capitalize">{item.category || "Other"}</span>
                <span className={`inline-block px-2 py-0.5 text-xs font-semibold rounded-full ${
                  item.status === 'available'
                    ? 'bg-green-100 text-green-800'
                    : item.status === 'claimed'
                      ? 'bg-purple-100 text-purple-800'
                      : 'bg-yellow-100 text-yellow-800'
                }`}>{item.status}</span>
              </div>
              <div className="flex gap-2 mt-2">
                <button
                  className="flex items-center px-3 py-1 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition text-sm focus:outline-none"
                  onClick={() => navigate(`/item/${item.id}`)}
                  aria-label="View item details"
                >
                  <Eye size={16} className="mr-1" /> View
                </button>
                <button
                  className="flex items-center px-3 py-1 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-white rounded-full hover:bg-gray-300 dark:hover:bg-gray-600 transition text-sm focus:outline-none"
                  onClick={() => openModal(item)}
                  aria-label="Quick preview"
                >
                  <ChevronDown size={16} className="mr-1" /> Preview
                </button>
                <button
                  className="flex items-center px-3 py-1 bg-red-600 text-white rounded-full hover:bg-red-700 transition text-sm focus:outline-none"
                  disabled={removing === item.id}
                  onClick={() => handleRemove(item.id)}
                  aria-label="Remove from saved"
                >
                  <Trash2 size={16} className="mr-1" />
                  {removing === item.id ? "Removing..." : "Unsave"}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal for preview */}
      {showModal && modalItem && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center" tabIndex={-1} aria-modal="true" role="dialog" onClick={closeModal}>
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl p-6 w-full max-w-md relative" onClick={e => e.stopPropagation()}>
            <button
              className="absolute right-4 top-4 text-2xl text-gray-300 hover:text-gray-900"
              onClick={closeModal}
              aria-label="Close preview"
            >&times;</button>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-3">{modalItem.description}</h2>
            <img
              src={modalItem.image_url ? modalItem.image_url + "?w=400&h=300&fit=cover" : ""}
              alt={modalItem.description}
              className="w-full rounded-lg object-cover mb-4"
              style={{ minHeight: 120, background: "#e2e8f0" }}
            />
            <div className="text-gray-700 dark:text-gray-100 mb-2">Location: {modalItem.location}</div>
            <div className="mb-2">
              <span className="bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200 px-2 py-0.5 rounded-full text-xs capitalize mr-2">{modalItem.item_type}</span>
              <span className="bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-100 px-2 py-0.5 rounded-full text-xs capitalize">{modalItem.category || "Other"}</span>
            </div>
            <span className={`inline-block px-2 py-1 text-xs font-semibold rounded-full ${
              modalItem.status === 'available'
                ? 'bg-green-100 text-green-800'
                : modalItem.status === 'claimed'
                  ? 'bg-purple-100 text-purple-800'
                  : 'bg-yellow-100 text-yellow-800'
            }`}>{modalItem.status}</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default SavedItems;