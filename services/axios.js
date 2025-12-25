import axios from 'axios';

// 1. KHỞI TẠO INSTANCE (Đặt tên biến là 'api' để khớp với lệnh interceptors bên dưới)
const api = axios.create({
    // Đường dẫn Backend Laravel của bạn
    baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api', 
    headers: {
        'X-Requested-With': 'XMLHttpRequest',
        'Content-Type': 'application/json',
        'Accept': 'application/json',
    },
    // withCredentials: true, // Bỏ comment nếu dùng Sanctum cookie
});

// 2. TỰ ĐỘNG GỬI TOKEN (Interceptor)
api.interceptors.request.use((config) => {
    // Chỉ chạy ở phía Client (Trình duyệt)
    if (typeof window !== 'undefined') {
        const token = localStorage.getItem('token');
        if (token) {
            // Gắn Token vào Header: "Authorization: Bearer ..."
            config.headers.Authorization = `Bearer ${token}`;
        }
    }
    return config;
}, (error) => {
    return Promise.reject(error);
});

// 3. EXPORT
export default api;