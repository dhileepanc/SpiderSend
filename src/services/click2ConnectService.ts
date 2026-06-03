import axiosInstance from './axiosInstance';
import ENDPOINTS from './endPoints';

export interface ScanCardResponse {
  status: boolean;
  message: string;
  data?: Record<string, any>;
}

export interface ClickTOVerifyResponse{
   status: boolean;
  message: string;
}



/**
 * Sends a business card image to the click-to-connect-scan API.
 * @param clientId  - The authenticated user's client_id
 * @param fileUri   - Local file URI from the image picker
 * @param fileName  - Original file name (e.g. "card.jpg")
 * @param mimeType  - MIME type (e.g. "image/jpeg")
 */
export const scanBusinessCard = async (
  clientId: string | number,
  fileUri: string,
  fileName: string,
  mimeType: string,
): Promise<ScanCardResponse> => {
  const formData = new FormData();
  formData.append('client_id', String(clientId));
  formData.append('file', {
    uri: fileUri,
    name: fileName,
    type: mimeType,
  } as any);

  const response = await axiosInstance.post<ScanCardResponse>(
    ENDPOINTS.CLICK2CONNECT.SCAN,
    formData,
    {
      headers: { 'Content-Type': 'multipart/form-data' },
    },
  );
  return response.data;
};

export const getClickToVerify = async (clientId: string | number): Promise<ClickTOVerifyResponse> => {
  const response = await axiosInstance.get<ClickTOVerifyResponse>(ENDPOINTS.CLICK2CONNECTVERIFY.VERIFY, {
    params: { client_id: clientId },
  });
  return response.data;
};

export const reScanBusinessCard = async (
  clientId: string | number,
  imagePath: string
): Promise<ScanCardResponse> => {
  const formData = new FormData();
  formData.append('client_id', String(clientId));
  formData.append('image', imagePath);

  const response = await axiosInstance.post<ScanCardResponse>(
    ENDPOINTS.CLICK2CONNECT.RE_SCAN,
    formData,
    {
      headers: { 'Content-Type': 'multipart/form-data' },
    },
  );
  return response.data;
};

export interface MailTemplate {
  id: number;
  client_id: number;
  name: string;
  subject: string;
  content: string;
  created_at: string;
  updated_at: string;
}

export interface MailTemplateListResponse {
  status: boolean;
  message: string;
  data: {
    templates: MailTemplate[];
  };
}

export const getMailTemplates = async (clientId: string | number): Promise<MailTemplateListResponse> => {
  const response = await axiosInstance.get<MailTemplateListResponse>(ENDPOINTS.MAIL_TEMPLATE.LIST, {
    params: { client_id: clientId },
  });
  return response.data;
};

export interface MailTemplateGenerateResponse {
  status: boolean;
  message: string;
  data?: any;
}

export const generateMailTemplate = async (
  clientId: string | number,
  prompt: string
): Promise<MailTemplateGenerateResponse> => {
  const formData = new FormData();
  formData.append('client_id', String(clientId));
  formData.append('prompt', prompt);

  const response = await axiosInstance.post<MailTemplateGenerateResponse>(
    ENDPOINTS.MAIL_TEMPLATE.GENERATE,
    formData,
    {
      headers: { 'Content-Type': 'multipart/form-data' },
    }
  );
  return response.data;
};

export interface ContactData {
  id: string; // internal id for UI rendering
  name: string;
  email: string;
  companyName: string;
  mobileNumber: string;
  address: string;
}

export interface StoreScanResponse {
  status: boolean;
  message: string;
  click_to_connect_id:number;
  data?: any;
}

export const storeScanData = async (
  clientId: string | number,
  templateId: string | number,
  contacts: ContactData[]
): Promise<StoreScanResponse> => {
  const formData = new FormData();
  formData.append('client_id', String(clientId));
  formData.append('id', String(templateId));
  formData.append('mail_count', String(contacts.length));

  contacts.forEach((contact, index) => {
    formData.append(`contacts[${index}][name]`, contact.name);
    formData.append(`contacts[${index}][email]`, contact.email);
    formData.append(`contacts[${index}][company_name]`, contact.companyName);
    formData.append(`contacts[${index}][mobile_number]`, contact.mobileNumber);
    formData.append(`contacts[${index}][address]`, contact.address);
  });

  const response = await axiosInstance.post<StoreScanResponse>(
    ENDPOINTS.CLICK2CONNECT.STORE,
    formData,
    {
      headers: { 'Content-Type': 'multipart/form-data' },
    }
  );
  return response.data;
};

export interface SendMailPayload {
  clientId: string | number;
  clickToConnectId: string | number;
  name: string;
  subject: string;
  content: string;
  mailCount: number;
  isScheduled?: 0 | 1;
  scheduledAt?: string;   // e.g. "2026-06-05 09:00:00"
  scheduledTimezone?: string; // e.g. "Asia/Kolkata"
}

export interface SendMailResponse {
  status: boolean;
  message: string;
  data?: any;
}

export const sendMailCampaign = async (payload: SendMailPayload): Promise<SendMailResponse> => {
  const formData = new FormData();
  formData.append('client_id', String(payload.clientId));
  formData.append('click_to_connect_id', String(payload.clickToConnectId));
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
  if (payload.scheduledTimezone) {
    formData.append('scheduled_timezone', payload.scheduledTimezone);
  }

  const response = await axiosInstance.post<SendMailResponse>(
    ENDPOINTS.CLICK2CONNECT.SEND_MAIL,
    formData,
    { headers: { 'Content-Type': 'multipart/form-data' } }
  );
  return response.data;
};

export interface PreviewResponse {
  status: boolean;
  message: string;
  data?: {
    name?: string;
    subject?: string;
    content?: string;
    [key: string]: any;
  };
}

export const getClickToConnectPreview = async (
  clientId: string | number,
  clickToConnectId: string | number
): Promise<PreviewResponse> => {
  const response = await axiosInstance.get<PreviewResponse>(ENDPOINTS.CLICK2CONNECT.PREVIEW, {
    params: { client_id: clientId, click_to_connect_id: clickToConnectId },
  });
  return response.data;
};