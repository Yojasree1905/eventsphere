import api from './axios'

export const getParticipants = (params) => api.get('/participants', { params })
export const getParticipant = (id) => api.get(`/participants/${id}`)
export const createParticipant = (data) => api.post('/participants', data)
export const updateParticipant = (id, data) => api.put(`/participants/${id}`, data)
export const deleteParticipant = (id) => api.delete(`/participants/${id}`)

export const getRegistrations = (params) => api.get('/registrations', { params })
export const createRegistration = (data) => api.post('/registrations', data)
export const updateRegistration = (id, data) => api.put(`/registrations/${id}`, data)
export const deleteRegistration = (id) => api.delete(`/registrations/${id}`)
