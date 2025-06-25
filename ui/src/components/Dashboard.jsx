import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import api from '../utils/api';
import {
  Search, Filter, ArrowUpDown, Plus, Heart, Bell, User, LogOut, Eye
} from 'lucide-react';
import { blue } from '@mui/material/colors';

const itemsPerPage = 9;
const categories = ['all', 'electronics', 'clothing', 'accessories', 'books', 'other'];

const Dashboard = () => {
  const user = JSON.parse(localStorage.getItem('user')) || { id: null, name: 'Guest', email: 'N/A' };
  const navigate = useNavigate();
  const location = useLocation();
  const [items, setItems] = useState([]);
  const [filteredItems, setFilteredItems] = useState([]);
  const [savedItems, setSavedItems] = useState([]);
  const [recentActivity, setRecentActivity] = useState([]);
  const [recentlyViewed, setRecentlyViewed] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterStatus, setFilterStatus] = useState('pending');
  const [filterCategory, setFilterCategory] = useState('all');
  const [sortOrder, setSortOrder] = useState('newest');
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [darkMode, setDarkMode] = useState(() => document.documentElement.classList.contains('dark'));
  const [showModal, setShowModal] = useState(false);
  const [modalItem, setModalItem] = useState(null);

  // --- Fetch Functions ---
  const fetchItems = useCallback(async () => {
    try {
      const response = await api.get('/items');
      setItems(response.data);
      setFilteredItems(response.data.slice(0, itemsPerPage));
      setLoading(false);
    } catch {
      setError('Failed to load items');
      setLoading(false);
    }
  }, []);
  

  const fetchUserData = useCallback(async () => {
    if (!user.id) return;
    try {
      const [savedResponse, activityResponse] = await Promise.all([
        api.get(`/users/${user.id}/saved-items`),
        api.get(`/users/${user.id}/activity`),
      ]);
      setSavedItems(savedResponse.data || []);
      setRecentActivity(activityResponse.data || []);
    } catch (err) {
      // Silently fail
    }
  }, [user.id]);

  // --- Effects ---
  useEffect(() => {
    fetchItems();
    fetchUserData();
    // Recent viewed implementation
    const recent = sessionStorage.getItem('recentlyViewed');
    setRecentlyViewed(recent ? JSON.parse(recent) : []);
    // eslint-disable-next-line
  }, []);

  useEffect(() => {
    let result = [...items];
    if (searchQuery) {
      result = result.filter(
        (item) =>
          item.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
          item.location.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    if (filterType !== 'all') {
      result = result.filter((item) => item.item_type === filterType);
    }
    if (filterStatus !== 'all') {
      result = result.filter((item) => item.status === filterStatus);
    }

    if (filterCategory !== 'all') {
      result = result.filter((item) => item.category === filterCategory);
    }
    if (sortOrder === 'newest') {
      result.sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
    } else {
      result.sort((a, b) => new Date(a.created_at || 0) - new Date(b.created_at || 0));
    }
    setFilteredItems(result.slice(0, currentPage * itemsPerPage));
    setHasMore(result.length > currentPage * itemsPerPage);
  }, [searchQuery, filterType, filterStatus, filterCategory, sortOrder, items, currentPage]);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    setSearchQuery(params.get('search') || '');
  }, [location.search]);

  // Infinite scroll (keep, but add Load More for accessibility)
  useEffect(() => {
    const handleScroll = () => {
      if (
        window.innerHeight + document.documentElement.scrollTop >= document.documentElement.offsetHeight - 100 &&
        hasMore &&
        !loading
      ) {
        setCurrentPage((prev) => prev + 1);
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [hasMore, loading]);

  // --- Handlers ---
  const toggleDarkMode = () => {
    setDarkMode((prev) => {
      document.documentElement.classList.toggle('dark');
      return !prev;
    });
  };

  const handleSaveItem = async (itemId) => {
    if (!user.id) {
      navigate('/login');
      return;
    }
    try {
      const isSaved = savedItems.includes(itemId);
      await api.post(`/users/${user.id}/saved-items`, { itemId, action: isSaved ? 'remove' : 'add' });
      setSavedItems((prev) => (isSaved ? prev.filter((id) => id !== itemId) : [...prev, itemId]));
    } catch {
      setError('Failed to update saved items');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('user');
    navigate('/login');
  };

  const handleView = (item) => {
    // Save to sessionStorage "recently viewed"
    let rec = sessionStorage.getItem('recentlyViewed');
    let parsed = rec ? JSON.parse(rec) : [];
    parsed = parsed.filter((it) => it.id !== item.id);
    parsed.unshift(item);
    if (parsed.length > 5) parsed = parsed.slice(0, 5);
    sessionStorage.setItem('recentlyViewed', JSON.stringify(parsed));
    setRecentlyViewed(parsed);
    navigate(`/item/${item.id}`);
  };

  const openModal = (item) => {
    setModalItem(item);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setModalItem(null);
  };

  // --- Render ---
  return (
    <div className={`min-h-screen ${darkMode ? 'dark bg-gray-900' : 'bg-gray-100'} flex flex-col transition-colors duration-300`}>
      {/* Hero Section */}
      <header className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-10 md:py-12 relative">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-wide">Lost &amp; Found Hub</h1>
            <div className="flex items-center space-x-3">
              <button
                onClick={toggleDarkMode}
                className="p-1.5 bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white rounded-full transition-colors"
                aria-label="Toggle dark mode"
                title="Toggle dark mode"
              >
                <span className="transition-all">{darkMode ? '🌞' : '🌙'}</span>
              </button>
              {user.id ? (
                <>
                  <Link to="/profile" className="p-2 text-white hover:text-gray-200" aria-label="Profile">
                    <User size={22} />
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="p-2 text-white hover:text-gray-200"
                    aria-label="Logout"
                  >
                    <LogOut size={22} />
                  </button>
                </>
              ) : (
                <Link to="/login" className="px-4 py-2 bg-white text-blue-600 rounded-full hover:bg-gray-100">
                  Log In
                </Link>
              )}
            </div>
          </div>
          {user.id && (
            <div className="bg-white bg-opacity-10 rounded-xl p-3 mb-5 text-center text-lg sm:text-xl">
              Welcome back, <span className="font-semibold">{user.name}</span>! Ready to find or report items?
            </div>
          )}
          {/* Search Bar */}
          <div className="max-w-3xl mx-auto flex items-center bg-white rounded-full shadow-lg overflow-hidden ring-1 ring-blue-100">
            <Search className="ml-4 text-gray-500" size={20} />
            <input
              type="text"
              placeholder="Search items by description or location…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-3 text-gray-900 focus:outline-none bg-transparent"
              aria-label="Search items"
            />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-2 sm:px-4 py-6 flex-grow">
        {/* Filters and Sorting */}
        <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-2 sm:gap-0">
          <div className="flex flex-wrap gap-3 items-center w-full">
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="px-4 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-full shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              aria-label="Filter by type"
            >
              <option value="all">All Types</option>
              <option value="lost">Lost</option>
              <option value="found">Found</option>
            </select>
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="px-4 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-full shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              aria-label="Filter by category"
            >
              {categories.map((cat) => (
                <option key={cat} value={cat} className="capitalize">
                  {cat === 'all' ? 'All Categories' : cat}
                </option>
              ))}
            </select>
            <select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value)}
              className="px-4 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-full shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              aria-label="Sort items"
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
            </select>
          </div>
        </div>

        {/* Stat Cards & Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          <div className="lg:col-span-2">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div
              onClick={() => {
                if (filterType === 'lost') setFilterType('all');
                else setFilterType('lost');
              }}
              style={{ cursor: 'pointer' }}
              className={`
                rounded-xl transition ring-blue-600 
                ${filterType === 'lost' ? 'ring-2 ' : 'hover:ring-2'}
              `}
            >
              <StatCard
                value={items.filter((i) => i.item_type === 'lost').length}
                label="Lost Items"
                colorClass="text-blue-600 dark:text-blue-400"
              />
            </div>


              <div onClick = {() => {
                if (filterType === 'found') setFilterType('all');
                else setFilterType('found')}}

                style={{ cursor: 'pointer' }} className={`
                  rounded-xl transition ring-green-600 
                  ${filterType === 'found' ? 'ring-2 ' : 'hover:ring-2'}
                `}>
              <StatCard value={items.filter((i) => i.item_type === 'found').length} label="Found Items" colorClass="text-green-600 dark:text-green-400"/>
              </div>

              <div onClick = {() => {
                if (filterStatus === 'claimed') setFilterStatus('pending');
                else setFilterStatus('claimed')}}

                style={{ cursor: 'pointer' }} className={`
                  rounded-xl transition ring-purple-600 
                  ${filterStatus === 'claimed' ? 'ring-2 ' : 'hover:ring-2'}
                `}>
              <StatCard value={items.filter((i) => i.status === 'claimed').length} label="Claimed Items" colorClass="text-purple-600 dark:text-purple-400"/>
              </div>
            </div>
          </div>
          {user.id && (
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3 flex items-center">
                <Bell size={20} className="mr-2" /> Recent Activity
              </h3>
              {recentActivity.length === 0 ? (
                <p className="text-gray-500 dark:text-gray-400 text-sm">No recent activity.</p>
              ) : (
                <ul className="space-y-2 max-h-40 overflow-y-auto">
                  {recentActivity.map((activity, i) => (
                    <li key={i} className="text-sm text-gray-700 dark:text-gray-300">
                      {activity.message} <span className="text-gray-500">({activity.timestamp})</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>

        {/* Recently Viewed Section */}
        {recentlyViewed.length > 0 && (
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2 flex items-center gap-1">
              <Eye size={17} className="mr-1" /> Recently Viewed
            </h2>
            <div className="flex gap-3 overflow-x-auto pb-2 max-w-full">
              {recentlyViewed.map((item) => (
                <div
                  key={item.id}
                  className="bg-white dark:bg-gray-800 rounded-lg shadow p-3 min-w-[220px] flex flex-col items-center hover:ring-2 ring-blue-400 transition"
                  tabIndex={0}
                  onClick={() => handleView(item)}
                  style={{ cursor: 'pointer' }}
                  aria-label={`Recently viewed: ${item.description}`}
                >
                  {item.image_url ? (
                    <img src={item.image_url} alt={item.description} className="h-16 w-28 object-cover rounded mb-2" />
                  ) : (
                    <div className="w-28 h-16 bg-gray-200 dark:bg-gray-600 mb-2 flex items-center justify-center rounded">
                      <span className="text-xs text-gray-400">No Image</span>
                    </div>
                  )}
                  <span className="truncate max-w-[180px] text-gray-800 dark:text-white text-center text-sm">{item.description}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Saved Items (for logged-in users)
        {user.id && savedItems.length > 0 && (
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
              <Heart size={20} className="mr-2" /> Saved Items
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {items
                .filter((item) => savedItems.includes(item.id))
                .slice(0, 3)
                .map((item) => (
                  <div
                    key={item.id}
                    className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 hover:shadow-md transition-all duration-150"
                  >
                    <ItemCard
                      item={item}
                      savedItems={savedItems}
                      handleSaveItem={handleSaveItem}
                      handleView={handleView}
                      openModal={openModal}
                    />
                  </div>
                ))}
            </div>
          </div>
        )} */}

        {/* Items Grid */}
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">{filterType} Items</h2>
        {loading && filteredItems.length === 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(9)].map((_, i) => (
              <div key={i} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 animate-pulse">
                <div className="w-full h-48 bg-gray-200 dark:bg-gray-700 rounded-lg mb-3"></div>
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        ) : error ? (
          <p className="text-red-600 text-center text-lg font-medium">{error}</p>
        ) : filteredItems.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 dark:text-gray-400 text-lg mb-4">No items found. Try reporting one!</p>
            <Link
              to="/report"
              className="inline-block px-6 py-3 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-colors duration-200"
            >
              Report Item
            </Link>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredItems.map((item) => (
                <div
                  key={item.id}
                  className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 hover:shadow-md transition-all duration-200 transform hover:-translate-y-1 focus-within:ring-2 ring-blue-300"
                  tabIndex={0}
                >
                  <ItemCard
                    item={item}
                    savedItems={savedItems}
                    handleSaveItem={handleSaveItem}
                    handleView={handleView}
                    openModal={openModal}
                  />
                </div>
              ))}
            </div>
            {/* Load More Button */}
            {hasMore && (
              <div className="flex justify-center mt-6">
                <button
                  className="px-8 py-2 rounded-full bg-blue-600 text-white hover:bg-blue-700 transition focus:outline-none focus:ring-2 focus:ring-blue-400"
                  onClick={() => setCurrentPage((prev) => prev + 1)}
                  disabled={loading}
                >
                  {loading ? "Loading..." : "Load More"}
                </button>
              </div>
            )}
          </>
        )}

        {loading && filteredItems.length > 0 && (
          <div className="flex justify-center mt-6">
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
        )}

        {/* Modal for Quick Item Preview */}
        {showModal && modalItem && (
          <div
            className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center"
            tabIndex={-1}
            onClick={closeModal}
            aria-modal="true"
            role="dialog"
          >
            <div
              className="bg-white dark:bg-gray-900 rounded-xl p-5 shadow-2xl w-full max-w-md relative"
              onClick={e => e.stopPropagation()}
            >
              <button className="absolute right-4 top-3 text-xl text-gray-400 hover:text-gray-700" onClick={closeModal} aria-label="Close preview">&times;</button>
              <ItemCard
                item={modalItem}
                savedItems={savedItems}
                handleSaveItem={handleSaveItem}
                isModal
              />
            </div>
          </div>
        )}
      </main>

      {/* Floating Action Button */}
      <Link
        to="/report"
        className="fixed bottom-6 right-6 bg-blue-600 text-white p-4 rounded-full shadow-lg hover:bg-blue-700 transition-all duration-150 transform hover:scale-105"
        aria-label="Report new item"
        tabIndex={0}
      >
        <Plus size={24} />
      </Link>

      {/* Footer */}
      <footer className="bg-gray-900 dark:bg-gray-800 text-white py-8 mt-auto">
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
              © {new Date().getFullYear()} Lost &amp; Found. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

// Stats Card Component
const StatCard = ({ value, label, colorClass }) => (
  <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-4 text-center">
    <p className={`text-2xl font-bold ${colorClass}`}>{value}</p>
    <p className="text-gray-600 dark:text-gray-300">{label}</p>
  </div>
);

// Reusable Item Card Component
const ItemCard = ({ item, savedItems = [], handleSaveItem, handleView, openModal, isModal }) => (
  <>
    {item.image_url ? (
      <img
        src={`${item.image_url}?w=300&h=200&f=auto&q=80`}
        alt={item.description}
        className="w-full h-48 object-cover rounded-lg mb-3"
        loading="lazy"
      />
    ) : (
      <div className="w-full h-48 bg-gray-200 dark:bg-gray-700 rounded-lg mb-3 flex items-center justify-center">
        <span className="text-gray-500 dark:text-gray-400">No Image</span>
      </div>
    )}

    <div className="flex justify-between items-start gap-2">
      <div>
        <h3 className="text-lg font-medium text-gray-800 dark:text-gray-100 truncate">{item.description}</h3>
        <p className="text-gray-600 dark:text-gray-300 text-sm mt-1">Location: {item.location}</p>
        <p className="text-gray-600 dark:text-gray-300 text-xs capitalize">Type: {item.item_type}</p>
        <p className="text-gray-600 dark:text-gray-300 text-xs capitalize">Category: {item.category || 'Other'}</p>
      </div>
      {handleSaveItem && (
        <button
          onClick={() => handleSaveItem(item.id)}
          className="p-1"
          aria-label={savedItems.includes(item.id) ? 'Unsave item' : 'Save item'}
          tabIndex={0}
        >
          <Heart
            size={20}
            className={savedItems.includes(item.id)
              ? 'text-red-500 fill-red-500 transition'
              : 'text-gray-400 hover:text-red-400'}
          />
        </button>
      )}
    </div>
    <div className="mt-2 flex items-center gap-2">
      <span
        className={`inline-block px-2 py-1 text-xs font-semibold rounded-full transition-all ${
          item.status === 'available'
            ? 'bg-green-100 text-green-800'
            : item.status === 'claimed'
              ? 'bg-purple-100 text-purple-800'
              : 'bg-yellow-100 text-yellow-800'
        }`}
        title={item.status}
      >
        {item.status}
      </span>
      {/* Show "New" badge for items <24hr old */}
      {new Date() - new Date(item.created_at) < 1000 * 60 * 60 * 24 && (
        <span className="ml-1 px-2 py-1 text-xs font-bold rounded-full bg-blue-50 text-blue-600 animate-pulse">NEW</span>
      )}
      {/* Show "HOT" if many users saved */}
      {item.saves && item.saves > 10 && (
        <span className="px-2 py-1 text-xs font-bold rounded-full bg-orange-100 text-orange-700">HOT</span>
      )}
    </div>
    <div className="mt-3 flex space-x-2">
      {handleView ? (
        <button
          onClick={() => handleView(item)}
          className="px-3 py-1 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition text-sm"
          aria-label={`View details of ${item.description}`}
        >
          View
        </button>
      ) : (
        <Link
          to={`/item/${item.id}`}
          className="px-3 py-1 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition text-sm"
          aria-label={`View details of ${item.description}`}
        >
          View
        </Link>
      )}
      {/* Show Quick Preview for grid, not inside modal */}
      {!isModal && openModal && (
        <button
          onClick={() => openModal(item)}
          className="px-3 py-1 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-full hover:bg-gray-300 dark:hover:bg-gray-600 transition text-sm"
          aria-label={`Quick preview of ${item.description}`}
        >
          Quick Preview
        </button>
      )}
      {item.status === 'available' && item.item_type === 'found' && (
        <Link
          to="/claim"
          state={{ itemId: item.id }}
          className="px-3 py-1 bg-purple-600 text-white rounded-full hover:bg-purple-700 transition text-sm"
          aria-label={`Claim ${item.description}`}
        >
          Claim
        </Link>
      )}
    </div>
  </>
);

export default Dashboard;