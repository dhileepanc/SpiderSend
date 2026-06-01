export { default as axiosInstance, httpService, setAuthTokenReference } from './axiosInstance';
export { default as ENDPOINTS } from './endPoints';
export type { EndpointsType } from './endPoints';

// Auth API service
export { requestLoginOtp, verifyLoginOtp } from './authService';
export type { LoginRequest, LoginResponse, OtpVerifyRequest, OtpVerifyResponse } from './authService';

// Dashboard API service
export { getDashboardData } from './dashboardService';
export type { DashboardData, DashboardResponse } from './dashboardService';

// Click2Connect API service
export { scanBusinessCard } from './click2ConnectService';
export type { ScanCardResponse } from './click2ConnectService';
