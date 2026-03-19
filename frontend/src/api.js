import axios from 'axios';

const BASE = `${process.env.REACT_APP_BACKEND_URL}/api`;

const getHeaders = () => {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

const auth = {
  register: (data) => axios.post(`${BASE}/auth/register`, data),
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

export default { auth, events, guests, seating };
