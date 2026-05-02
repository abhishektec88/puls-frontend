import axios from "axios";
import { apiBaseUrl } from "../config/runtime";

const api = axios.create({
  baseURL: apiBaseUrl()
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("accessToken");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true;
      const refreshToken = localStorage.getItem("refreshToken");
      if (refreshToken) {
        const { data } = await axios.post(`${apiBaseUrl()}/auth/refresh`, { refreshToken });
        localStorage.setItem("accessToken", data.accessToken);
        original.headers.Authorization = `Bearer ${data.accessToken}`;
        return api(original);
      }
    }
    return Promise.reject(error);
  }
);

export default api;
