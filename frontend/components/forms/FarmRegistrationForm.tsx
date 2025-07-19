'use client';
import React, { useState, FormEvent } from 'react';

// Define the type for our form data for type safety
interface FarmData {
  cropType: string;
  size: number | '';
  location: string;
  plantingSeason: string;
}

// Define the type for the API response
interface ApiResponse {
  success: boolean;
  message: string;
  data?: FarmData;
}

// A simple icon component for better UI. In a real app, you might use a library like lucide-react.
const CheckCircleIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const RegisterFarm = () => {
  // State to hold the form data
  const [formData, setFormData] = useState<FarmData>({
    cropType: '',
    size: '',
    location: '',
    plantingSeason: '',
  });

  // State to manage the form's submission status
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionStatus, setSubmissionStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [responseMessage, setResponseMessage] = useState('');

  // --- FORM INPUT HANDLER ---
  // A generic handler to update the state for any form field
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prevData => ({
      ...prevData,
      [name]: name === 'size' ? (value === '' ? '' : parseFloat(value)) : value,
    }));
  };

  // --- FORM SUBMISSION HANDLER ---
  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault(); // Prevent the default browser form submission
    setIsSubmitting(true);
    setSubmissionStatus('idle');

    // --- SIMULATED API POST REQUEST ---
    // In a real Next.js app, you would have an API route at `/pages/api/farms.ts`
    // and use fetch() to send the data.
    console.log('Submitting form data:', formData);

    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 1500));

    try {
      // This is where you would make the actual fetch call:
      // const response = await fetch('/api/farms', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(formData),
      // });
      // const result: ApiResponse = await response.json();
      
      // For demonstration, we'll simulate a successful response
      const simulatedResult: ApiResponse = {
        success: true,
        message: 'Farm registered successfully!',
        data: formData,
      };

      if (simulatedResult.success) {
        setSubmissionStatus('success');
        setResponseMessage(simulatedResult.message);
        // Reset form after a short delay
        setTimeout(() => {
            setFormData({ cropType: '', size: '', location: '', plantingSeason: '' });
            setSubmissionStatus('idle');
        }, 4000);
      } else {
        throw new Error(simulatedResult.message || 'An unknown error occurred.');
      }
    } catch (error) {
      console.error('Submission failed:', error);
      setSubmissionStatus('error');
      setResponseMessage(error instanceof Error ? error.message : 'Failed to submit the form.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-gray-50 min-h-screen flex items-center justify-center font-sans p-4">
      <div className="w-full max-w-lg">
        {submissionStatus === 'success' ? (
          // --- CONFIRMATION MESSAGE ---
          <div className="bg-white p-8 rounded-xl shadow-lg text-center transition-all duration-500 ease-in-out">
            <div className="flex justify-center mb-4">
              <CheckCircleIcon />
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Success!</h2>
            <p className="text-gray-600">{responseMessage}</p>
          </div>
        ) : (
          // --- REGISTRATION FORM ---
          <div className="bg-white p-8 rounded-xl shadow-lg transition-all duration-500 ease-in-out">
            <div className="mb-6 text-center">
              <h1 className="text-3xl font-bold text-gray-900">Register Your Farm</h1>
              <p className="text-gray-500 mt-2">Enter your farm details below to get started.</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* --- CROP TYPE INPUT --- */}
              <div>
                <label htmlFor="cropType" className="block text-sm font-medium text-gray-700 mb-1">
                  Crop Type
                </label>
                <input
                  type="text"
                  id="cropType"
                  name="cropType"
                  value={formData.cropType}
                  onChange={handleInputChange}
                  placeholder="e.g., Maize, Soybeans, Wheat"
                  required
                  className="w-full px-4 py-2 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                />
              </div>

              {/* --- SIZE INPUT --- */}
              <div>
                <label htmlFor="size" className="block text-sm font-medium text-gray-700 mb-1">
                  Farm Size (in hectares)
                </label>
                <input
                  type="number"
                  id="size"
                  name="size"
                  value={formData.size}
                  onChange={handleInputChange}
                  placeholder="e.g., 15.5"
                  required
                  min="0"
                  step="0.1"
                  className="w-full px-4 py-2 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                />
              </div>

              {/* --- LOCATION INPUT --- */}
              <div>
                <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-1">
                  Location / GPS Coordinates
                </label>
                <input
                  type="text"
                  id="location"
                  name="location"
                  value={formData.location}
                  onChange={handleInputChange}
                  placeholder="e.g., Kaduna South, Kaduna"
                  required
                  className="w-full px-4 py-2 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                />
              </div>

              {/* --- PLANTING SEASON SELECT --- */}
              <div>
                <label htmlFor="plantingSeason" className="block text-sm font-medium text-gray-700 mb-1">
                  Planting Season
                </label>
                <select
                  id="plantingSeason"
                  name="plantingSeason"
                  value={formData.plantingSeason}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-2 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors appearance-none"
                >
                  <option value="" disabled>Select a season</option>
                  <option value="Rainy Season (Apr-Oct)">Rainy Season (Apr-Oct)</option>
                  <option value="Dry Season (Nov-Mar)">Dry Season (Nov-Mar)</option>
                  <option value="All Year">All Year Round</option>
                </select>
              </div>

              {/* --- SUBMIT BUTTON --- */}
              <div>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-blue-300 disabled:cursor-not-allowed transition-all"
                >
                  {isSubmitting ? 'Submitting...' : 'Register Farm'}
                </button>
              </div>

              {/* --- ERROR MESSAGE DISPLAY --- */}
              {submissionStatus === 'error' && (
                <p className="text-sm text-center text-red-600">{responseMessage}</p>
              )}
            </form>
          </div>
        )}
      </div>
    </div>
  );
};

export default RegisterFarm;
