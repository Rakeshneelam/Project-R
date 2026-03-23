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

// Messages / Conversations
export const messagesApi = {
  getConversations: (page = 1) =>
    api.get('/messages/conversations', { params: { page, limit: 20 } }),
  getMessages: (conversationId: string, page = 1) =>
    api.get(`/messages/conversations/${conversationId}/messages`, { params: { page, limit: 50 } }),
  sendMessage: (conversationId: string, content: string, mediaUrls?: string[]) =>
    api.post(`/messages/conversations/${conversationId}/messages`, { content, mediaUrls }),
  startConversation: (otherUserId: string) =>
    api.post('/messages/conversations/direct', { otherUserId }),
};

// Dating
export const datingApi = {
  findMatch: () => api.post('/dating/find-match'),
  getActiveMatch: () => api.get('/dating/active'),
  respondToPrompt: (matchId: string, promptId: string, response: string) =>
    api.post(`/dating/${matchId}/prompts/${promptId}/respond`, { response }),
  approveCheckpoint: (matchId: string) =>
    api.post(`/dating/${matchId}/checkpoint/approve`),
  closeMatch: (matchId: string, reason?: string) =>
    api.post(`/dating/${matchId}/close`, { reason }),
  submitFeedback: (matchId: string, data: { rating: number; safetyRating?: number; feedback?: string }) =>
    api.post(`/dating/${matchId}/feedback`, data),
};

// Notifications
export const notificationsApi = {
  getAll: (page = 1) => api.get('/notifications', { params: { page } }),
  markRead: (id: string) => api.post(`/notifications/${id}/read`),
  markAllRead: () => api.post('/notifications/read-all'),
  registerPushToken: (token: string, platform: 'ios' | 'android' | 'web') =>
    api.post('/notifications/push-token', { token, platform }),
};
