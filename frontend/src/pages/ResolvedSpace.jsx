import React, { useEffect, useState } from 'react';
import { problemService } from '../services/api';

function ResolvedSpace() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchResolvedPosts();
  }, []);

  const fetchResolvedPosts = async () => {
    try {
      setLoading(true);
      const response = await problemService.getResolvedPosts(0, 20);
      setPosts(response.data.content || []);
      setError('');
    } catch (err) {
      setError('Failed to load resolved posts');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="p-6 text-white">Loading resolved posts...</div>;
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white p-6">
      <h2 className="text-3xl font-bold mb-6">Resolved Space</h2>
      {error && <div className="mb-4 text-red-300">{error}</div>}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {posts.map((post) => (
          <div key={post.resolutionId} className="bg-slate-800 rounded-lg p-4 border border-slate-700">
            <p className="text-sm text-slate-300 mb-3">Problem #{post.problemId}</p>
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div>
                <p className="text-xs text-slate-400 mb-1">Anonymous Report</p>
                <img src={post.originalImageUrl} alt="Original issue" className="w-full h-44 object-cover rounded" />
              </div>
              <div>
                <p className="text-xs text-slate-400 mb-1">Official Resolution</p>
                <img src={post.resolvedImageUrl} alt="Resolved issue" className="w-full h-44 object-cover rounded" />
              </div>
            </div>
            <p className="text-sm text-slate-200 mb-2"><strong>Issue:</strong> {post.originalDescription}</p>
            <p className="text-sm text-slate-200 mb-2"><strong>Resolution:</strong> {post.officialDescription}</p>
            <p className="text-xs text-emerald-300">{post.verificationReason}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export default ResolvedSpace;
