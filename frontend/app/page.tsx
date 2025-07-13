'use client';

import { useState } from 'react';
import toast from 'react-hot-toast';
import LoadingButton from '../components/LoadingButton';
import LoadingSpinner from '../components/LoadingSpinner';

export default function Home() {
  const [isDataLoading, setIsDataLoading] = useState(false);
  const [isFormSubmitting, setIsFormSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    cropType: ''
  });

  // Simulate data fetching
  const fetchData = async () => {
    setIsDataLoading(true);
    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      toast.success('Data loaded successfully!');
    } catch (error) {
      toast.error('Failed to load data. Please try again.');
    } finally {
      setIsDataLoading(false);
    }
  };

  // Simulate form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.email || !formData.cropType) {
      toast.error('Please fill in all required fields');
      return;
    }

    setIsFormSubmitting(true);
    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1500));
      toast.success('Farm data submitted successfully!');
      setFormData({ name: '', email: '', cropType: '' });
    } catch (error) {
      toast.error('Failed to submit data. Please try again.');
    } finally {
      setIsFormSubmitting(false);
    }
  };

  const showInfoToast = () => {
    toast('Farm management tip: Regular soil testing improves crop yield!', {
      icon: '💡',
    });
  };

  const showWarningToast = () => {
    toast('Weather alert: Heavy rainfall expected this week', {
      icon: '⚠️',
      style: {
        background: '#f59e0b',
        color: '#fff',
      },
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">🌾 Farm Assist</h1>
          <p className="text-lg text-gray-600">Smart farming assistance platform with toast notifications and loading states</p>
        </div>

        {/* Toast Demo Buttons */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">Toast Notifications Demo</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <button
              onClick={() => toast.success('Crops are growing well!')}
              className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors"
            >
              Success Toast
            </button>
            <button
              onClick={() => toast.error('Irrigation system failed!')}
              className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition-colors"
            >
              Error Toast
            </button>
            <button
              onClick={showInfoToast}
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
            >
              Info Toast
            </button>
            <button
              onClick={showWarningToast}
              className="bg-yellow-600 text-white px-4 py-2 rounded-md hover:bg-yellow-700 transition-colors"
            >
              Warning Toast
            </button>
          </div>
        </div>

        {/* Data Loading Demo */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">Data Loading Demo</h2>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <LoadingButton
                onClick={fetchData}
                loading={isDataLoading}
                loadingText="Fetching Data..."
                variant="primary"
              >
                Load Farm Data
              </LoadingButton>
              {isDataLoading && (
                <div className="flex items-center text-gray-600">
                  <LoadingSpinner size="sm" className="mr-2" />
                  <span>Loading crop analytics...</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Form with Loading State */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">Farm Registration Form</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                  Farmer Name *
                </label>
                <input
                  type="text"
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter farmer name"
                  disabled={isFormSubmitting}
                />
              </div>
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                  Email Address *
                </label>
                <input
                  type="email"
                  id="email"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter email address"
                  disabled={isFormSubmitting}
                />
              </div>
            </div>
            <div>
              <label htmlFor="cropType" className="block text-sm font-medium text-gray-700 mb-1">
                Primary Crop Type *
              </label>
              <select
                id="cropType"
                value={formData.cropType}
                onChange={(e) => setFormData(prev => ({ ...prev, cropType: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={isFormSubmitting}
              >
                <option value="">Select crop type</option>
                <option value="rice">Rice</option>
                <option value="wheat">Wheat</option>
                <option value="corn">Corn</option>
                <option value="soybeans">Soybeans</option>
                <option value="cotton">Cotton</option>
                <option value="vegetables">Vegetables</option>
                <option value="fruits">Fruits</option>
              </select>
            </div>
            <div className="flex items-center space-x-4">
              <LoadingButton
                type="submit"
                loading={isFormSubmitting}
                loadingText="Submitting..."
                variant="primary"
              >
                Register Farm
              </LoadingButton>
              {isFormSubmitting && (
                <div className="flex items-center text-gray-600">
                  <LoadingSpinner size="sm" className="mr-2" />
                  <span>Processing registration...</span>
                </div>
              )}
            </div>
          </form>
        </div>

        {/* Usage Examples */}
        <div className="mt-8 bg-gray-100 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-2">Features Implemented:</h3>
          <ul className="text-gray-600 space-y-1">
            <li>✅ React Hot Toast integration with custom styling</li>
            <li>✅ Loading spinners for data fetching operations</li>
            <li>✅ Loading buttons with disabled states during submission</li>
            <li>✅ Success, error, info, and warning toast notifications</li>
            <li>✅ Form validation with toast feedback</li>
            <li>✅ Responsive design with Tailwind CSS</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
