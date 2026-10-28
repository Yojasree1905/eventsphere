import api from './axios'

export const getStats = () => api.get('/monitoring/stats')
export const getRecentActivity = (limit = 10) =>
  api.get('/monitoring/recent-activity', { params: { limit } })
