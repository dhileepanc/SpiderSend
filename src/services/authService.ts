import { httpService } from './axiosInstance';
import ENDPOINTS from './endPoints';

// ─── Request types ─────────────────────────────────────────────────────────

export interface LoginRequest {
  /** Registered email address */
  email: string;
}

export interface OtpVerifyRequest {
  /** Same email used in the login step */
  email: string;
  /** 6-digit OTP received via email */
  otp: string;
}

// ─── Response types ─────────────────────────────────────────────────────────

export interface LoginResponse {
  /** Server status flag */
  status: boolean;
  message: string;
}

/** Shape of the client object returned by /otp-Verify */
export interface ClientData {
  id: number;
  company_name: string;
  name: string;
  email: string;
  mobile: string;
  address: string;
  country_id: number;
  notes: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  otp: string | null;
  google_id: string | null;
  country_name: string | null;
  trial_access_active: boolean;
  service_timezone: string;
}

export interface OtpVerifyResponse {
  /** Server status flag */
  status: boolean;
  message: string;
  data?: {
    client: ClientData;
  };
}

// ─── Service methods ────────────────────────────────────────────────────────

/**
 * Step 1 — Login
 * POST /login
 * Sends a one-time password to the provided email address.
 */
export const requestLoginOtp = async (
  payload: LoginRequest,
): Promise<LoginResponse> => {
  const response = await httpService.post<LoginResponse>(
    ENDPOINTS.AUTH.LOGIN,
    payload,
  );
  return response.data;
};

/**
 * Step 2 — OTP Verification
 * POST /otp-Verify
 * Validates the OTP and returns the authenticated client data on success.
 */
export const verifyLoginOtp = async (
  payload: OtpVerifyRequest,
): Promise<OtpVerifyResponse> => {
  const response = await httpService.post<OtpVerifyResponse>(
    ENDPOINTS.AUTH.OTP_VERIFY,
    payload,
  );
  return response.data;
};
