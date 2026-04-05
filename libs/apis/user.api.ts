import { getRequest, patchRequest } from '@/utils/helpers/common/http-methods';
import { ApiResponseDTO } from '@/utils/helpers/models/auth.dto';

export const USER_APIS = {
  searchUsers: (query: string): Promise<ApiResponseDTO<any[]>> => 
    getRequest(`/api/users/search?q=${query}`),

  getUserProfile: (userId: string): Promise<ApiResponseDTO<any>> => 
    getRequest(`/api/users/${userId}/profile`),

  getHobbies: (): Promise<ApiResponseDTO<any[]>> => 
    getRequest('/api/hobbies'),

  getUserHobbies: (userId: string): Promise<ApiResponseDTO<any[]>> => 
    getRequest(`/api/users/${userId}/hobbies`),

  updateUserHobbies: (hobbies: string[]): Promise<ApiResponseDTO<any>> => 
    patchRequest('/api/users/hobbies', { hobbies })
};

export default USER_APIS;
