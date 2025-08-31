// Comprehensive error handling utility for Tradie Helper

interface SupabaseError {
  code: string;
  message: string;
  details?: string;
  hint?: string;
}

interface StripeError {
  type: string;
  code?: string;
  message: string;
  decline_code?: string;
}

interface HTTPError {
  status?: number;
  statusCode?: number;
  message?: string;
  name?: string;
}

interface ErrorWithMessage {
  message: string;
}

type UnknownError = unknown;

export interface AppError {
  code: string;
  message: string;
  details?: unknown;
  statusCode?: number;
  userMessage: string;
}

export class AppErrorHandler {
  // Error codes for different types of errors
  static readonly ERROR_CODES = {
    // Authentication errors
    AUTH_INVALID_CREDENTIALS: 'AUTH_INVALID_CREDENTIALS',
    AUTH_TOKEN_EXPIRED: 'AUTH_TOKEN_EXPIRED',
    AUTH_UNAUTHORIZED: 'AUTH_UNAUTHORIZED',
    AUTH_EMAIL_NOT_CONFIRMED: 'AUTH_EMAIL_NOT_CONFIRMED',
    
    // Database errors
    DB_CONNECTION_ERROR: 'DB_CONNECTION_ERROR',
    DB_QUERY_ERROR: 'DB_QUERY_ERROR',
    DB_CONSTRAINT_VIOLATION: 'DB_CONSTRAINT_VIOLATION',
    
    // API errors
    API_NETWORK_ERROR: 'API_NETWORK_ERROR',
    API_TIMEOUT: 'API_TIMEOUT',
    API_RATE_LIMIT: 'API_RATE_LIMIT',
    API_BAD_REQUEST: 'API_BAD_REQUEST',
    API_SERVER_ERROR: 'API_SERVER_ERROR',
    
    // Stripe/Payment errors
    STRIPE_CARD_DECLINED: 'STRIPE_CARD_DECLINED',
    STRIPE_INSUFFICIENT_FUNDS: 'STRIPE_INSUFFICIENT_FUNDS',
    STRIPE_INVALID_CARD: 'STRIPE_INVALID_CARD',
    STRIPE_CONNECTION_ERROR: 'STRIPE_CONNECTION_ERROR',
    STRIPE_WEBHOOK_ERROR: 'STRIPE_WEBHOOK_ERROR',
    
    // File upload errors
    FILE_TOO_LARGE: 'FILE_TOO_LARGE',
    FILE_INVALID_TYPE: 'FILE_INVALID_TYPE',
    FILE_UPLOAD_FAILED: 'FILE_UPLOAD_FAILED',
    FILE_STORAGE_ERROR: 'FILE_STORAGE_ERROR',
    
    // Validation errors
    VALIDATION_REQUIRED_FIELD: 'VALIDATION_REQUIRED_FIELD',
    VALIDATION_INVALID_EMAIL: 'VALIDATION_INVALID_EMAIL',
    VALIDATION_INVALID_PHONE: 'VALIDATION_INVALID_PHONE',
    VALIDATION_PASSWORD_WEAK: 'VALIDATION_PASSWORD_WEAK',
    
    // Business logic errors
    JOB_ALREADY_ASSIGNED: 'JOB_ALREADY_ASSIGNED',
    JOB_NOT_AVAILABLE: 'JOB_NOT_AVAILABLE',
    APPLICATION_ALREADY_EXISTS: 'APPLICATION_ALREADY_EXISTS',
    INSUFFICIENT_PERMISSIONS: 'INSUFFICIENT_PERMISSIONS',
    PROFILE_INCOMPLETE: 'PROFILE_INCOMPLETE',
    VERIFICATION_REQUIRED: 'VERIFICATION_REQUIRED',
    
    // Generic errors
    UNKNOWN_ERROR: 'UNKNOWN_ERROR',
  } as const;

