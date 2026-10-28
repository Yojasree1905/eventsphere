import api from './axios'

export const getEvents = (params) => api.get('/events', { params })
export const getEventCount = () => api.get('/events/count')
export const getEvent = (id) => api.get(`/events/${id}`)
export const createEvent = (data) => api.post('/events', data)
export const updateEvent = (id, data) => api.put(`/events/${id}`, data)
export const deleteEvent = (id) => api.delete(`/events/${id}`)
export const submitEvent = (id) => api.patch(`/events/${id}/submit`)
export const approveEvent = (id) => api.patch(`/events/${id}/approve`)
export const rejectEvent = (id, reason) =>
  api.patch(`/events/${id}/reject`, { rejection_reason: reason })
