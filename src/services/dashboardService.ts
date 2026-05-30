import axiosInstance from './axiosInstance';
import ENDPOINTS from './endPoints';

export interface DashboardData {
  sent_count: number;
  total_available_mail: number;
  total_purchased_mail: number;
  scan_count: string;
}

export interface DashboardResponse {
  status: boolean;
  message: string;
  data: DashboardData;
}

export const getDashboardData = async (clientId: string | number): Promise<DashboardResponse> => {
  const response = await axiosInstance.get<DashboardResponse>(ENDPOINTS.DASHBOARD.DATA, {
    params: { client_id: clientId },
  });
  return response.data;
};
