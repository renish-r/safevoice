import React, { useState, useEffect, useRef } from 'react';
import { problemService } from '../services/api';
import '../styles/ProblemFeed.css';

// Responsive problem grid layout
// Mobile: 1 column
// Tablet: 2 columns
// Desktop: 3 columns
// Use responsive grid: grid-cols-1 md:grid-cols-2 lg:grid-cols-3
// Responsive card height and image sizing
// Mobile-first padding and spacing

function ProblemFeed() {
  const [problems, setProblems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [imageErrors, setImageErrors] = useState({});
  const [selectedImage, setSelectedImage] = useState(null);
  const [imageDimensions, setImageDimensions] = useState({ width: 0, height: 0 });
  const [zoomLevel, setZoomLevel] = useState(1);
  const [panX, setPanX] = useState(0);
  const [panY, setPanY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const dragDistanceRef = useRef(0);

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
    const statusColors = {
      'OPEN': 'bg-blue-500/20 text-blue-300 border border-blue-500/50',
      'UNDER_REVIEW': 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/50',
      'RESOLVED': 'bg-green-500/20 text-green-300 border border-green-500/50',
      'REJECTED': 'bg-red-500/20 text-red-300 border border-red-500/50',
    };
    return statusColors[status] || 'bg-gray-500/20 text-gray-300';
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const handleImageError = (problemId) => {
    setImageErrors(prev => ({ ...prev, [problemId]: true }));
    console.error(`Failed to load image for problem ${problemId}`);
  };

  const openImageModal = (imageUrl) => {
    setSelectedImage(imageUrl);
    setZoomLevel(1);
    setPanX(0);
    setPanY(0);
    setImageDimensions({ width: 0, height: 0 });
    dragDistanceRef.current = 0;
  };

  const closeImageModal = () => {
    setSelectedImage(null);
    setZoomLevel(1);
    setPanX(0);
    setPanY(0);
  };

  const toggleZoom = () => {
    if (zoomLevel === 1) {
      setZoomLevel(2.5);
      setPanX(0);
      setPanY(0);
    } else {
      setZoomLevel(1);
      setPanX(0);
      setPanY(0);
    }
  };

  const handleWheel = (e) => {
    if (zoomLevel === 1) return;
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.2 : 0.2;
    const newZoom = Math.max(0.5, Math.min(3, zoomLevel + delta));
    setZoomLevel(newZoom);
  };

  const handleMouseDown = (e) => {
    if (zoomLevel === 1) return;
    e.preventDefault();
    setIsDragging(true);
    dragDistanceRef.current = 0;
    setDragStart({ x: e.clientX, y: e.clientY });
  };

  const handleMouseMove = (e) => {
    if (!isDragging || zoomLevel === 1) return;
    e.preventDefault();
    
    // Calculate distance moved
    const distX = e.clientX - dragStart.x;
    const distY = e.clientY - dragStart.y;
    const distance = Math.sqrt(distX * distX + distY * distY);
    // Track max distance dragged
    dragDistanceRef.current = Math.max(dragDistanceRef.current, distance);
    
    // Calculate max pan distance based on actual image dimensions (limited)
    const imgWidth = imageDimensions.width || 400;
    const imgHeight = imageDimensions.height || 300;
    // Use smaller multiplier to prevent excessive dragging - cap at reasonable limits
    const maxPanX = Math.min(100, imgWidth * (zoomLevel - 1) / 4);
    const maxPanY = Math.min(75, imgHeight * (zoomLevel - 1) / 4);
    
    let newX = panX + distX;
    let newY = panY + distY;
    
    // Constrain pan within boundaries
    newX = Math.max(-maxPanX, Math.min(maxPanX, newX));
    newY = Math.max(-maxPanY, Math.min(maxPanY, newY));
    
    setPanX(newX);
    setPanY(newY);
    setDragStart({ x: e.clientX, y: e.clientY });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleModalClick = (e) => {
    if (e.target.id === 'imageModal') {
      closeImageModal();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950">
      <div className="container mx-auto px-4 py-6 md:py-8 lg:py-10">
        {/* Header Section */}
        <div className="mb-8 md:mb-10">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold bg-gradient-to-r from-purple-300 to-pink-300 bg-clip-text text-transparent mb-2">
            Civic Issues Feed
          </h2>
          <p className="text-sm md:text-base lg:text-lg text-gray-300">
            Recently reported issues in your community
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-6 p-4 md:p-5 bg-red-500/20 border border-red-500/50 rounded-lg text-red-300 text-sm md:text-base">
            {error}
          </div>
        )}

        {/* Loading State */}
        {loading ? (
          <div className="flex items-center justify-center min-h-96">
            <div className="text-center">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
              <p className="mt-4 text-gray-300">Loading issues...</p>
            </div>
          </div>
        ) : problems.length === 0 ? (
          <div className="flex items-center justify-center min-h-96">
            <div className="text-center">
              <p className="text-lg md:text-xl text-gray-400">No issues reported yet</p>
              <p className="text-sm text-gray-500 mt-2">Be the first to report a civic issue</p>
            </div>
          </div>
        ) : (
          <>
            {/* Responsive Problem Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 mb-8 md:mb-10">
              {problems.map((problem) => (
                <div
                  key={problem.id}
                  className="group bg-slate-800/50 border border-purple-500/30 rounded-lg overflow-hidden hover:border-pink-500/50 transition-all duration-300 hover:shadow-lg hover:shadow-purple-500/20"
                >
                  {/* Problem Image */}
                  <div className="relative overflow-hidden bg-slate-700 h-48 md:h-56 lg:h-64 flex items-center justify-center cursor-pointer hover:opacity-90 transition-opacity"
                    onClick={() => !imageErrors[problem.id] && openImageModal(problem.imageUrl)}>
                    {imageErrors[problem.id] ? (
                      <div className="flex flex-col items-center justify-center w-full h-full bg-slate-700">
                        <div className="text-3xl mb-2">📸</div>
                        <p className="text-xs text-gray-400">Image unavailable</p>
                      </div>
                    ) : (
                      <>
                        <img
                          src={problem.imageUrl}
                          alt={problem.description}
                          onError={() => handleImageError(problem.id)}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                        />
                        {/* Zoom Icon Overlay */}
                        <div className="absolute top-2 right-2 bg-black/50 p-2 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM13 10H7" />
                          </svg>
                        </div>
                      </>
                    )}
                  </div>

                  {/* Problem Content */}
                  <div className="p-4 md:p-5 lg:p-6">
                    {/* Status and Moderation Score */}
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 mb-3">
                      <span
                        className={`inline-block px-3 py-1 rounded-full text-xs md:text-sm font-medium w-fit ${getStatusColor(problem.status)}`}
                      >
                        {problem.status.replace('_', ' ')}
                      </span>
                      <span className="text-xs md:text-sm text-gray-400">
                        Safety: {(problem.aiModerationScore * 100).toFixed(0)}%
                      </span>
                    </div>

                    {/* Description */}
                    <p className="text-sm md:text-base text-gray-200 mb-4 line-clamp-3">
                      {problem.description}
                    </p>

                    {/* Location and Date */}
                    <div className="space-y-2 mb-4 text-xs md:text-sm text-gray-400">
                      <p className="flex items-center gap-2">
                        <span>📍</span>
                        {problem.latitude.toFixed(4)}, {problem.longitude.toFixed(4)}
                      </p>
                      <p className="flex items-center gap-2">
                        <span>📅</span>
                        {formatDate(problem.createdAt)}
                      </p>
                    </div>

                    {/* Resolutions */}
                    {problem.resolutionCount > 0 && (
                      <div className="pt-3 border-t border-purple-500/20">
                        <p className="text-xs md:text-sm text-purple-300">
                          💬 {problem.resolutionCount} resolution(s)
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex flex-col md:flex-row items-center justify-center gap-3 md:gap-6">
                <button
                  onClick={() => setPage(Math.max(0, page - 1))}
                  disabled={page === 0}
                  className="w-full md:w-auto px-6 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 disabled:opacity-50 text-white rounded-lg transition-all duration-300 text-sm md:text-base"
                >
                  ← Previous
                </button>
                <span className="text-sm md:text-base text-gray-300">
                  Page {page + 1} of {totalPages}
                </span>
                <button
                  onClick={() => setPage(Math.min(totalPages - 1, page + 1))}
                  disabled={page === totalPages - 1}
                  className="w-full md:w-auto px-6 py-2 bg-pink-600 hover:bg-pink-700 disabled:bg-gray-600 disabled:opacity-50 text-white rounded-lg transition-all duration-300 text-sm md:text-base"
                >
                  Next →
                </button>
              </div>
            )}
          </>
        )}

        {/* Image Modal/Lightbox */}
        {selectedImage && (
          <div
            id="imageModal"
            onClick={handleModalClick}
            className="fixed inset-0 bg-black/85 flex items-center justify-center z-50 p-4"
          >
            <div 
              className="flex flex-col items-center justify-center max-w-4xl max-h-screen"
              onClick={(e) => e.stopPropagation()}
              onWheel={handleWheel}
            >
              {/* Image Container */}
              <div 
                className="overflow-hidden rounded-lg bg-black/50 cursor-grab active:cursor-grabbing"
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
                onClick={(e) => e.stopPropagation()}
                style={{ width: '100%', maxWidth: '600px', maxHeight: '70vh' }}
              >
                <img
                  src={selectedImage}
                  alt="Full view"
                  onLoad={(e) => {
                    setImageDimensions({
                      width: e.target.naturalWidth,
                      height: e.target.naturalHeight
                    });
                  }}
                  style={{ 
                    transform: `scale(${zoomLevel}) translate(${panX}px, ${panY}px)`,
                    transformOrigin: 'center center',
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (dragDistanceRef.current <= 5) {
                      toggleZoom();
                    }
                  }}
                  className="max-w-full max-h-[70vh] object-contain transition-none cursor-pointer select-none w-full h-full"
                  draggable="false"
                />
              </div>

              {/* Info and Controls */}
              <div className="flex flex-col items-center justify-center gap-3 mt-4">
                <button
                  onClick={closeImageModal}
                  className="px-6 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-all text-sm md:text-base"
                >
                  ✕ Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default ProblemFeed;
