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
      setProblems(response.data.content);
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

    try {
      setLoading(true);
      await officialService.uploadResolution(selectedProblem.id, resolutionImage);

      setSuccess('Resolution uploaded and verified!');
      setResolutionImage(null);
      setSelectedProblem(null);
      fetchProblems();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to upload resolution');
    } finally {
      setLoading(false);
    }
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
