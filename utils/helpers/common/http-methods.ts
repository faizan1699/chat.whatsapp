import axios, { AxiosResponse } from 'axios';

const devOrigin: string = process.env.NODE_ENV === 'development' ? 'localhost:3000' : '';

const errorMessages = {
  somethingWentWrong: 'Something went wrong. Please try again.',
  sessionExpired: 'Your session has expired. Please login again.',
  networkError: 'Network error. Please check your connection.'
};

const warningMessages = {
  sessionExpired: 'Your session has expired. Please login again.'
};

interface ApiResponse<T = any> {
  status?: boolean;
  message?: string;
  response?: T;
  error?: string;
  metadata?: {
    message?: string;
  };
}

// Get authentication headers
const getHeaders = () => {
  const token = localStorage.getItem('access_token');
  const headers: any = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  if (devOrigin && !process.env.NODE_ENV?.includes('production') && window.location.hostname !== 'localhost') {
    headers.devOrigin = devOrigin;
  }

  return headers;
};

const errorHandler = (error: any): ApiResponse => {
  let message = '';

  if (error.response) {
    const res = error.response.data;

    if (error.response.status === 401) {
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      localStorage.removeItem('user_data');

      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }

      message = warningMessages.sessionExpired;
    } else {
      message = res?.message || res?.metadata?.message || errorMessages.somethingWentWrong;
    }
  } else if (error.request) {
    message = errorMessages.networkError;
  } else {
    message = errorMessages.somethingWentWrong;
  }

  return { error: message };
};

const successHandler = <T>(response: AxiosResponse<T>): ApiResponse<T> => {
  return {
    ...response.data,
    status: true
  };
};

export const postRequest = async <T = any>(url: string, data?: any, customHeaders?: any): Promise<ApiResponse<T>> => {
  try {
    const headers = { ...getHeaders(), ...customHeaders };
    const response = await axios.post<T>(url, data, { headers });
    return successHandler(response);
  } catch (error: any) {
    return errorHandler(error);
  }
};

export const getRequest = async <T = any>(url: string, customHeaders?: any): Promise<ApiResponse<T>> => {
  try {
    const headers = { ...getHeaders(), ...customHeaders };
    const response = await axios.get<T>(url, { headers });
    return successHandler(response);
  } catch (error: any) {
    return errorHandler(error);
  }
};

export const putRequest = async <T = any>(url: string, data?: any, customHeaders?: any): Promise<ApiResponse<T>> => {
  try {
    const headers = { ...getHeaders(), ...customHeaders };
    const response = await axios.put<T>(url, data, { headers });
    return successHandler(response);
  } catch (error: any) {
    return errorHandler(error);
  }
};

export const patchRequest = async <T = any>(url: string, data?: any, customHeaders?: any): Promise<ApiResponse<T>> => {
  try {
    const headers = { ...getHeaders(), ...customHeaders };
    const response = await axios.patch<T>(url, data, { headers });
    return successHandler(response);
  } catch (error: any) {
    return errorHandler(error);
  }
};

export const deleteRequest = async <T = any>(url: string, customHeaders?: any): Promise<ApiResponse<T>> => {
  try {
    const headers = { ...getHeaders(), ...customHeaders };
    const response = await axios.delete<T>(url, { headers });
    return successHandler(response);
  } catch (error: any) {
    return errorHandler(error);
  }
};

export const uploadRequest = async <T = any>(url: string, formData: FormData, customHeaders?: any): Promise<ApiResponse<T>> => {
  try {
    const headers = {
      ...getHeaders(),
      'Content-Type': 'multipart/form-data',
      ...customHeaders
    };
    delete headers['Content-Type'];
    const response = await axios.post<T>(url, formData, { headers });
    return successHandler(response);
  } catch (error: any) {
    return errorHandler(error);
  }
};

export { errorMessages, warningMessages };
export type { ApiResponse };
