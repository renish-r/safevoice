import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { problemService, officialService } from '../services/api';
import '../styles/Dashboard.css';

function OfficialDashboard() {
  const [problems, setProblems] = useState([]);
  const [selectedProblem, setSelectedProblem] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [resolutionImage, setResolutionImage] = useState(null);
  const [resolutionDescription, setResolutionDescription] = useState('');
  const [officialLatitude, setOfficialLatitude] = useState('');
  const [officialLongitude, setOfficialLongitude] = useState('');

  const isLoggedIn = localStorage.getItem('accessToken');

  useEffect(() => {
    if (isLoggedIn) {
      fetchProblems();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoggedIn]);

  if (!isLoggedIn) {
    return <Navigate to="/auth/login" />;
  }

  const fetchProblems = async () => {
    try {
      setLoading(true);
      const response = await problemService.getProblems(0, 50);
      const pendingProblems = (response.data.content || []).filter(
        (problem) => problem.status === 'OPEN' || problem.status === 'UNDER_REVIEW'
      );
      setProblems(pendingProblems);
    } catch (err) {
      setError('Failed to load problems');
    } finally {
      setLoading(false);
    }
  };

  const handleUploadResolution = async (e) => {
    e.preventDefault();

    if (!selectedProblem || !resolutionImage) {
      setError('Please select a problem and image');
      return;
    }

    if (!resolutionDescription.trim()) {
      setError('Please add resolution description');
      return;
    }

    if (!officialLatitude || !officialLongitude) {
      setError('Please provide your current location');
      return;
    }

    try {
      setLoading(true);
      setError('');
      setSuccess('');
      const response = await officialService.uploadResolution(
        selectedProblem.id,
        resolutionImage,
        resolutionDescription,
        officialLatitude,
        officialLongitude
      );

      const status = response.data?.verificationStatus;
      const reason = response.data?.verificationReason;

      if (status === 'VERIFIED') {
        setSuccess('Resolution uploaded and verified!');
      } else {
        setError(reason || 'Resolution rejected by verification checks');
      }
      setResolutionImage(null);
      setResolutionDescription('');
      setOfficialLatitude('');
      setOfficialLongitude('');
      setSelectedProblem(null);
      fetchProblems();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to upload resolution');
    } finally {
      setLoading(false);
    }
  };

  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      setError('Geolocation not supported');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setOfficialLatitude(position.coords.latitude.toString());
        setOfficialLongitude(position.coords.longitude.toString());
      },
      () => setError('Failed to fetch location')
    );
  };

  return (
    <div className="dashboard">
      <div className="dashboard-container">
        <h2>Official Dashboard</h2>

        {error && <div className="alert alert-error">{error}</div>}
        {success && <div className="alert alert-success">{success}</div>}

        <div className="dashboard-layout">
          <div className="problems-list">
            <h3>Pending Issues</h3>
            {loading ? (
              <p>Loading...</p>
            ) : (
              <div className="list-items">
                {problems.map((problem) => (
                  <div
                    key={problem.id}
                    className={`list-item ${selectedProblem?.id === problem.id ? 'active' : ''}`}
                    onClick={() => setSelectedProblem(problem)}
                  >
                    <img src={problem.imageUrl} alt="Problem" />
                    <div className="item-info">
                      <p className="description">{problem.description}</p>
                      <span className="status">{problem.status}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {selectedProblem && (
            <div className="resolution-form">
              <h3>Upload Resolution</h3>
              <img src={selectedProblem.imageUrl} alt="Original" className="original-image" />
              <p className="description">{selectedProblem.description}</p>

              <form onSubmit={handleUploadResolution}>
                <div className="form-group">
                  <label htmlFor="resolutionImage">Upload Resolved Image</label>
                  <input
                    type="file"
                    id="resolutionImage"
                    accept="image/*"
                    onChange={(e) => setResolutionImage(e.target.files[0])}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="resolutionDescription">Resolution Description</label>
                  <textarea
                    id="resolutionDescription"
                    value={resolutionDescription}
                    onChange={(e) => setResolutionDescription(e.target.value)}
                    placeholder="Explain what was fixed and current status"
                    minLength={10}
                    maxLength={1000}
                  />
                </div>

                <div className="form-group">
                  <button type="button" className="btn-submit" onClick={handleGetLocation}>
                    Use Current Location
                  </button>
                </div>

                <div className="form-group">
                  <label htmlFor="officialLatitude">Latitude</label>
                  <input
                    type="number"
                    id="officialLatitude"
                    value={officialLatitude}
                    onChange={(e) => setOfficialLatitude(e.target.value)}
                    step="any"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="officialLongitude">Longitude</label>
                  <input
                    type="number"
                    id="officialLongitude"
                    value={officialLongitude}
                    onChange={(e) => setOfficialLongitude(e.target.value)}
                    step="any"
                  />
                </div>

                <button type="submit" className="btn-submit" disabled={loading}>
                  {loading ? 'Uploading...' : 'Upload & Verify'}
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default OfficialDashboard;
