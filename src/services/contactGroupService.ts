import axiosInstance from './axiosInstance';
import ENDPOINTS from './endPoints';

export interface ContactGroup {
  id: string | number;
  client_id: number;
  name: string;
  logo: string | null;
  created_at: string;
  updated_at: string;
  contacts_count: number;
}

export interface GetContactGroupListResponse {
  status: boolean;
  message: string;
  data: ContactGroup[];
}

export interface ContactGroupField {
  label: string;
  slug: string;
  type: string;
  required: 0 | 1;
}

export interface CreateContactGroupRequest {
  clientId: number;
  name: string;
  fields: ContactGroupField[];
  logo?: { uri: string; name: string; type: string } | null;
}

export interface CreateContactGroupResponse {
  status: boolean;
  message: string;
  data?: ContactGroup;
}

/**
 * Fetch the list of contact groups
 * @param clientId - the user's ID
 */
export const getContactGroupList = async (
  clientId: number
): Promise<GetContactGroupListResponse> => {
  try {
    const response = await axiosInstance.get(
      `${ENDPOINTS.CONTACT_GROUP.LIST}?client_id=${clientId}`
    );
    return response.data;
  } catch (error: any) {
    console.error('Error fetching contact groups list:', error);
    throw error;
  }
};

/**
 * Create a new contact group
 * Uses FormData so PHP-style array params (fields[0][label] etc.) are sent correctly.
 */
export const createContactGroup = async (
  payload: CreateContactGroupRequest
): Promise<CreateContactGroupResponse> => {
  try {
    const formData = new FormData();
    formData.append('client_id', String(payload.clientId));
    formData.append('name', payload.name);
    
    if (payload.logo) {
      formData.append('logo', payload.logo as any);
    }

    payload.fields.forEach((field, index) => {
      formData.append(`fields[${index}][label]`, field.label);
      formData.append(`fields[${index}][slug]`, field.slug);
      formData.append(`fields[${index}][type]`, field.type.toLowerCase());
      formData.append(`fields[${index}][required]`, String(field.required));
    });

    const response = await axiosInstance.post(
      ENDPOINTS.CONTACT_GROUP.STORE,
      formData,
      { headers: { 'Content-Type': 'multipart/form-data' } }
    );
    return response.data;
  } catch (error: any) {
    console.error('Error creating contact group:', error);
    throw error;
  }
};

export interface Contact {
  id: string | number;
  contact_group_id: number;
  client_id:number;
  name: string;
  email: string;
  address?: string;
  // backend might return other fields depending on custom fields
}

export interface GetContactListResponse {
  status: boolean;
  message: string;
  data: {
    group: ContactGroup;
    group_fields: ContactGroupField[];
    contacts: Contact[];
  };
}

export interface GetContactGroupDetailsResponse {
  status: boolean;
  message: string;
  data: {
    group: ContactGroup;
    fields: (ContactGroupField & { id: number | string })[];
  };
}

export interface UpdateContactGroupRequest {
  clientId: number;
  id: number | string;
  name: string;
  fields: (ContactGroupField & { id?: number | string })[];
  logo?: { uri: string; name: string; type: string } | null;
}

/**
 * Fetch contact group details for editing
 */
export const getContactGroupDetails = async (
  clientId: number,
  id: number | string
): Promise<GetContactGroupDetailsResponse> => {
  try {
    const response = await axiosInstance.get(
      `${ENDPOINTS.CONTACT_GROUP.EDIT}?client_id=${clientId}&id=${id}`
    );
    return response.data;
  } catch (error: any) {
    console.error('Error fetching contact group details:', error);
    throw error;
  }
};

/**
 * Update an existing contact group
 */
export const updateContactGroup = async (
  payload: UpdateContactGroupRequest
): Promise<CreateContactGroupResponse> => {
  try {
    const formData = new FormData();
    formData.append('client_id', String(payload.clientId));
    formData.append('id', String(payload.id));
    formData.append('name', payload.name);
    
    if (payload.logo) {
      formData.append('logo', payload.logo as any);
    }

    payload.fields.forEach((field, index) => {
      if (field.id) formData.append(`fields[${index}][id]`, String(field.id));
      formData.append(`fields[${index}][label]`, field.label);
      formData.append(`fields[${index}][slug]`, field.slug);
      formData.append(`fields[${index}][type]`, field.type.toLowerCase());
      formData.append(`fields[${index}][required]`, String(field.required));
    });

    const response = await axiosInstance.post(
      ENDPOINTS.CONTACT_GROUP.UPDATE,
      formData,
      { headers: { 'Content-Type': 'multipart/form-data' } }
    );
    return response.data;
  } catch (error: any) {
    console.error('Error updating contact group:', error);
    throw error;
  }
};

