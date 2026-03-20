import axios from 'axios';

const BASE = `${process.env.REACT_APP_BACKEND_URL}/api`;

const getHeaders = () => {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

const auth = {
  login: (data) => axios.post(`${BASE}/auth/login`, data),
  me: () => axios.get(`${BASE}/auth/me`, { headers: getHeaders() }),
};

const events = {
  list: () => axios.get(`${BASE}/events`, { headers: getHeaders() }),
  create: (data) => axios.post(`${BASE}/events`, data, { headers: getHeaders() }),
  get: (id) => axios.get(`${BASE}/events/${id}`, { headers: getHeaders() }),
  update: (id, data) => axios.put(`${BASE}/events/${id}`, data, { headers: getHeaders() }),
  delete: (id) => axios.delete(`${BASE}/events/${id}`, { headers: getHeaders() }),
};

const guests = {
  list: (eventId) => axios.get(`${BASE}/events/${eventId}/guests`, { headers: getHeaders() }),
  add: (eventId, data) => axios.post(`${BASE}/events/${eventId}/guests`, data, { headers: getHeaders() }),
  update: (eventId, guestId, data) => axios.put(`${BASE}/events/${eventId}/guests/${guestId}`, data, { headers: getHeaders() }),
  delete: (eventId, guestId) => axios.delete(`${BASE}/events/${eventId}/guests/${guestId}`, { headers: getHeaders() }),
  importCsv: (eventId, file) => {
    const formData = new FormData();
    formData.append('file', file);
    return axios.post(`${BASE}/events/${eventId}/guests/import`, formData, {
      headers: { ...getHeaders(), 'Content-Type': 'multipart/form-data' },
    });
  },
};

const seating = {
  get: (eventId) => axios.get(`${BASE}/events/${eventId}/seating`, { headers: getHeaders() }),
  save: (eventId, data) => axios.put(`${BASE}/events/${eventId}/seating`, data, { headers: getHeaders() }),
};

const checkin = {
  toggle: (eventId, guestId) => axios.put(`${BASE}/events/${eventId}/guests/${guestId}/checkin`, {}, { headers: getHeaders() }),
  resetAll: (eventId) => axios.post(`${BASE}/events/${eventId}/guests/checkin-reset`, {}, { headers: getHeaders() }),
};

const menu = {
  list: (eventId) => axios.get(`${BASE}/events/${eventId}/menu`, { headers: getHeaders() }),
  add: (eventId, data) => axios.post(`${BASE}/events/${eventId}/menu`, data, { headers: getHeaders() }),
  update: (eventId, itemId, data) => axios.put(`${BASE}/events/${eventId}/menu/${itemId}`, data, { headers: getHeaders() }),
  delete: (eventId, itemId) => axios.delete(`${BASE}/events/${eventId}/menu/${itemId}`, { headers: getHeaders() }),
};

const emailSettings = {
  get: () => axios.get(`${BASE}/email-settings`, { headers: getHeaders() }),
  save: (data) => axios.post(`${BASE}/email-settings`, data, { headers: getHeaders() }),
  update: (data) => axios.put(`${BASE}/email-settings`, data, { headers: getHeaders() }),
  sendEmail: (eventId, data) => axios.post(`${BASE}/events/${eventId}/send-email`, data, { headers: getHeaders() }),
};

const vehicleModels = {
  list: (eventId) => axios.get(`${BASE}/events/${eventId}/vehicle-models`, { headers: getHeaders() }),
  add: (eventId, data) => axios.post(`${BASE}/events/${eventId}/vehicle-models`, data, { headers: getHeaders() }),
  delete: (eventId, modelId) => axios.delete(`${BASE}/events/${eventId}/vehicle-models/${modelId}`, { headers: getHeaders() }),
};

const testDrives = {
  list: (eventId) => axios.get(`${BASE}/events/${eventId}/test-drives`, { headers: getHeaders() }),
  add: (eventId, data) => axios.post(`${BASE}/events/${eventId}/test-drives`, data, { headers: getHeaders() }),
  delete: (eventId, driveId) => axios.delete(`${BASE}/events/${eventId}/test-drives/${driveId}`, { headers: getHeaders() }),
  updateStatus: (eventId, driveId, status) => axios.put(`${BASE}/events/${eventId}/test-drives/${driveId}/status?status=${status}`, {}, { headers: getHeaders() }),
};

const visitor = {
  events: {
    list: () => axios.get(`${BASE}/visitor/events`, { headers: getHeaders() }),
    get: (id) => axios.get(`${BASE}/visitor/events/${id}`, { headers: getHeaders() }),
  },
  guests: {
    list: (eventId) => axios.get(`${BASE}/visitor/events/${eventId}/guests`, { headers: getHeaders() }),
  },
  seating: {
    get: (eventId) => axios.get(`${BASE}/visitor/events/${eventId}/seating`, { headers: getHeaders() }),
  },
  menu: {
    get: (eventId) => axios.get(`${BASE}/visitor/events/${eventId}/menu`, { headers: getHeaders() }),
  },
};

const admin = {
  users: {
    list: () => axios.get(`${BASE}/admin/users`, { headers: getHeaders() }),
    create: (data) => axios.post(`${BASE}/admin/users`, data, { headers: getHeaders() }),
    delete: (id) => axios.delete(`${BASE}/admin/users/${id}`, { headers: getHeaders() }),
    updatePassword: (id, data) => axios.put(`${BASE}/admin/users/${id}/password`, data, { headers: getHeaders() }),
  }
};

export default { auth, events, guests, seating, checkin, menu, emailSettings, vehicleModels, testDrives, visitor, admin };
