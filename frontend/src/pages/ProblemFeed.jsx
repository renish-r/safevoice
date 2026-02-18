import React, { useState, useEffect } from 'react';
import { problemService } from '../services/api';
import '../styles/ProblemFeed.css';

function ProblemFeed() {
  const [problems, setProblems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  useEffect(() => {
    fetchProblems();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  const fetchProblems = async () => {
    try {
      setLoading(true);
      const response = await problemService.getProblems(page, 10);
      setProblems(response.data.content);
      setTotalPages(response.data.totalPages);
      setError('');
    } catch (err) {
      setError('Failed to load problems');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'OPEN':
        return 'status-open';
      case 'UNDER_REVIEW':
        return 'status-review';
      case 'RESOLVED':
        return 'status-resolved';
      case 'REJECTED':
        return 'status-rejected';
      default:
        return '';
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div className="problem-feed">
      <div className="feed-header">
        <h2>Civic Issues Feed</h2>
        <p>Recently reported issues in your community</p>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {loading ? (
        <div className="loading">Loading issues...</div>
      ) : problems.length === 0 ? (
        <div className="no-problems">No issues reported yet</div>
      ) : (
        <div className="problems-grid">
          {problems.map((problem) => (
            <div key={problem.id} className="problem-card">
              <div className="problem-image">
                <img src={problem.imageUrl} alt={problem.description} />
              </div>

              <div className="problem-content">
                <div className="problem-header">
                  <span className={`status-badge ${getStatusColor(problem.status)}`}>
                    {problem.status}
                  </span>
                  <span className="moderation-score">
                    Moderation: {(problem.aiModerationScore * 100).toFixed(0)}%
                  </span>
                </div>

                <p className="description">{problem.description}</p>

                <div className="problem-meta">
                  <span className="location">
                    📍 {problem.latitude.toFixed(4)}, {problem.longitude.toFixed(4)}
                  </span>
                  <span className="date">
                    📅 {formatDate(problem.createdAt)}
                  </span>
                </div>

                {problem.resolutionCount > 0 && (
                  <div className="resolutions">
                    <span className="resolution-count">
                      {problem.resolutionCount} resolution(s)
                    </span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className="pagination">
          <button
            onClick={() => setPage(Math.max(0, page - 1))}
            disabled={page === 0}
            className="btn-prev"
          >
            Previous
          </button>
          <span className="page-info">
            Page {page + 1} of {totalPages}
          </span>
          <button
            onClick={() => setPage(Math.min(totalPages - 1, page + 1))}
            disabled={page === totalPages - 1}
            className="btn-next"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}

export default ProblemFeed;