/**
 * Fetch the list of contacts in a group
 */
export const getContactList = async (
  clientId: number,
  groupId: number | string
): Promise<GetContactListResponse> => {
  try {
    const response = await axiosInstance.get(
      `${ENDPOINTS.CONTACT_GROUP.CONTACTS}?client_id=${clientId}&id=${groupId}`
    );
    return response.data;
  } catch (error: any) {
    console.error('Error fetching contact list:', error);
    throw error;
  }
};

export interface ContactAddViewResponse {
  status: boolean;
  message: string;
  data: {
    group: ContactGroup & { fields: (ContactGroupField & { id: number | string })[] };
    group_fields: (ContactGroupField & { id: number | string })[];
  };
}

/**
 * Fetch group fields for the Add Contact modal
 * GET contact-add-view?client_id=X&id=groupId
 */
export const getContactAddView = async (
  clientId: number,
  groupId: number | string
): Promise<ContactAddViewResponse> => {
  try {
    const response = await axiosInstance.get(
      `${ENDPOINTS.CONTACT_GROUP.CONTACT_ADD_VIEW}?client_id=${clientId}&id=${groupId}`
    );
    return response.data;
  } catch (error: any) {
    console.error('Error fetching contact add view:', error);
    throw error;
  }
};

export interface SaveContactRequest {
  clientId: number;
  groupId: number | string;  // always the group ID
  contactId?: number | string | null; // contact ID when editing, absent when creating
  name: string;
  email: string;
  meta: Record<string, string>;
}

/**
 * Create a new contact (contact-store)
 */
export const createContact = async (
  payload: SaveContactRequest
): Promise<{ status: boolean; message: string }> => {
  try {
    const formData = new FormData();
    formData.append('client_id', String(payload.clientId));
    formData.append('id', String(payload.groupId));
    formData.append('name', payload.name);
    formData.append('email', payload.email);
    Object.entries(payload.meta).forEach(([key, value]) => {
      formData.append(`meta[${key}]`, value);
    });
    const response = await axiosInstance.post(
      ENDPOINTS.CONTACT_GROUP.CONTACT_STORE,
      formData,
      { headers: { 'Content-Type': 'multipart/form-data' } }
    );
    return response.data;
  } catch (error: any) {
    console.error('Error creating contact:', error);
    throw error;
  }
};

/**
 * Update an existing contact (contact-update)
 */
export const updateContact = async (
  payload: SaveContactRequest
): Promise<{ status: boolean; message: string }> => {
  try {
    const formData = new FormData();
    formData.append('client_id', String(payload.clientId));
    formData.append('id', String(payload.contactId!));
    formData.append('name', payload.name);
    formData.append('email', payload.email);
    Object.entries(payload.meta).forEach(([key, value]) => {
      formData.append(`meta[${key}]`, value);
    });
    const response = await axiosInstance.post(
      ENDPOINTS.CONTACT_GROUP.CONTACT_UPDATE,
      formData,
      { headers: { 'Content-Type': 'multipart/form-data' } }
    );
    return response.data;
  } catch (error: any) {
    console.error('Error updating contact:', error);
    throw error;
  }
};

/**
 * @deprecated Use createContact / updateContact instead
 */
export const saveContact = async (
  payload: SaveContactRequest
): Promise<{ status: boolean; message: string }> => {
  return payload.contactId
    ? updateContact(payload)
    : createContact(payload);
};

/**
 * Get contact details for editing
 */
export const getContactDetails = async (
  clientId: number,
  contactId: number | string
): Promise<{ status: boolean; message: string; data: { contact: Contact & { meta: Record<string, string> | null }; group_fields: ContactGroupField[] } }> => {
  try {
    const response = await axiosInstance.get(
      `${ENDPOINTS.CONTACT_GROUP.CONTACT_EDIT}?client_id=${clientId}&id=${contactId}`
    );
    return response.data;
  } catch (error: any) {
    console.error('Error fetching contact details:', error);
    throw error;
  }
};

/**
 * Delete a contact
 */
export const deleteContact = async (
  clientId: number,
  contactId: number | string
): Promise<{ status: boolean; message: string }> => {
  try {
    const response = await axiosInstance.delete(
      `${ENDPOINTS.CONTACT_GROUP.CONTACT_DELETE}?client_id=${clientId}&id=${contactId}`
    );
    return response.data;
  } catch (error: any) {
    console.error('Error deleting contact:', error);
    throw error;
  }
};
