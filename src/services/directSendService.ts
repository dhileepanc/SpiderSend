import axiosInstance from './axiosInstance';
import ENDPOINTS from './endPoints';

export interface DirectSendPayload {
  clientId: string | number;
  type: string;
  cgId: string | number;
  name: string;
  subject: string;
  content: string;
  mailCount: number;
  isScheduled?: 0 | 1;
  scheduledAt?: string; // "YYYY-MM-DD HH:MM:00"
  individualMails?: string;
}

export interface DirectSendResponse {
  status: boolean;
  message: string;
  data?: any;
}

export const directSendPost = async (payload: DirectSendPayload): Promise<DirectSendResponse> => {
  const formData = new FormData();
  formData.append('client_id', String(payload.clientId));
  formData.append('type', payload.type);
  console.log(payload.type);

  if(payload.type !="individual"){
  formData.append('cg_id', String(payload.cgId));
  }
  
  formData.append('name', payload.name);
  formData.append('subject', payload.subject);
  formData.append('content', payload.content);
  formData.append('mail_count', String(payload.mailCount));

  if (payload.isScheduled !== undefined) {
    formData.append('is_scheduled', String(payload.isScheduled));
  }
  if (payload.scheduledAt) {
    formData.append('scheduled_at', payload.scheduledAt);
  }
  if (payload.individualMails) {
    formData.append('individual_mails', payload.individualMails);
  }

  const response = await axiosInstance.post<DirectSendResponse>(
    ENDPOINTS.DIRECT_SEND.POST,
    formData,
    { headers: { 'Content-Type': 'multipart/form-data' } }
  );
  return response.data;
};
