import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { problemService } from '../services/api';
import '../styles/UploadProblem.css';

// Responsive upload form layout:
// - Full width on mobile
// - max-w-2xl centered on desktop
// - Buttons full width on mobile
// - Side-by-side fields on desktop using flex
// - Responsive form spacing and padding

function UploadProblem() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    imageFile: null,
    description: '',
    latitude: '',
    longitude: '',
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file && file.size > 5 * 1024 * 1024) {
      setError('Image size must be less than 5MB');
      return;
    }
    setFormData({ ...formData, imageFile: file });
    setError('');
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleGetLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((position) => {
        setFormData({
          ...formData,
          latitude: position.coords.latitude.toString(),
          longitude: position.coords.longitude.toString(),
        });
      }, () => {
        setError('Failed to get your location');
      });
    } else {
      setError('Geolocation is not supported');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.imageFile) {
      setError('Please select an image');
      return;
    }

    if (!formData.description.trim()) {
      setError('Please provide a description');
      return;
    }

    if (!formData.latitude || !formData.longitude) {
      setError('Please provide location (GPS coordinates)');
      return;
    }

    try {
      setLoading(true);
      const form = new FormData();
      form.append('imageFile', formData.imageFile);
      form.append('description', formData.description);
      form.append('latitude', formData.latitude);
      form.append('longitude', formData.longitude);

      await problemService.createProblem(form);

      setSuccess('Issue reported successfully! Thank you for your contribution.');
      setFormData({ imageFile: null, description: '', latitude: '', longitude: '' });

      setTimeout(() => {
        navigate('/');
      }, 2000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to report issue');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950">
      <div className="container mx-auto px-4 py-6 md:py-8 lg:py-10">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="mb-8 md:mb-10">
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold bg-gradient-to-r from-purple-300 to-pink-300 bg-clip-text text-transparent mb-2">
              Report a Civic Issue
            </h2>
            <p className="text-sm md:text-base text-gray-300">
              Help improve your community by reporting issues anonymously
            </p>
          </div>

          {/* Error Alert */}
          {error && (
            <div className="mb-6 p-4 md:p-5 bg-red-500/20 border border-red-500/50 rounded-lg text-red-300 text-sm md:text-base animate-pulse">
              {error}
            </div>
          )}

          {/* Success Alert */}
          {success && (
            <div className="mb-6 p-4 md:p-5 bg-green-500/20 border border-green-500/50 rounded-lg text-green-300 text-sm md:text-base">
              {success}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6 md:space-y-8">
            {/* Image Upload */}
            <div className="form-group">
              <label htmlFor="imageFile" className="block text-sm md:text-base font-semibold text-gray-200 mb-2">
                Upload Image <span className="text-pink-400">*</span>
              </label>
              <div className="relative border-2 border-dashed border-purple-500/50 rounded-lg p-6 md:p-8 hover:border-pink-500/50 transition-colors duration-300 bg-slate-800/30">
                <input
                  type="file"
                  id="imageFile"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  required
                />
                <div className="text-center pointer-events-none">
                  <div className="text-3xl md:text-4xl mb-2">📸</div>
                  <p className="text-gray-300 text-sm md:text-base">
                    Click to upload or drag and drop
                  </p>
                  <p className="text-gray-500 text-xs md:text-sm mt-1">
                    PNG, JPG up to 5MB
                  </p>
                </div>
              </div>
              {formData.imageFile && (
                <p className="mt-2 text-sm text-purple-300">
                  ✓ {formData.imageFile.name}
                </p>
              )}
            </div>

            {/* Description */}
            <div className="form-group">
              <label htmlFor="description" className="block text-sm md:text-base font-semibold text-gray-200 mb-2">
                Description <span className="text-pink-400">*</span>
              </label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                placeholder="Describe the issue in detail (10-1000 characters)"
                minLength="10"
                maxLength="1000"
                required
                className="w-full px-4 py-3 md:py-4 bg-slate-800/50 border border-purple-500/30 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-pink-500/50 transition-colors duration-300 text-sm md:text-base"
              />
              <div className="flex justify-between items-center mt-2">
                <p className="text-xs md:text-sm text-gray-500">
                  {formData.description.length}/1000 characters
                </p>
                {formData.description.length < 10 && (
                  <p className="text-xs text-red-400">
                    Minimum 10 characters required
                  </p>
                )}
              </div>
            </div>

            {/* Location Section */}
            <div className="form-group">
              <label className="block text-sm md:text-base font-semibold text-gray-200 mb-3 md:mb-4">
                Location <span className="text-pink-400">*</span>
              </label>

              {/* Get Location Button */}
              <button
                type="button"
                onClick={handleGetLocation}
                className="w-full md:w-auto px-6 py-2 md:py-3 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white rounded-lg transition-all duration-300 text-sm md:text-base font-medium mb-4"
              >
                📍 Get My Location
              </button>

              {/* Latitude and Longitude Fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                <div>
                  <label htmlFor="latitude" className="block text-sm md:text-base font-medium text-gray-300 mb-2">
                    Latitude <span className="text-pink-400">*</span>
                  </label>
                  <input
                    type="number"
                    id="latitude"
                    name="latitude"
                    value={formData.latitude}
                    onChange={handleInputChange}
                    placeholder="-90 to 90"
                    min="-90"
                    max="90"
                    step="any"
                    required
                    className="w-full px-4 py-2 md:py-3 bg-slate-800/50 border border-purple-500/30 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-pink-500/50 transition-colors duration-300 text-sm md:text-base"
                  />
                </div>
                <div>
                  <label htmlFor="longitude" className="block text-sm md:text-base font-medium text-gray-300 mb-2">
                    Longitude <span className="text-pink-400">*</span>
                  </label>
                  <input
                    type="number"
                    id="longitude"
                    name="longitude"
                    value={formData.longitude}
                    onChange={handleInputChange}
                    placeholder="-180 to 180"
                    min="-180"
                    max="180"
                    step="any"
                    required
                    className="w-full px-4 py-2 md:py-3 bg-slate-800/50 border border-purple-500/30 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-pink-500/50 transition-colors duration-300 text-sm md:text-base"
                  />
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full px-6 py-3 md:py-4 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg transition-all duration-300 text-sm md:text-base font-semibold"
            >
              {loading ? '⏳ Submitting...' : '✓ Submit Report'}
            </button>
          </form>

          {/* Privacy Note */}
          <div className="mt-8 md:mt-10 p-4 md:p-5 bg-slate-800/30 border border-green-500/30 rounded-lg">
            <p className="text-xs md:text-sm text-gray-300 space-y-1">
              <span className="block">✓ Your report is completely anonymous</span>
              <span className="block">✓ Image metadata is automatically removed</span>
              <span className="block">✓ Content is AI-moderated for safety</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default UploadProblem;
