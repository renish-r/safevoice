import apiClient from './apiClient';

export const problemService = {
  createProblem: (formData) => {
    return apiClient.post('/api/problems', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },

  getProblems: (page = 0, size = 10) => {
    return apiClient.get(`/api/problems?page=${page}&size=${size}`);
  },

  getProblemById: (id) => {
    return apiClient.get(`/api/problems/${id}`);
  },

  updateProblemStatus: (id, status) => {
    return apiClient.put(`/api/problems/${id}/status`, { status });
  },

  getResolvedPosts: (page = 0, size = 10) => {
    return apiClient.get(`/api/problems/resolved?page=${page}&size=${size}`);
  },
};

export const authService = {
  register: (data) => {
    return apiClient.post('/api/auth/register', data);
  },

  login: (email, password) => {
    return apiClient.post('/api/auth/login', { email, password });
  },

  getCurrentUser: () => {
    return apiClient.get('/api/auth/me');
  },

  logout: () => {
    localStorage.removeItem('accessToken');
    window.dispatchEvent(new Event('auth-state-changed'));
  },
};

export const officialService = {
  uploadResolution: (problemId, imageFile, description, latitude, longitude) => {
    const formData = new FormData();
    formData.append('problemId', problemId);
    formData.append('resolvedImageFile', imageFile);
    formData.append('description', description);
    formData.append('latitude', latitude);
    formData.append('longitude', longitude);

    return apiClient.post('/api/official/resolutions', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
};
