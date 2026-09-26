import axios from "axios";

/**
 * Central API client for the EduAI Spring Boot backend.
 * All modules must use this instance so credentials (JSESSIONID cookie)
 * are always sent and errors surface with consistent, human-readable messages.
 */
export const API_BASE_URL =
  process.env.REACT_APP_API_URL || "http://localhost:8080";

const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
});

/** Maps low-level failures to friendly, actionable messages. */
export function describeError(err, fallback = "Something went wrong. Please try again.") {
  if (!err) return fallback;
  if (err.response) {
    const data = err.response.data;
    if (typeof data === "string" && data.trim()) {
      // Legacy endpoints return plain strings
      try {
        const parsed = JSON.parse(data);
        if (parsed && parsed.error) return parsed.error;
      } catch (_) {
        /* not JSON */
      }
      return data.length < 300 ? data : fallback;
    }
    if (data && typeof data === "object") {
      if (data.error) return data.error;
      if (data.message) return data.message;
    }
    switch (err.response.status) {
      case 400: return "Invalid request. Please check the submitted details.";
      case 401: return "Your session has expired. Please log in again.";
      case 403: return "You do not have permission to perform this action.";
      case 404: return "The requested item was not found.";
      case 409: return "This action conflicts with the current state (e.g., already completed).";
      case 413: return "The file is too large.";
      default: break;
    }
    return `Request failed (HTTP ${err.response.status}).`;
  }
  if (err.code === "ERR_NETWORK") {
    return "Cannot reach the server. Is the backend running on port 8080?";
  }
  return err.message || fallback;
}

api.interceptors.response.use(
  (res) => res,
  (err) => Promise.reject(err)
);

export default api;