  // User-friendly error messages
  static readonly ERROR_MESSAGES: Record<string, string> = {
    [AppErrorHandler.ERROR_CODES.AUTH_INVALID_CREDENTIALS]: 
      'Invalid email or password. Please check your credentials.',
    [AppErrorHandler.ERROR_CODES.AUTH_TOKEN_EXPIRED]: 
      'Your session has expired. Please log in again.',
    [AppErrorHandler.ERROR_CODES.AUTH_UNAUTHORIZED]: 
      'You do not have permission to access this resource.',
    [AppErrorHandler.ERROR_CODES.AUTH_EMAIL_NOT_CONFIRMED]: 
      'Please confirm your email address to continue.',
    
    [AppErrorHandler.ERROR_CODES.DB_CONNECTION_ERROR]: 
      'Unable to connect to our servers. Please try again later.',
    [AppErrorHandler.ERROR_CODES.DB_QUERY_ERROR]: 
      'There was an error processing your request. Please try again.',
    
    [AppErrorHandler.ERROR_CODES.API_NETWORK_ERROR]: 
      'Network error. Please check your internet connection.',
    [AppErrorHandler.ERROR_CODES.API_TIMEOUT]: 
      'Request timed out. Please try again.',
    [AppErrorHandler.ERROR_CODES.API_RATE_LIMIT]: 
      'Too many requests. Please wait a moment before trying again.',
    
    [AppErrorHandler.ERROR_CODES.STRIPE_CARD_DECLINED]: 
      'Your payment was declined. Please check your card details.',
    [AppErrorHandler.ERROR_CODES.STRIPE_INSUFFICIENT_FUNDS]: 
      'Insufficient funds. Please use a different payment method.',
    [AppErrorHandler.ERROR_CODES.STRIPE_INVALID_CARD]: 
      'Invalid card details. Please check your card information.',
    
    [AppErrorHandler.ERROR_CODES.FILE_TOO_LARGE]: 
      'File is too large. Maximum size is 10MB.',
    [AppErrorHandler.ERROR_CODES.FILE_INVALID_TYPE]: 
      'Invalid file type. Only images and PDFs are allowed.',
    [AppErrorHandler.ERROR_CODES.FILE_UPLOAD_FAILED]: 
      'File upload failed. Please try again.',
    
    [AppErrorHandler.ERROR_CODES.JOB_ALREADY_ASSIGNED]: 
      'This job has already been assigned to another helper.',
    [AppErrorHandler.ERROR_CODES.APPLICATION_ALREADY_EXISTS]: 
      'You have already applied for this job.',
    [AppErrorHandler.ERROR_CODES.PROFILE_INCOMPLETE]: 
      'Please complete your profile before continuing.',
    [AppErrorHandler.ERROR_CODES.VERIFICATION_REQUIRED]: 
      'Account verification is required to access this feature.',
    
    [AppErrorHandler.ERROR_CODES.UNKNOWN_ERROR]: 
      'An unexpected error occurred. Please try again.',
  };

  // Parse and handle different types of errors
  static handleError(error: UnknownError): AppError {
    console.error('Error occurred:', error);

    // Type guard for objects with properties
    const errorObj = error as Record<string, unknown>;

    // Supabase errors
    if (errorObj?.code && typeof errorObj.code === 'string' && typeof errorObj.message === 'string') {
      return this.handleSupabaseError(errorObj as unknown as SupabaseError);
    }

    // Stripe errors
    if (errorObj?.type && typeof errorObj.type === 'string' && errorObj.type.includes('Stripe') && typeof errorObj.message === 'string') {
      return this.handleStripeError(errorObj as unknown as StripeError);
    }

    // Network/Fetch errors
    if (errorObj?.name === 'TypeError' && typeof errorObj.message === 'string' && errorObj.message.includes('fetch')) {
      return {
        code: this.ERROR_CODES.API_NETWORK_ERROR,
        message: errorObj.message,
        userMessage: this.ERROR_MESSAGES[this.ERROR_CODES.API_NETWORK_ERROR],
        statusCode: 0,
      };
    }

    // HTTP errors
    if ((typeof errorObj?.status === 'number') || (typeof errorObj?.statusCode === 'number')) {
      return this.handleHTTPError(errorObj as HTTPError);
    }

    // File upload errors
    if (typeof errorObj?.message === 'string' && (errorObj.message.includes('file') || errorObj.message.includes('upload'))) {
      return this.handleFileError(errorObj as unknown as ErrorWithMessage);
    }

    // Generic error
    return {
      code: this.ERROR_CODES.UNKNOWN_ERROR,
      message: (typeof errorObj?.message === 'string') ? errorObj.message : 'Unknown error occurred',
      userMessage: this.ERROR_MESSAGES[this.ERROR_CODES.UNKNOWN_ERROR],
      details: error,
    };
  }

  private static handleSupabaseError(error: SupabaseError): AppError {
    const code = error.code;
    
    switch (code) {
      case 'invalid_credentials':
        return {
          code: this.ERROR_CODES.AUTH_INVALID_CREDENTIALS,
          message: error.message,
          userMessage: this.ERROR_MESSAGES[this.ERROR_CODES.AUTH_INVALID_CREDENTIALS],
        };
      
      case 'email_not_confirmed':
        return {
          code: this.ERROR_CODES.AUTH_EMAIL_NOT_CONFIRMED,
          message: error.message,
          userMessage: this.ERROR_MESSAGES[this.ERROR_CODES.AUTH_EMAIL_NOT_CONFIRMED],
        };
      
      case '23505': // PostgreSQL unique violation
        return {
          code: this.ERROR_CODES.DB_CONSTRAINT_VIOLATION,
          message: error.message,
          userMessage: 'This record already exists.',
        };
      
      default:
        return {
          code: this.ERROR_CODES.DB_QUERY_ERROR,
          message: error.message,
          userMessage: this.ERROR_MESSAGES[this.ERROR_CODES.DB_QUERY_ERROR],
        };
    }
  }

