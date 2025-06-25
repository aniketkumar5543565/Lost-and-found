import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import api from '../utils/api';
import { format } from 'date-fns';

const ItemDetails = () => {
  const { id } = useParams();
  const [item, setItem] = useState(null);
  const [reporter, setReporter] = useState(null);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchItemDetails = async () => {
      try {
        setIsLoading(true);
        const itemResponse = await api.get(`/items/${id}`);
        setItem(itemResponse.data);
        
        // Fetch reporter details
        const reporterResponse = await api.get(`/users/${itemResponse.data.reporter_id}`);
        setReporter(reporterResponse.data);
      } catch (err) {
        setError('Failed to load item details. Please try again later.');
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchItemDetails();
  }, [id]);

  const handleContact = () => {
    // Open email client to contact reporter
    window.location.href = `mailto:${reporter.email}?subject=Regarding Item: ${item.description}`;
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen dark:bg-gray-900">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-6 dark:bg-gray-900">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-xl">
          {error}
        </div>
      </div>
    );
  }

  if (!item) {
    return (
      <div className="container mx-auto px-4 py-6 dark:bg-gray-900">
        <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded-xl">
          Item not found
        </div>
      </div>
    );
  }


  return (
    <div className="container mx-auto px-4 py-6 dark:bg-gray-900 min-h-screen">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 max-w-2xl mx-auto">
        <div className="relative">
          <img 
            src={item.image_url} 
            alt={item.description} 
            className="w-full h-80 object-contain rounded-lg mb-4"
            onError={(e) => { e.target.src = '/placeholder-image.jpg'; }}
          />
        </div>
        
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
          {item.description}
        </h1>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div>
            <p className="text-gray-600 dark:text-gray-300 mb-2">
              <span className="font-semibold">Location:</span> {item.location}
            </p>
            <p className="text-gray-600 dark:text-gray-300 mb-2">
              <span className="font-semibold">Type:</span> {item.item_type}
            </p>
            <p className="text-gray-600 dark:text-gray-300 mb-2">
              <span className="font-semibold">Category:</span> {item.category || 'Other'}
            </p>
          </div>
          <div>
            <p className="text-gray-600 dark:text-gray-300 mb-2">
              <span className="font-semibold">Status:</span> 
              <span className={`ml-2 px-2 py-1 rounded ${
                item.status === 'pending' ? 'bg-green-100 text-green-800' :
                item.status === 'Claimed' ? 'bg-yellow-100 text-yellow-800' :
                'bg-red-100 text-red-800'
              }`}>
                {item.status}
              </span>
            </p>
            <p className="text-gray-600 dark:text-gray-300 mb-2">
              <span className="font-semibold">Reported:</span> { format(new Date(item.created_at), "dd/MM/yyyy HH:mm:ss")}
            </p>
          </div>
        </div>

        {reporter && (
          <div className="border-t pt-4 dark:border-gray-700">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
              Reporter Details
            </h2>
            <div className="flex items-center space-x-3 mb-4">
              <img
                src={reporter.profile_image_url}
                alt={reporter.name[0] || 'Unknown Reporter'}
                className="w-12 h-12 rounded-full object-cover"
              />
              <div>
                <p className="text-gray-900 dark:text-white font-medium">
                  {reporter.name || 'Unknown Reporter'}
                </p>
              </div>
            </div>
            <div className="space-y-2">
              <p className="text-gray-600 dark:text-gray-300">
                <span className="font-semibold">Email:</span> {reporter.email}
              </p>
              <p className="text-gray-600 dark:text-gray-300">
                <span className="font-semibold">Phone:</span> {reporter.phone || 'Not provided'}
              </p>
              <p className="text-gray-600 dark:text-gray-300">
                <span className="font-semibold">RollNo:</span> {reporter.location || 'Not provided'}
              </p>
            </div>
            <button
              onClick={handleContact}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Contact Reporter
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ItemDetails;