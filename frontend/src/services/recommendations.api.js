import { api } from '../lib/api.js';

// IA4 · prueba A/B de "Para ti"
export const sendRecommendationClick = (eventId) => api.post('/recommendations/feedback', { eventId, action: 'clicked' });
export const getAiMetrics = () => api.get('/admin/ai-metrics');
