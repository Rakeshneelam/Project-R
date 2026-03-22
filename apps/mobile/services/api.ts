import axios from 'axios';
import { Platform } from 'react-native';
import { auth } from './firebaseConfig';

const BASE_URL = Platform.OS === 'web' ? 'http://localhost:3000/api' : 'http://10.0.2.2:3000/api';

export const api = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

// Attach Firebase ID Token on every request
api.interceptors.request.use(async (config) => {
  const user = auth.currentUser;
  if (user) {
    const token = await user.getIdToken();
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auth
export const authApi = {
  // Sync the newly created Firebase user to the PostgreSQL backend
  register: (data: { name: string; email: string; password?: string; dateOfBirth?: string }) =>
    api.post('/auth/signup', data), // Hits our backend route to initialize the profile
  me: () => api.get('/users/me'),
};

// Feed / Posts
export const postsApi = {
  getFeed: (page = 1) => api.get('/posts/feed', { params: { page, limit: 10 } }),
  getCommunityPosts: (communityId: string, page = 1) =>
    api.get(`/posts/community/${communityId}`, { params: { page, limit: 10 } }),
  createPost: (data: { content: string; communityId: string; mediaUrl?: string }) =>
    api.post('/posts', data),
  likePost: (postId: string) => api.post(`/posts/${postId}/like`),
  unlikePost: (postId: string) => api.delete(`/posts/${postId}/like`),
  getComments: (postId: string) => api.get(`/posts/${postId}/comments`),
  addComment: (postId: string, content: string) =>
    api.post(`/posts/${postId}/comments`, { content }),
};

// Communities
export const communitiesApi = {
  getAll: (search?: string) => api.get('/communities', { params: { search } }),
  getJoined: () => api.get('/communities/joined'),
  getById: (id: string) => api.get(`/communities/${id}`),
  join: (id: string) => api.post(`/communities/${id}/join`),
  leave: (id: string) => api.delete(`/communities/${id}/leave`),
};

// Challenges
export const challengesApi = {
  getActive: () => api.get('/challenges/active'),
  getAll: () => api.get('/challenges'),
  submit: (id: string, data: any) => api.post(`/challenges/${id}/submit`, data),
};

// Leaderboard
export const leaderboardApi = {
  getGlobal: () => api.get('/leaderboards/global'),
  getCommunity: (id: string) => api.get(`/leaderboards/community/${id}`),
};

// Profile
export const profileApi = {
  update: (data: any) => api.patch('/users/profile', data),
  getUploadUrl: (filename: string, contentType: string) =>
    api.get('/media/upload-url', { params: { filename, contentType } }),
};
