// Mock auth service for demonstration purposes
// In production, this would connect to Supabase

export interface SignupData {
  name: string;
  email: string;
  password: string;
  role: 'student' | 'aspirant';
}

export interface LoginData {
  email: string;
  password: string;
  rememberMe: boolean;
}

export interface VerifyEmailData {
  email: string;
  code: string;
}

export interface VerifyCollegeCredentialsData {
  collegeId: string;
  studentName: string;
  branch: string;
  year: number;
  rollNumber?: string;
  verificationPassword: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
  };
}

export const authService = {
  async signup(data: SignupData): Promise<ApiResponse> {
    // Mock implementation
    console.log('Signup attempt:', data);
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Mock success response
    return {
      success: true,
      data: {
        message: 'Verification email sent successfully'
      }
    };
  },

  async login(data: LoginData): Promise<ApiResponse> {
    // Mock implementation
    console.log('Login attempt:', data);
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Mock success response
    return {
      success: true,
      data: {
        user: {
          id: 'mock-user-id',
          email: data.email,
          role: 'student'
        },
        token: 'mock-jwt-token'
      }
    };
  },

  async verifyEmail(data: VerifyEmailData): Promise<ApiResponse> {
    // Mock implementation
    console.log('Email verification attempt:', data);
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Mock validation
    if (data.code === '123456') {
      return {
        success: true,
        data: {
          needsCollegeSelection: true
        }
      };
    } else {
      return {
        success: false,
        error: {
          code: 'INVALID_CODE',
          message: 'Invalid verification code'
        }
      };
    }
  },

  async resendVerificationCode(email: string): Promise<ApiResponse> {
    // Mock implementation
    console.log('Resend verification code for:', email);
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    return {
      success: true,
      data: {
        message: 'Verification code sent successfully'
      }
    };
  },

  async getColleges(): Promise<ApiResponse> {
    // Mock implementation
    console.log('Fetching colleges...');
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    return {
      success: true,
      data: [
        {
          id: 'mit',
          name: 'Massachusetts Institute of Technology',
          domain: 'mit.edu',
          country: 'United States',
          verification_type: 'automatic',
          provides_email: true
        },
        {
          id: 'stanford',
          name: 'Stanford University',
          domain: 'stanford.edu',
          country: 'United States',
          verification_type: 'automatic',
          provides_email: true
        },
        {
          id: 'iit-delhi',
          name: 'Indian Institute of Technology Delhi',
          domain: null,
          country: 'India',
          verification_type: 'database_only',
          provides_email: false
        },
        {
          id: 'oxford',
          name: 'University of Oxford',
          domain: 'ox.ac.uk',
          country: 'United Kingdom',
          verification_type: 'automatic',
          provides_email: true
        },
        {
          id: 'cambridge',
          name: 'University of Cambridge',
          domain: 'cam.ac.uk',
          country: 'United Kingdom',
          verification_type: 'automatic',
          provides_email: true
        }
      ]
    };
  },

  async verifyCollegeCredentials(data: VerifyCollegeCredentialsData): Promise<ApiResponse> {
    // Mock implementation
    console.log('College credentials verification attempt:', data);
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Mock validation
    if (data.verificationPassword === 'demo123') {
      return {
        success: true,
        data: {
          verified: true,
          studentId: 'mock-student-id',
          user: {
            id: 'mock-user-id',
            email: `${data.studentName}@college.edu`,
            role: 'student'
          },
          tokens: {
            access_token: 'mock-access-token',
            refresh_token: 'mock-refresh-token'
          }
        }
      };
    } else {
      return {
        success: false,
        error: {
          code: 'INVALID_PASSWORD',
          message: 'Invalid verification password'
        }
      };
    }
  },

  async refreshToken(data: { refresh_token: string }): Promise<ApiResponse> {
    // Mock implementation
    console.log('Token refresh attempt');
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    return {
      success: true,
      data: {
        tokens: {
          access_token: 'new-mock-access-token',
          refresh_token: 'new-mock-refresh-token'
        }
      }
    };
  },

  async initiateEmailVerification(data: { email: string }): Promise<ApiResponse> {
    // Mock implementation
    console.log('Initiate email verification for:', data.email);
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    return {
      success: true,
      data: {
        message: 'Verification email sent successfully'
      }
    };
  },

  async verifyEmailCode(data: { email: string; code: string }): Promise<ApiResponse> {
    // Mock implementation
    console.log('Verify email code:', data);
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    if (data.code === '123456') {
      return {
        success: true,
        data: {
          verified: true,
          needsCollegeSelection: true,
          user: {
            id: 'mock-user-id',
            email: data.email,
            name: 'Mock User',
            role: 'student',
            verification_status: 'verified',
            verification_method: 'email'
          },
          tokens: {
            access_token: 'mock-access-token',
            refresh_token: 'mock-refresh-token'
          }
        }
      };
    } else {
      return {
        success: false,
        error: {
          code: 'INVALID_CODE',
          message: 'Invalid verification code'
        }
      };
    }
  }
};

// Export EmailVerificationService for backward compatibility
export const EmailVerificationService = {
  async sendVerificationEmail(email: string): Promise<ApiResponse> {
    return authService.initiateEmailVerification({ email });
  },

  async verifyCode(email: string, code: string): Promise<ApiResponse> {
    return authService.verifyEmailCode({ email, code });
  },

  async resendCode(email: string): Promise<ApiResponse> {
    return authService.resendVerificationCode(email);
  },

  async canRequestNewCode(email: string): Promise<ApiResponse> {
    // Mock implementation
    console.log('Check rate limit for:', email);
    
    return {
      success: true,
      data: {
        canRequest: true,
        waitTime: 0
      }
    };
  },

  async getVerificationStatus(email: string): Promise<ApiResponse> {
    // Mock implementation
    console.log('Get verification status for:', email);
    
    return {
      success: true,
      data: {
        status: 'pending',
        hasActiveCode: true,
        isExpired: false,
        isLocked: false,
        attemptsRemaining: 3,
        expiresAt: new Date(Date.now() + 15 * 60 * 1000).toISOString()
      }
    };
  }
};