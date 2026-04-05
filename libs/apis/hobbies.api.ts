import { getRequest, postRequest } from '@/utils/helpers/common/http-methods';
import { HobbyDTO, ApiResponseDTO } from '@/utils/helpers/models/auth.dto';

export const HOBBIES_APIS = {
  getHobbies: (): Promise<ApiResponseDTO<{ hobbies: HobbyDTO[] }>> => 
    getRequest('/hobbies'),

  addHobby: (name: string): Promise<ApiResponseDTO<HobbyDTO>> => 
    postRequest('/hobbies', { name })
};

export default HOBBIES_APIS;
