import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse, InternalAxiosRequestConfig } from 'axios';
import { DeviceEventEmitter } from 'react-native';
import { CONSTANTS } from '../utils/constants';


/**
 * Custom Axios Request Config extension
 * Allows specifying custom flags on a per-request basis (e.g. bypassing auth headers).
 */
interface CustomRequestConfig extends InternalAxiosRequestConfig {
  skipAuth?: boolean;
}

/**
 * Configure default Axios Instance
 */
// Build Basic Auth header using btoa() — built into React Native / Hermes
const _basicCredentials = `${CONSTANTS.API.BASIC_AUTH.USERNAME}:${CONSTANTS.API.BASIC_AUTH.PASSWORD}`;
const BASIC_AUTH_HEADER = `Basic ${btoa(_basicCredentials)}`;

// ─── API Logger ────────────────────────────────────────────────────────────
const logRequest = (config: InternalAxiosRequestConfig) => {
  const method = (config.method ?? 'UNKNOWN').toUpperCase();
  const fullUrl = `${config.baseURL ?? ''}${config.url ?? ''}`;
  console.log('\n┌─────────── 🚀 API REQUEST ───────────────────────');
  console.log(`│  Method  : ${method}`);
  console.log(`│  URL     : ${fullUrl}`);
  if (config.params && Object.keys(config.params).length > 0) {
    console.log('│  Params  :', JSON.stringify(config.params, null, 2));
  }
  if (config.data) {
    const body = typeof config.data === 'string' ? JSON.parse(config.data) : config.data;
    console.log('│  Body    :', JSON.stringify(body, null, 2));
  }
  // Print headers (mask auth value for security)
  const headers = { ...config.headers };
  if (headers.Authorization) {
    headers.Authorization = headers.Authorization.toString().startsWith('Basic')
      ? 'Basic ***'
      : 'Bearer ***';
  }
  console.log('│  Headers :', JSON.stringify(headers, null, 2));
  console.log('└──────────────────────────────────────────────────\n');
};

const logResponse = (response: AxiosResponse) => {
  const method = (response.config.method ?? 'UNKNOWN').toUpperCase();
  const fullUrl = `${response.config.baseURL ?? ''}${response.config.url ?? ''}`;
  console.log('\n┌─────────── ✅ API RESPONSE ──────────────────────');
  console.log(`│  Method  : ${method}`);
  console.log(`│  URL     : ${fullUrl}`);
  console.log(`│  Status  : ${response.status} ${response.statusText}`);
  console.log('│  Data    :', JSON.stringify(response.data, null, 2));
  console.log('└──────────────────────────────────────────────────\n');
};

const logError = (error: any) => {
  const config = error.config ?? {};
  const method = (config.method ?? 'UNKNOWN').toUpperCase();
  const fullUrl = `${config.baseURL ?? ''}${config.url ?? ''}`;
  console.log('\n┌─────────── ❌ API ERROR ─────────────────────────');
  console.log(`│  Method  : ${method}`);
  console.log(`│  URL     : ${fullUrl}`);
  if (error.response) {
    console.log(`│  Status  : ${error.response.status} ${error.response.statusText ?? ''}`);
    console.log('│  Error   :', JSON.stringify(error.response.data, null, 2));
  } else if (error.request) {
    console.log('│  Error   : No response received (network/timeout issue)');
  } else {
    console.log(`│  Error   : ${error.message}`);
  }
  console.log('└──────────────────────────────────────────────────\n');
};

const axiosInstance: AxiosInstance = axios.create({
  baseURL: CONSTANTS.API.BASE_URL,
  timeout: CONSTANTS.API.TIMEOUT,
  headers: {
    'Content-Type': CONSTANTS.API.HEADERS.JSON,
    Accept: CONSTANTS.API.HEADERS.JSON,
    // Basic Auth is required for every request to this staging API
    Authorization: BASIC_AUTH_HEADER,
  },
});

/**
 * In-memory token reference getter/setter placeholder
 * In a real application, retrieve these from Redux, Context, or AsyncStorage.
 */
let authToken: string | null = null;
let sessionToken: string | null = null;

export const setAuthTokenReference = (token: string | null) => {
  authToken = token;
};

export const setSessionTokenReference = (token: string | null) => {
  sessionToken = token;
};

/**
 * Request Interceptor
 * Injects Authorization Bearer Token into headers if session exists and request doesn't skip auth.
 */
axiosInstance.interceptors.request.use(
  async (config: CustomRequestConfig) => {
    // If request specifies skipAuth, return config directly
    if (config.skipAuth) {
      logRequest(config);
      return config;
    }

    // Attempt to inject token
    if (authToken) {
      config.headers.Authorization = `Bearer ${authToken}`;
    } else {
      // In production: Read asynchronously from SecureStore/AsyncStorage if not loaded in memory
      // const token = await AsyncStorage.getItem(CONSTANTS.STORAGE_KEYS.AUTH_TOKEN);
      // if (token) { config.headers.Authorization = `Bearer ${token}`; }
    }

    if (sessionToken) {
      config.headers['X-Session-Token'] = sessionToken;
    }

    logRequest(config);
    return config;
  },
  (error) => {
    logError(error);
    return Promise.reject(error);
  }
);

/**
 * Response Interceptor
 * Logs all responses and handles global failures (like expired tokens).
 */
axiosInstance.interceptors.response.use(
  (response: AxiosResponse) => {
    logResponse(response);
    return response;
  },
  async (error) => {
    logError(error);
    const originalRequest = error.config;

    const is401 = error.response && error.response.status === 401;
    const isInvalidToken =
      error.response &&
      error.response.data &&
      typeof error.response.data.message === 'string' &&
      error.response.data.message.toLowerCase() === 'invalid token.';

    // Handle 401 Unauthorized (Expired Tokens)
    if ((is401 || isInvalidToken) && !originalRequest._retry) {
      originalRequest._retry = true;
      DeviceEventEmitter.emit('SESSION_EXPIRED');

      try {
        // Placeholder refresh token logic:
        // const newAccessToken = await refreshUserToken();
        // setAuthTokenReference(newAccessToken);
        // originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        // return axiosInstance(originalRequest);
      } catch (refreshError) {
        // Refresh token failed -> trigger logout handler
        // triggerLogout();
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

/**
 * Standard Network Service API wrappers for simplified HTTP calls
 */
export const httpService = {
  get: <T = any>(url: string, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> => {
    return axiosInstance.get<T>(url, config);
  },

  post: <T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> => {
    return axiosInstance.post<T>(url, data, config);
  },

  put: <T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> => {
    return axiosInstance.put<T>(url, data, config);
  },

  delete: <T = any>(url: string, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> => {
    return axiosInstance.delete<T>(url, config);
  },

  patch: <T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> => {
    return axiosInstance.patch<T>(url, data, config);
  },
};

export default axiosInstance;
