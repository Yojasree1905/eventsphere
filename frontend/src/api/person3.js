import api from './axios'

// ── Feedbacks & Reviews ──────────────────────────────────────────────────────
export const getEventFeedbackStats = (eventId) =>
  api.get(`/feedbacks/event/${eventId}`).then((r) => r.data)

export const submitFeedback = (payload) =>
  api.post('/feedbacks', payload).then((r) => r.data)

// ── Scoring & Evaluations ────────────────────────────────────────────────────
export const submitEvaluationScore = (payload) =>
  api.post('/scores/evaluate', payload).then((r) => r.data)

export const recomputeLeaderboard = (eventId) =>
  api.post(`/scores/recompute/${eventId}`).then((r) => r.data)

export const getEventLeaderboard = (eventId) =>
  api.get(`/scores/leaderboard/${eventId}`).then((r) => r.data)

// ── Certificates & QR Verification ──────────────────────────────────────────
export const listCertificates = (params = {}) =>
  api.get('/certificates', { params }).then((r) => r.data)

export const getCertificateRegistry = (params = {}) =>
  api.get('/certificates/registry', { params }).then((r) => r.data)

export const generateCertificates = (payload) =>
  api.post('/certificates/generate', payload).then((r) => r.data)

export const verifyCertificatePublic = (certificateId) =>
  api.get(`/certificates/verify/${certificateId}`).then((r) => r.data)

export const getParticipantCertificates = (participantId) =>
  api.get(`/certificates/participant/${participantId}`).then((r) => r.data)

export const getCertificateDownloadUrl = (certificateId) =>
  `/api/certificates/download/${certificateId}`
