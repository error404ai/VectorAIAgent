// Global configuration for the application

const Global = {
  // API base URL - points to Vector-Brain backend
  BASE_API_PATH: import.meta.env.VITE_API_URL || "http://localhost:3000/api",
};

export default Global;
