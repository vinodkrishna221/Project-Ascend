import { authService, EmailVerificationService } from '../auth.service';
import type { SignupData, LoginData, VerifyEmailData, VerifyCollegeCredentialsData } from '../auth.service';

// Mock console.log to avoid noise in tests
const mockConsoleLog = jest.spyOn(console, 'log').mockImplementation(() => {});

describe('AuthService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterAll(() => {
    mockConsoleLog.mockRestore();
  });

  describe('signup', () => {
    it('should successfully signup a student', async () => {
      const signupData: SignupData = {
        name: 'John Doe',
        email: 'john@mit.edu',
        password: 'securePassword123',
        role: 'student'
      };

      const result = await authService.signup(signupData);

      expect(result.success).toBe(true);
      expect(result.data?.message).toBe('Verification email sent successfully');
      expect(mockConsoleLog).toHaveBeenCalledWith('Signup attempt:', signupData);
    });

    it('should successfully signup an aspirant', async () => {
      const signupData: SignupData = {
        name: 'Jane Smith',
        email: 'jane@example.com',
        password: 'securePassword123',
        role: 'aspirant'
      };

      const result = await authService.signup(signupData);

      expect(result.success).toBe(true);
      expect(result.data?.message).toBe('Verification email sent successfully');
    });

    it('should handle signup with all required fields', async () => {
      const signupData: SignupData = {
        name: '',
        email: '',
        password: '',
        role: 'student'
      };

      const result = await authService.signup(signupData);

      // Mock service always returns success, but in real implementation
      // this would validate required fields
      expect(result.success).toBe(true);
    });
  });

  describe('login', () => {
    it('should successfully login with valid credentials', async () => {
      const loginData: LoginData = {
        email: 'john@mit.edu',
        password: 'securePassword123',
        rememberMe: false
      };

      const result = await authService.login(loginData);

      expect(result.success).toBe(true);
      expect(result.data?.user).toEqual({
        id: 'mock-user-id',
        email: loginData.email,
        role: 'student'
      });
      expect(result.data?.token).toBe('mock-jwt-token');
    });

    it('should handle remember me option', async () => {
      const loginData: LoginData = {
        email: 'john@mit.edu',
        password: 'securePassword123',
        rememberMe: true
      };

      const result = await authService.login(loginData);

      expect(result.success).toBe(true);
      expect(mockConsoleLog).toHaveBeenCalledWith('Login attempt:', loginData);
    });
  });

  describe('verifyEmail', () => {
    it('should successfully verify email with correct code', async () => {
      const verifyData: VerifyEmailData = {
        email: 'john@mit.edu',
        code: '123456'
      };

      const result = await authService.verifyEmail(verifyData);

      expect(result.success).toBe(true);
      expect(result.data?.needsCollegeSelection).toBe(true);
    });

    it('should fail verification with incorrect code', async () => {
      const verifyData: VerifyEmailData = {
        email: 'john@mit.edu',
        code: '000000'
      };

      const result = await authService.verifyEmail(verifyData);

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('INVALID_CODE');
      expect(result.error?.message).toBe('Invalid verification code');
    });

    it('should handle empty verification code', async () => {
      const verifyData: VerifyEmailData = {
        email: 'john@mit.edu',
        code: ''
      };

      const result = await authService.verifyEmail(verifyData);

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('INVALID_CODE');
    });
  });

  describe('resendVerificationCode', () => {
    it('should successfully resend verification code', async () => {
      const email = 'john@mit.edu';

      const result = await authService.resendVerificationCode(email);

      expect(result.success).toBe(true);
      expect(result.data?.message).toBe('Verification code sent successfully');
      expect(mockConsoleLog).toHaveBeenCalledWith('Resend verification code for:', email);
    });

    it('should handle empty email', async () => {
      const email = '';

      const result = await authService.resendVerificationCode(email);

      // Mock service always returns success, but real implementation would validate
      expect(result.success).toBe(true);
    });
  });

  describe('getColleges', () => {
    it('should return list of colleges', async () => {
      const result = await authService.getColleges();

      expect(result.success).toBe(true);
      expect(Array.isArray(result.data)).toBe(true);
      expect(result.data?.length).toBeGreaterThan(0);
      
      // Check structure of first college
      const firstCollege = result.data?.[0];
      expect(firstCollege).toHaveProperty('id');
      expect(firstCollege).toHaveProperty('name');
      expect(firstCollege).toHaveProperty('country');
      expect(firstCollege).toHaveProperty('verification_type');
      expect(firstCollege).toHaveProperty('provides_email');
    });

    it('should include colleges with different verification types', async () => {
      const result = await authService.getColleges();

      expect(result.success).toBe(true);
      
      const colleges = result.data || [];
      const hasEmailVerification = colleges.some((c: any) => c.verification_type === 'automatic' && c.provides_email);
      const hasDatabaseVerification = colleges.some((c: any) => c.verification_type === 'database_only' && !c.provides_email);
      
      expect(hasEmailVerification).toBe(true);
      expect(hasDatabaseVerification).toBe(true);
    });
  });

  describe('verifyCollegeCredentials', () => {
    it('should successfully verify with correct credentials', async () => {
      const credentialsData: VerifyCollegeCredentialsData = {
        collegeId: 'iit-delhi',
        studentName: 'John Doe',
        branch: 'Computer Science',
        year: 2024,
        rollNumber: 'CS2024001',
        verificationPassword: 'demo123'
      };

      const result = await authService.verifyCollegeCredentials(credentialsData);

      expect(result.success).toBe(true);
      expect(result.data?.verified).toBe(true);
      expect(result.data?.studentId).toBe('mock-student-id');
      expect(result.data?.user).toHaveProperty('id');
      expect(result.data?.tokens).toHaveProperty('access_token');
      expect(result.data?.tokens).toHaveProperty('refresh_token');
    });

    it('should fail verification with incorrect password', async () => {
      const credentialsData: VerifyCollegeCredentialsData = {
        collegeId: 'iit-delhi',
        studentName: 'John Doe',
        branch: 'Computer Science',
        year: 2024,
        verificationPassword: 'wrongpassword'
      };

      const result = await authService.verifyCollegeCredentials(credentialsData);

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('INVALID_PASSWORD');
      expect(result.error?.message).toBe('Invalid verification password');
    });

    it('should handle credentials without roll number', async () => {
      const credentialsData: VerifyCollegeCredentialsData = {
        collegeId: 'iit-delhi',
        studentName: 'John Doe',
        branch: 'Computer Science',
        year: 2024,
        verificationPassword: 'demo123'
      };

      const result = await authService.verifyCollegeCredentials(credentialsData);

      expect(result.success).toBe(true);
      expect(result.data?.verified).toBe(true);
    });
  });

  describe('refreshToken', () => {
    it('should successfully refresh token', async () => {
      const refreshData = { refresh_token: 'valid-refresh-token' };

      const result = await authService.refreshToken(refreshData);

      expect(result.success).toBe(true);
      expect(result.data?.tokens).toHaveProperty('access_token');
      expect(result.data?.tokens).toHaveProperty('refresh_token');
      expect(result.data?.tokens.access_token).toBe('new-mock-access-token');
      expect(result.data?.tokens.refresh_token).toBe('new-mock-refresh-token');
    });

    it('should handle empty refresh token', async () => {
      const refreshData = { refresh_token: '' };

      const result = await authService.refreshToken(refreshData);

      // Mock service always returns success, but real implementation would validate
      expect(result.success).toBe(true);
    });
  });

  describe('initiateEmailVerification', () => {
    it('should successfully initiate email verification', async () => {
      const email = 'john@mit.edu';

      const result = await authService.initiateEmailVerification({ email });

      expect(result.success).toBe(true);
      expect(result.data?.message).toBe('Verification email sent successfully');
    });
  });

  describe('verifyEmailCode', () => {
    it('should successfully verify email code', async () => {
      const data = { email: 'john@mit.edu', code: '123456' };

      const result = await authService.verifyEmailCode(data);

      expect(result.success).toBe(true);
      expect(result.data?.verified).toBe(true);
      expect(result.data?.needsCollegeSelection).toBe(true);
      expect(result.data?.user).toHaveProperty('id');
      expect(result.data?.tokens).toHaveProperty('access_token');
    });

    it('should fail with invalid code', async () => {
      const data = { email: 'john@mit.edu', code: '000000' };

      const result = await authService.verifyEmailCode(data);

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('INVALID_CODE');
    });
  });
});

