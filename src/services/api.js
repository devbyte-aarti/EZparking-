import axios from 'axios';

const API_URL = '/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Response interceptor for debugging
api.interceptors.response.use(
  (response) => {
    console.log('API Success:', response.config.method?.toUpperCase(), response.config.url, response.status);
    return response;
  },
  (error) => {
    const errorDetails = {
      method: error.config?.method?.toUpperCase(),
      url: error.config?.url, 
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      message: error.message
    };
    console.error('🚨 API Error Details:', JSON.stringify(errorDetails, null, 2));
    return Promise.reject(error);
  }

);

// Add token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  console.log('API Request:', config.method?.toUpperCase(), config.url, 'Token:', token ? 'present' : 'missing');
  return config;
});

// Auth APIs
export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  forgotPassword: (data) => api.post('/auth/forgot-password', data),
  verifyOTP: (data) => api.post('/auth/verify-otp', data),
  resetPassword: (data) => api.post('/auth/reset-password', data)
};

// User APIs
export const userAPI = {
  getProfile: () => api.get('/user/profile'),
  updateProfile: (data) => api.put('/user/profile', data),
  getVehicles: () => api.get('/user/vehicles'),
  addVehicle: (data) => api.post('/user/vehicles', data),
  deleteVehicle: (id) => api.delete(`/user/vehicles/${id}`),
  getBookings: () => api.get('/user/bookings'),
  searchSlots: (params) => api.get('/user/slots/search', { params }),
  getWallet: () => api.get('/user/wallet'),
  addWallet: (data) => api.post('/user/wallet/add', data),
  getNotifications: () => api.get('/user/notifications'),
  markNotificationRead: (id) => api.put(`/user/notifications/${id}/read`)
};

// Slot APIs
export const slotAPI = {
  getAllSlots: () => api.get('/slot'),
  getAvailableSlots: (params) => api.get('/slot/available', { params }),
  getSlot: (id) => api.get(`/slot/${id}`),
  createSlot: (data) => api.post('/slot', data),
  updateSlot: (id, data) => api.put(`/slot/${id}`, data),
  deleteSlot: (id) => api.delete(`/slot/${id}`),
  getMySlots: () => api.get('/lotowner/slots')  // Use lotowner endpoint for consistency
};

// Booking APIs
export const bookingAPI = {
  getAllBookings: () => api.get('/booking'),
  getMyBookings: () => api.get('/booking/my-bookings'),
  getBooking: (id) => api.get(`/booking/${id}`),
  createBooking: (data) => api.post('/booking', data),
  cancelBooking: (id) => api.put(`/booking/${id}/cancel`),
  completeBooking: (id) => api.put(`/booking/${id}/complete`)
};

// Payment APIs
export const paymentAPI = {
  initiatePayment: (data) => api.post('/payment/initiate', data),
  processPayment: (data) => api.post('/payment/process', data),
  getPayment: (id) => api.get(`/payment/${id}`),
  getBookingPayment: (bookingId) => api.get(`/payment/booking/${bookingId}`),
  getAllPayments: () => api.get('/payment'),

};

// Parking Pass APIs
export const parkingpassAPI = {
  getPasses: () => api.get('/parkingpass'),
  getMyPasses: () => api.get('/parkingpass/my-passes'),
  getActivePass: () => api.get('/parkingpass/active'),
  createPass: (data) => api.post('/parkingpass/admin', data),
  updatePass: (id, data) => api.put(`/parkingpass/admin/${id}`, data),
  deletePass: (id) => api.delete(`/parkingpass/admin/${id}`)
};

// Receipt APIs
export const receiptAPI = {
  getMyReceipts: () => api.get('/receipt/my-receipts'),
  getReceipt: (id) => api.get(`/receipt/${id}`),
  getReceiptPDF: (id) => api.get(`/receipt/${id}/pdf`, { responseType: 'blob' }),
  downloadPDF: (type, receiptId) => api.get(`/user/download/${type}/${receiptId}`, { responseType: 'blob' }),
  checkIn: (id) => api.put(`/receipt/${id}/checkin`),
  getReceiptByBooking: (bookingId) => api.get(`/receipt/booking/${bookingId}`)
};

// Admin APIs
export const adminAPI = {
  getPendingOwners: () => api.get('/admin/pending-owners'),
  approveOwner: (id) => api.put(`/admin/approve-owner/${id}`),
  rejectOwner: (id) => api.put(`/admin/reject-owner/${id}`),
  getUsers: () => api.get('/admin/users'),
  blockUser: (id) => api.put(`/admin/block-user/${id}`),
  unblockUser: (id) => api.put(`/admin/unblock-user/${id}`),
  getStats: () => api.get('/admin/stats'),
  generateRevenueReport: () => api.post('/admin/report/revenue'),
  generateUsageReport: () => api.post('/admin/report/usage'),
  generateCustomReport: (filters) => api.post('/admin/report/custom', filters),
  getReports: () => api.get('/admin/reports'),
  getLotOwners: () => api.get('/admin/lotowners'),
  getAllSlots: () => api.get('/admin/slots'),
  getAllBookings: (params = {}) => api.get('/admin/bookings', { params }),
  getReports: (params = {}) => api.get('/admin/reports', { params }),
  downloadReportPDF: (id) => api.get(`/admin/report/${id}/pdf`, { responseType: 'blob' })
};

export const lotOwnerAPI = {
  getStats: () => api.get('/lotowner/stats'),
  getSlots: () => api.get('/lotowner/slots'),
  getActiveBookings: () => api.get('/lotowner/active-bookings'),
  getCancelledBookings: () => api.get('/lotowner/cancelled-bookings'),
  getReports: () => api.get('/lotowner/reports'),
  generateCustomReport: (data) => api.post('/lotowner/report/custom', data),
  cancelBooking: (id) => api.put(`/booking/${id}/cancel`),
  downloadReportPDF: (id) => api.get(`/lotowner/report/${id}/pdf`, { responseType: 'blob' }),
  getOwnerBookings: (params = {}) => api.get('/lotowner/bookings', { params }),
  getBookingsSummary: () => api.get('/lotowner/bookings-summary'),
  getReportData: (params) => api.get('/lotowner/reports/data', { params }),
  getBookings7Days: () => api.get('/lotowner/bookings-7days'),
  getEarnings: () => api.get('/lotowner/stats') // Reuse stats.totalEarnings
};





export default api;
