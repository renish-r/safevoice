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
};

export const authService = {
  register: (data) => {
    return apiClient.post('/api/auth/register', data);
  },

  login: (email, password) => {
    return apiClient.post('/api/auth/login', { email, password });
  },

  logout: () => {
    localStorage.removeItem('accessToken');
  },
};

export const officialService = {
  uploadResolution: (problemId, imageFile) => {
    const formData = new FormData();
    formData.append('problemId', problemId);
    formData.append('resolvedImageFile', imageFile);

    return apiClient.post('/api/official/resolutions', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
};
