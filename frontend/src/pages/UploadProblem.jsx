import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { problemService } from '../services/api';
import '../styles/UploadProblem.css';

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
    <div className="upload-problem">
      <div className="upload-container">
        <h2>Report a Civic Issue</h2>
        <p className="subtitle">Help improve your community by reporting issues anonymously</p>

        {error && <div className="alert alert-error">{error}</div>}
        {success && <div className="alert alert-success">{success}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="imageFile">Upload Image *</label>
            <input
              type="file"
              id="imageFile"
              accept="image/*"
              onChange={handleFileChange}
              className="file-input"
            />
            {formData.imageFile && <p className="file-name">{formData.imageFile.name}</p>}
          </div>

          <div className="form-group">
            <label htmlFor="description">Description *</label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              placeholder="Describe the issue in detail (10-1000 characters)"
              minLength="10"
              maxLength="1000"
              required
            />
            <p className="char-count">
              {formData.description.length}/1000
            </p>
          </div>

          <div className="form-group location-group">
            <label>Location *</label>
            <button
              type="button"
              onClick={handleGetLocation}
              className="btn-location"
            >
              Get My Location
            </button>

            <div className="coordinates">
              <div>
                <label htmlFor="latitude">Latitude *</label>
                <input
                  type="number"
                  id="latitude"
                  name="latitude"
                  value={formData.latitude}
                  onChange={handleInputChange}
                  placeholder="-90 to 90"
                  min="-90"
                  max="90"
                  step="0.000001"
                  required
                />
              </div>
              <div>
                <label htmlFor="longitude">Longitude *</label>
                <input
                  type="number"
                  id="longitude"
                  name="longitude"
                  value={formData.longitude}
                  onChange={handleInputChange}
                  placeholder="-180 to 180"
                  min="-180"
                  max="180"
                  step="0.000001"
                  required
                />
              </div>
            </div>
          </div>

          <button type="submit" className="btn-submit" disabled={loading}>
            {loading ? 'Submitting...' : 'Submit Report'}
          </button>
        </form>

        <p className="privacy-note">
          ✓ Your report is anonymous | ✓ Image metadata is removed | ✓ Content is AI-moderated
        </p>
      </div>
    </div>
  );
}

export default UploadProblem;
