// Authentication DTOs
export class LoginDTO {
  identifier: string = '';
  password: string = '';
  termsAccepted: boolean = false;
  cookieConsent?: any;

  constructor(data: any = {}) {
    Object.assign(this, data);
  }
}

export class RegisterDTO {
  username: string = '';
  email: string = '';
  password: string = '';
  phoneNumber?: string = '';
  termsAccepted: boolean = false;
  cookieConsent?: any;

  constructor(data: any = {}) {
    Object.assign(this, data);
  }
}

export class ForgotPasswordDTO {
  email: string = '';

  constructor(data: any = {}) {
    Object.assign(this, data);
  }
}

export class ResetPasswordDTO {
  token: string = '';
  newPassword: string = '';

  constructor(data: any = {}) {
    Object.assign(this, data);
  }
}

export class ChangePasswordDTO {
  currentPassword: string = '';
  newPassword: string = '';

  constructor(data: any = {}) {
    Object.assign(this, data);
  }
}

export class UserProfileDTO {
  id: string = '';
  username: string = '';
  email: string = '';
  phone?: string = '';
  avatar?: string = '';
  bio?: string = '';
  dateOfBirth?: string | null = null;
  fatherName?: string | null = null;
  address?: string | null = null;
  cnic?: string | null = null;
  gender?: string | null = null;
  hobbies?: Array<{
    id: string;
    name: string;
  }> = [];

  constructor(data: any = {}) {
    Object.assign(this, data);
  }
}

export class UpdateProfileDTO {
  username?: string = '';
  phone?: string = '';
  avatar?: string = '';
  bio?: string = '';
  dateOfBirth?: string | null = null;
  fatherName?: string | null = null;
  address?: string | null = null;
  cnic?: string | null = null;
  gender?: string | null = null;
  hobbies?: Array<{
    id: string;
    name: string;
  }> = [];

  constructor(data: any = {}) {
    Object.assign(this, data);
  }
}

export class LoginResponseDTO {
  message: string = '';
  accessToken: string = '';
  refreshToken: string = '';
  user: UserDTO = new UserDTO();

  constructor(data: any = {}) {
    Object.assign(this, data);
    if (data.user) {
      this.user = new UserDTO(data.user);
    }
  }
}

export class UserDTO {
  id: string = '';
  username: string = '';
  email: string = '';
  phone?: string = ''; 
  phoneNumber?: string = ''; 
  avatar?: string = '';

  constructor(data: any = {}) {
    Object.assign(this, data);
    if (data.phone && !data.phoneNumber) {
      this.phoneNumber = data.phone;
    }
    if (data.phoneNumber && !data.phone) {
      this.phone = data.phoneNumber;
    }
  }
}

export class UserSessionDTO {
  id: string = '';
  username: string = '';
  email: string = '';
  phoneNumber?: string = '';

  constructor(data: any = {}) {
    Object.assign(this, data);
  }
}

export class MessageDTO {
  id?: string = '';
  conversationId?: string = '';
  senderId?: string = '';
  content: string = '';
  to?: string = '';
  from?: string = '';
  replyTo?: string | null = null;
  file?: {
    url: string;
    filename: string;
    size: number;
    type: string;
    isImage: boolean;
    caption?: string;
  };
  isVoice?: boolean = false;
  audioUrl?: string = '';
  audioDuration?: number = 0;
  isRetry?: boolean = false;
  originalMessageId?: string | null = null;
  isPinned?: boolean = false;
  createdAt?: string = '';
  updatedAt?: string = '';

  constructor(data: any = {}) {
    Object.assign(this, data);
  }
}

export class ConversationDTO {
  id: string = '';
  participants: Array<{
    user: {
      id: string;
      username: string;
    };
  }> = [];
  createdAt?: string = '';
  updatedAt?: string = '';

  constructor(data: any = {}) {
    Object.assign(this, data);
  }
}

export class HobbyDTO {
  id: string = '';
  name: string = '';

  constructor(data: any = {}) {
    Object.assign(this, data);
  }
}

export class FileUploadDTO {
  file!: File;
  filename?: string;
  caption?: string;

  constructor(data: any = {}) {
    Object.assign(this, data);
  }
}

export class ApiResponseDTO<T = any> {
  message?: string = '';
  error?: string = '';
  [key: string]: any;

  constructor(data: any = {}) {
    Object.assign(this, data);
  }
}
