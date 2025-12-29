// Vite uses import.meta.env for environment variables
const CONFIG = {
    API_BASE_URL: import.meta.env.VITE_BACKEND_URL || "http://localhost:5000"
};

export default CONFIG;
