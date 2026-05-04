import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  headers: {
    "Content-Type": "application/json"
  }
});

// 🔐 Auth APIs
export const authAPI = {
  login: (data) => api.post("/api/auth/login", data),
  register: (data) => api.post("/api/auth/register", data),
};

// 🚦 Traffic APIs
export const trafficAPI = {
  predict: (location) =>
    api.get(`/api/traffic/predict/${encodeURIComponent(location)}`),
  route: (data) => api.post("/api/traffic/route", data),
  add: (data) => api.post("/api/traffic/add", data),
  all: () => api.get("/api/traffic/all"),
};

export default api;