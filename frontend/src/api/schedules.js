import api from './axios'

export const getSchedules = (eventId) => api.get('/schedules', { params: { event_id: eventId } })
export const createSchedule = (data) => api.post('/schedules', data)
export const updateSchedule = (id, data) => api.put(`/schedules/${id}`, data)
export const deleteSchedule = (id) => api.delete(`/schedules/${id}`)
export const completeSchedule = (id) => api.patch(`/schedules/${id}/complete`)
export const expireSchedule = (id) => api.patch(`/schedules/${id}/expire`)
export const cancelSchedule = (id) => api.patch(`/schedules/${id}/cancel`)
