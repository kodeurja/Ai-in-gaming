// Vite uses import.meta.env for environment variables
const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
const CONFIG = {
    API_BASE_URL: import.meta.env.VITE_BACKEND_URL || (isLocal ? "http://localhost:5000" : "")
};

export default CONFIG;