describe('EmailVerificationService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('sendVerificationEmail', () => {
    it('should send verification email', async () => {
      const email = 'john@mit.edu';

      const result = await EmailVerificationService.sendVerificationEmail(email);

      expect(result.success).toBe(true);
      expect(result.data?.message).toBe('Verification email sent successfully');
    });
  });

  describe('verifyCode', () => {
    it('should verify code successfully', async () => {
      const email = 'john@mit.edu';
      const code = '123456';

      const result = await EmailVerificationService.verifyCode(email, code);

      expect(result.success).toBe(true);
      expect(result.data?.verified).toBe(true);
    });

    it('should fail with invalid code', async () => {
      const email = 'john@mit.edu';
      const code = '000000';

      const result = await EmailVerificationService.verifyCode(email, code);

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('INVALID_CODE');
    });
  });

  describe('resendCode', () => {
    it('should resend verification code', async () => {
      const email = 'john@mit.edu';

      const result = await EmailVerificationService.resendCode(email);

      expect(result.success).toBe(true);
      expect(result.data?.message).toBe('Verification code sent successfully');
    });
  });

  describe('canRequestNewCode', () => {
    it('should check if new code can be requested', async () => {
      const email = 'john@mit.edu';

      const result = await EmailVerificationService.canRequestNewCode(email);

      expect(result.success).toBe(true);
      expect(result.data?.canRequest).toBe(true);
      expect(result.data?.waitTime).toBe(0);
    });
  });

  describe('getVerificationStatus', () => {
    it('should get verification status', async () => {
      const email = 'john@mit.edu';

      const result = await EmailVerificationService.getVerificationStatus(email);

      expect(result.success).toBe(true);
      expect(result.data?.status).toBe('pending');
      expect(result.data?.hasActiveCode).toBe(true);
      expect(result.data?.isExpired).toBe(false);
      expect(result.data?.isLocked).toBe(false);
      expect(result.data?.attemptsRemaining).toBe(3);
      expect(result.data?.expiresAt).toBeDefined();
    });
  });
});