  private static handleStripeError(error: StripeError): AppError {
    switch (error.code) {
      case 'card_declined':
        return {
          code: this.ERROR_CODES.STRIPE_CARD_DECLINED,
          message: error.message,
          userMessage: this.ERROR_MESSAGES[this.ERROR_CODES.STRIPE_CARD_DECLINED],
        };
      
      case 'insufficient_funds':
        return {
          code: this.ERROR_CODES.STRIPE_INSUFFICIENT_FUNDS,
          message: error.message,
          userMessage: this.ERROR_MESSAGES[this.ERROR_CODES.STRIPE_INSUFFICIENT_FUNDS],
        };
      
      case 'invalid_number':
      case 'invalid_expiry_month':
      case 'invalid_expiry_year':
      case 'invalid_cvc':
        return {
          code: this.ERROR_CODES.STRIPE_INVALID_CARD,
          message: error.message,
          userMessage: this.ERROR_MESSAGES[this.ERROR_CODES.STRIPE_INVALID_CARD],
        };
      
      default:
        return {
          code: this.ERROR_CODES.STRIPE_CONNECTION_ERROR,
          message: error.message,
          userMessage: 'Payment processing error. Please try again.',
        };
    }
  }

  private static handleHTTPError(error: HTTPError): AppError {
    const status = error.status || error.statusCode;
    
    switch (status) {
      case 400:
        return {
          code: this.ERROR_CODES.API_BAD_REQUEST,
          message: error.message || 'Bad request',
          userMessage: 'Invalid request. Please check your input.',
          statusCode: status,
        };
      
      case 401:
        return {
          code: this.ERROR_CODES.AUTH_UNAUTHORIZED,
          message: error.message || 'Unauthorized',
          userMessage: this.ERROR_MESSAGES[this.ERROR_CODES.AUTH_UNAUTHORIZED],
          statusCode: status,
        };
      
      case 429:
        return {
          code: this.ERROR_CODES.API_RATE_LIMIT,
          message: error.message || 'Rate limit exceeded',
          userMessage: this.ERROR_MESSAGES[this.ERROR_CODES.API_RATE_LIMIT],
          statusCode: status,
        };
      
      case 500:
      case 502:
      case 503:
      case 504:
        return {
          code: this.ERROR_CODES.API_SERVER_ERROR,
          message: error.message || 'Server error',
          userMessage: 'Server error. Please try again later.',
          statusCode: status,
        };
      
      default:
        return {
          code: this.ERROR_CODES.UNKNOWN_ERROR,
          message: error.message || 'HTTP error',
          userMessage: this.ERROR_MESSAGES[this.ERROR_CODES.UNKNOWN_ERROR],
          statusCode: status,
        };
    }
  }

  private static handleFileError(error: ErrorWithMessage): AppError {
    const message = error.message.toLowerCase();
    
    if (message.includes('size') || message.includes('large')) {
      return {
        code: this.ERROR_CODES.FILE_TOO_LARGE,
        message: error.message,
        userMessage: this.ERROR_MESSAGES[this.ERROR_CODES.FILE_TOO_LARGE],
      };
    }
    
    if (message.includes('type') || message.includes('format')) {
      return {
        code: this.ERROR_CODES.FILE_INVALID_TYPE,
        message: error.message,
        userMessage: this.ERROR_MESSAGES[this.ERROR_CODES.FILE_INVALID_TYPE],
      };
    }
    
    return {
      code: this.ERROR_CODES.FILE_UPLOAD_FAILED,
      message: error.message,
      userMessage: this.ERROR_MESSAGES[this.ERROR_CODES.FILE_UPLOAD_FAILED],
    };
  }

  // Log error to external service (like Sentry)
  static logError(error: AppError, context?: unknown): void {
    // In production, this would send to an error tracking service
    if (process.env.NODE_ENV === 'production') {
      // Send to error tracking service
      console.error('Production error:', {
        code: error.code,
        message: error.message,
        context,
        timestamp: new Date().toISOString(),
      });
    } else {
      console.error('Development error:', error, context);
    }
  }

  // Check if error should retry
  static shouldRetry(error: AppError): boolean {
    const retryableCodes = [
      this.ERROR_CODES.API_NETWORK_ERROR,
      this.ERROR_CODES.API_TIMEOUT,
      this.ERROR_CODES.DB_CONNECTION_ERROR,
      this.ERROR_CODES.API_SERVER_ERROR,
    ] as const;
    
    return retryableCodes.includes(error.code as typeof retryableCodes[number]);
  }

  // Get user-friendly message
  static getUserMessage(error: UnknownError): string {
    const appError = this.handleError(error);
    return appError.userMessage;
  }
}

// Hook for error handling in React components
export const useErrorHandler = () => {
  const handleError = (error: UnknownError, context?: unknown) => {
    const appError = AppErrorHandler.handleError(error);
    AppErrorHandler.logError(appError, context);
    return appError;
  };

  const getUserMessage = (error: UnknownError) => {
    return AppErrorHandler.getUserMessage(error);
  };

  const shouldRetry = (error: UnknownError) => {
    const appError = AppErrorHandler.handleError(error);
    return AppErrorHandler.shouldRetry(appError);
  };

  return {
    handleError,
    getUserMessage,
    shouldRetry,
  };
};