import { getRequest, patchRequest, deleteRequest } from '@/utils/helpers/common/http-methods';
import { ApiResponseDTO } from '@/utils/helpers/models/auth.dto';

export const NOTIFICATION_APIS = {
  getNotifications: (): Promise<ApiResponseDTO<any[]>> => 
    getRequest('/api/notifications'),

  markNotificationRead: (notificationId: string): Promise<ApiResponseDTO<any>> => 
    patchRequest(`/api/notifications/${notificationId}/read`),

  deleteNotification: (notificationId: string): Promise<ApiResponseDTO<any>> => 
    deleteRequest(`/api/notifications/${notificationId}`)
};

export default NOTIFICATION_APIS;
