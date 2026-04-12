import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../services/api';
import { User, Mail, IdCard, Building2, Shield, CheckCircle, XCircle, Calendar } from 'lucide-react';

function Profile() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const response = await authService.getCurrentUser();
      setProfile(response.data);
      setError('');
    } catch (err) {
      console.error('Failed to fetch profile:', err);
      setError('Failed to load profile. Please try again.');
      if (err.response?.status === 401) {
        // Token expired or invalid, redirect to login
        localStorage.removeItem('accessToken');
        navigate('/auth/login');
      }
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-purple-500 mx-auto mb-4"></div>
          <p className="text-gray-300 text-lg">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center px-4">
        <div className="bg-red-500/10 border border-red-500 rounded-lg p-6 max-w-md w-full">
          <p className="text-red-400 text-center">{error}</p>
          <button
            onClick={fetchProfile}
            className="mt-4 w-full px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-all"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950">
      <div className="container mx-auto px-4 py-6 md:py-10 lg:py-12">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold bg-gradient-to-r from-purple-300 to-pink-300 bg-clip-text text-transparent mb-2">
            My Profile
          </h1>
          <p className="text-sm md:text-base text-gray-300">
            View your account details and status
          </p>
        </div>

        {/* Profile Card */}
        <div className="max-w-4xl mx-auto bg-slate-800/50 backdrop-blur-sm border border-purple-500/30 rounded-xl shadow-2xl overflow-hidden">
          {/* Header Section */}
          <div className="bg-gradient-to-r from-purple-600/20 to-pink-600/20 border-b border-purple-500/30 p-6 md:p-8">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 md:w-20 md:h-20 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                <User size={40} className="text-white" />
              </div>
              <div>
                <h2 className="text-2xl md:text-3xl font-bold text-white">{profile?.fullName}</h2>
                <p className="text-sm md:text-base text-purple-200">{profile?.department}</p>
              </div>
            </div>
          </div>

          {/* Details Section */}
          <div className="p-6 md:p-8 space-y-6">
            {/* Email */}
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 bg-purple-600/20 rounded-lg flex items-center justify-center flex-shrink-0">
                <Mail size={20} className="text-purple-400" />
              </div>
              <div className="flex-1">
                <p className="text-sm text-gray-400 mb-1">Email Address</p>
                <p className="text-base md:text-lg text-white font-medium break-all">{profile?.email}</p>
              </div>
            </div>

            {/* Official ID */}
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 bg-purple-600/20 rounded-lg flex items-center justify-center flex-shrink-0">
                <IdCard size={20} className="text-purple-400" />
              </div>
              <div className="flex-1">
                <p className="text-sm text-gray-400 mb-1">Official ID Number</p>
                <p className="text-base md:text-lg text-white font-medium">{profile?.officialIdNumber}</p>
              </div>
            </div>

            {/* Department */}
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 bg-purple-600/20 rounded-lg flex items-center justify-center flex-shrink-0">
                <Building2 size={20} className="text-purple-400" />
              </div>
              <div className="flex-1">
                <p className="text-sm text-gray-400 mb-1">Department</p>
                <p className="text-base md:text-lg text-white font-medium">{profile?.department}</p>
              </div>
            </div>

            {/* Role */}
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 bg-purple-600/20 rounded-lg flex items-center justify-center flex-shrink-0">
                <Shield size={20} className="text-purple-400" />
              </div>
              <div className="flex-1">
                <p className="text-sm text-gray-400 mb-1">Role</p>
                <p className="text-base md:text-lg text-white font-medium capitalize">
                  {profile?.role?.toLowerCase()}
                </p>
              </div>
            </div>

            {/* Created At */}
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 bg-purple-600/20 rounded-lg flex items-center justify-center flex-shrink-0">
                <Calendar size={20} className="text-purple-400" />
              </div>
              <div className="flex-1">
                <p className="text-sm text-gray-400 mb-1">Member Since</p>
                <p className="text-base md:text-lg text-white font-medium">
                  {profile?.createdAt ? formatDate(profile.createdAt) : 'N/A'}
                </p>
              </div>
            </div>

            {/* Status Badges */}
            <div className="pt-4 border-t border-purple-500/30">
              <p className="text-sm text-gray-400 mb-3">Account Status</p>
              <div className="flex flex-wrap gap-3">
                {/* Verification Status */}
                <div className={`flex items-center gap-2 px-4 py-2 rounded-lg border ${
                  profile?.isVerified 
                    ? 'bg-green-500/10 border-green-500/50 text-green-300' 
                    : 'bg-yellow-500/10 border-yellow-500/50 text-yellow-300'
                }`}>
                  {profile?.isVerified ? (
                    <CheckCircle size={18} />
                  ) : (
                    <XCircle size={18} />
                  )}
                  <span className="text-sm font-medium">
                    {profile?.isVerified ? 'Verified' : 'Pending Verification'}
                  </span>
                </div>

                {/* Active Status */}
                <div className={`flex items-center gap-2 px-4 py-2 rounded-lg border ${
                  profile?.isActive 
                    ? 'bg-green-500/10 border-green-500/50 text-green-300' 
                    : 'bg-red-500/10 border-red-500/50 text-red-300'
                }`}>
                  {profile?.isActive ? (
                    <CheckCircle size={18} />
                  ) : (
                    <XCircle size={18} />
                  )}
                  <span className="text-sm font-medium">
                    {profile?.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </div>
            </div>

            {/* Info Message */}
            {!profile?.isVerified && (
              <div className="bg-yellow-500/10 border border-yellow-500/50 rounded-lg p-4">
                <p className="text-sm text-yellow-300">
                  ⚠️ Your account is pending verification by an administrator. 
                  You may have limited access until your account is verified.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Profile;
