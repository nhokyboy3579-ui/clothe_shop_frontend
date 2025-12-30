import api from "./axios";

export const AuthService = {
  // Đăng ký
  register: async (formData) => {
    const response = await api.post("/register", formData);
    return response.data;
  },

  // Đăng nhập
  login: async (credentials) => {
    // credentials gồm { username, password }
    const response = await api.post("/login", credentials);
    return response.data;
  },

  sendOtp: async (email) => {
    return await api.post("/forgot-password/send-otp", { email });
  },

  verifyAndReset: async (data) => {
    return await api.post("/forgot-password/verify-reset", data);
  },
};
