import { FC, Fragment } from "react";

interface FormErrorMessageProps {
    error: any;
    touched?: boolean | undefined;
    className?: string;
}

const ErrorMessage: FC<{ children: React.ReactNode; className?: string }> = ({ children, className }) => (
    <div className={`text-xs text-red-500 mt-1 flex items-center gap-1 ${className || ''}`}>
        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
        </svg>
        {children}
    </div>
);

const FormErrorMessage: FC<FormErrorMessageProps> = ({ error, touched, className }) => {
    if (touched === false) {
        return null;
    }

    return (
        <Fragment>
            {error?.type === "required" && (
                <ErrorMessage className={className}>This field is required</ErrorMessage>
            )}
            {error?.type === "min" && (
                <ErrorMessage className={className}>{error.message}</ErrorMessage>
            )}
            {error?.type === "max" && (
                <ErrorMessage className={className}>{error.message}</ErrorMessage>
            )}
            {error?.type === "minLength" && (
                <ErrorMessage className={className}>{error.message}</ErrorMessage>
            )}
            {error?.type === "maxLength" && (
                <ErrorMessage className={className}>{error.message}</ErrorMessage>
            )}
            {error?.type === "pattern" && (
                <ErrorMessage className={className}>{error.message}</ErrorMessage>
            )}
            {error?.type === "email" && (
                <ErrorMessage className={className}>Please enter a valid email address</ErrorMessage>
            )}
            {error?.type === "validate" && (
                <ErrorMessage className={className}>{error.message}</ErrorMessage>
            )}
            {error?.type === "hasSpecialChar" && (
                <ErrorMessage className={className}>{error.message}</ErrorMessage>
            )}
            {error?.type === "hasNumber" && (
                <ErrorMessage className={className}>{error.message}</ErrorMessage>
            )}
            {error?.type === "hasLowerCase" && (
                <ErrorMessage className={className}>{error.message}</ErrorMessage>
            )}
            {error?.type === "hasUpperCase" && (
                <ErrorMessage className={className}>{error.message}</ErrorMessage>
            )}
            {error?.type === "passwordMismatch" && (
                <ErrorMessage className={className}>Passwords do not match</ErrorMessage>
            )}
            {error?.type === "invalidCredentials" && (
                <ErrorMessage className={className}>Invalid credentials provided</ErrorMessage>
            )}
            {error?.type === "fileSize" && (
                <ErrorMessage className={className}>{error.message}</ErrorMessage>
            )}
            {error?.type === "fileType" && (
                <ErrorMessage className={className}>{error.message}</ErrorMessage>
            )}
            {error?.type === "networkError" && (
                <ErrorMessage className={className}>Network error. Please try again.</ErrorMessage>
            )}
            {error?.type === "serverError" && (
                <ErrorMessage className={className}>Server error. Please try again later.</ErrorMessage>
            )}
            {error?.type === "termsNotAccepted" && (
                <ErrorMessage className={className}>You must accept the terms and conditions</ErrorMessage>
            )}
            {error?.type === "usernameExists" && (
                <ErrorMessage className={className}>Username already exists</ErrorMessage>
            )}
            {error?.type === "emailExists" && (
                <ErrorMessage className={className}>Email already exists</ErrorMessage>
            )}
            {error?.type === "phoneExists" && (
                <ErrorMessage className={className}>Phone number already exists</ErrorMessage>
            )}
            {error?.type === "invalidCredentials" && (
                <ErrorMessage className={className}>Invalid email or password</ErrorMessage>
            )}
            {error?.type === "userNotFound" && (
                <ErrorMessage className={className}>User not found</ErrorMessage>
            )}
            {error?.type === "sessionExpired" && (
                <ErrorMessage className={className}>Your session has expired. Please login again.</ErrorMessage>
            )}
            {error?.type === "tokenInvalid" && (
                <ErrorMessage className={className}>Invalid or expired token</ErrorMessage>
            )}
            {error?.type === "accountLocked" && (
                <ErrorMessage className={className}>Account is temporarily locked</ErrorMessage>
            )}
            {error?.type === "emailNotVerified" && (
                <ErrorMessage className={className}>Please verify your email address</ErrorMessage>
            )}
            {error?.type === "weakPassword" && (
                <ErrorMessage className={className}>Password is too weak</ErrorMessage>
            )}
            {error?.type === "passwordMismatch" && (
                <ErrorMessage className={className}>Passwords do not match</ErrorMessage>
            )}
            {error?.type === "fileTooLarge" && (
                <ErrorMessage className={className}>File size is too large</ErrorMessage>
            )}
            {error?.type === "fileTypeNotSupported" && (
                <ErrorMessage className={className}>File type is not supported</ErrorMessage>
            )}
            {error?.type === "profileIncomplete" && (
                <ErrorMessage className={className}>Please complete your profile first</ErrorMessage>
            )}
            {error?.type === "consentRequired" && (
                <ErrorMessage className={className}>Cookie consent is required</ErrorMessage>
            )}
            {error?.type === "rateLimitExceeded" && (
                <ErrorMessage className={className}>Too many attempts. Please try again later.</ErrorMessage>
            )}
            {error?.type === "maintenance" && (
                <ErrorMessage className={className}>Service is under maintenance</ErrorMessage>
            )}
            {error?.type === "forbidden" && (
                <ErrorMessage className={className}>Access denied</ErrorMessage>
            )}
            {error?.type === "cnicExists" && (
                <ErrorMessage className={className}>CNIC already registered</ErrorMessage>
            )}
            {error?.type === "invalidEmail" && (
                <ErrorMessage className={className}>Please enter a valid email address</ErrorMessage>
            )}
            {error?.type === "invalidPhone" && (
                <ErrorMessage className={className}>Please enter a valid phone number</ErrorMessage>
            )}
            {error?.type === "invalidCnic" && (
                <ErrorMessage className={className}>Please enter a valid CNIC number</ErrorMessage>
            )}
            {error?.type === "invalidUsername" && (
                <ErrorMessage className={className}>Username can only contain letters, numbers, and underscores</ErrorMessage>
            )}
            {error?.type === "usernameTooShort" && (
                <ErrorMessage className={className}>Username must be at least 3 characters long</ErrorMessage>
            )}
            {error?.type === "usernameTooLong" && (
                <ErrorMessage className={className}>Username must be less than 20 characters</ErrorMessage>
            )}
            {error?.type === "passwordTooShort" && (
                <ErrorMessage className={className}>Password must be at least 8 characters</ErrorMessage>
            )}
            {error?.type === "passwordTooWeak" && (
                <ErrorMessage className={className}>Password must contain uppercase, lowercase, and numbers</ErrorMessage>
            )}
            {/* Generic error fallback */}
            {error?.message && ![
                'required', 'min', 'max', 'minLength', 'maxLength', 'pattern', 'email', 'validate', 
                'hasSpecialChar', 'hasNumber', 'hasLowerCase', 'hasUpperCase', 'passwordMismatch', 
                'invalidCredentials', 'fileSize', 'fileType', 'networkError', 'serverError',
                'termsNotAccepted', 'usernameExists', 'emailExists', 'phoneExists', 'userNotFound',
                'sessionExpired', 'tokenInvalid', 'accountLocked', 'emailNotVerified', 'weakPassword',
                'fileTooLarge', 'fileTypeNotSupported', 'profileIncomplete', 'consentRequired',
                'rateLimitExceeded', 'maintenance', 'forbidden', 'cnicExists', 'invalidEmail',
                'invalidPhone', 'invalidCnic', 'invalidUsername', 'usernameTooShort', 'usernameTooLong',
                'passwordTooShort', 'passwordTooWeak'
            ].includes(error.type) && (
                <ErrorMessage className={className}>{error.message}</ErrorMessage>
            )}
        </Fragment>
    );
};

export default FormErrorMessage;
