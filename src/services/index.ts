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

// Contact Group API service
export {
  getContactGroupList,
  createContactGroup,
  getContactGroupDetails,
  updateContactGroup,
  getContactList,
  getContactAddView,
  createContact,
  updateContact,
  saveContact,
  getContactDetails,
  deleteContact,
} from './contactGroupService';
export type {
  ContactGroup,
  ContactGroupField,
  GetContactGroupListResponse,
  CreateContactGroupRequest,
  CreateContactGroupResponse,
  GetContactGroupDetailsResponse,
  UpdateContactGroupRequest,
  GetContactListResponse,
  ContactAddViewResponse,
  Contact,
  SaveContactRequest,
} from './contactGroupService';

// Direct Send API service
export * from './directSendService';
