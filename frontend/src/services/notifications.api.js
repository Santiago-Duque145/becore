import { api } from '../lib/api.js';

export const listNotifications = (limit = 30) => api.get('/notifications', { params: { limit } });
export const getUnreadCount = () => api.get('/notifications/unread-count');
export const markNotificationRead = (id) => api.post(`/notifications/${id}/read`);
export const markAllNotificationsRead = () => api.post('/notifications/read-all');
