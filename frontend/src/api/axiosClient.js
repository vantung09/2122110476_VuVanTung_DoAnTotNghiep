import axios from "axios";
import { API_BASE_URL } from "../config/appConfig";
import { clearStoredAuth, isAuthTokenExpired, notifyAuthExpired } from "../utils/authStorage";
import { clearAdminAuth, isAdminTokenExpired } from "../utils/adminAuthStorage";

const axiosClient = axios.create({
  baseURL: API_BASE_URL,
});

axiosClient.interceptors.request.use((config) => {
  const path = config.url || "";
  const isAdminRequest = path.startsWith("/admin");
  const adminToken = localStorage.getItem("admin_token");
  const userToken = localStorage.getItem("token");

  const adminExpired = adminToken && isAdminTokenExpired(adminToken);
  const userExpired = userToken && isAuthTokenExpired(userToken);

  if (adminExpired) {
    clearAdminAuth();
  }
  if (userExpired) {
    clearStoredAuth();
    notifyAuthExpired();
  }

  if (isAdminRequest && adminToken && !adminExpired) {
    config.headers.Authorization = `Bearer ${adminToken}`;
  } else if (!isAdminRequest && userToken && !userExpired) {
    config.headers.Authorization = `Bearer ${userToken}`;
  }

  return config;
});

axiosClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      const path = error.config?.url || "";
      if (path.startsWith("/admin")) {
        clearAdminAuth();
      } else {
        clearStoredAuth();
        notifyAuthExpired();
      }
    }
    return Promise.reject(error);
  }
);

export default axiosClient;
