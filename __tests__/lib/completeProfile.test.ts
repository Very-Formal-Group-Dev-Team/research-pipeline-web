/**
 * @jest-environment jsdom
 */

import { completeProfile, CompleteProfileData } from '@/lib/completeProfile';
import * as usersApi from '@/lib/api/users';

// Mock the API users module
jest.mock('@/lib/api/users', () => ({
  completeProfile: jest.fn(),
  updateProfile: jest.fn(),
}));

const mockApiCompleteProfile = usersApi.completeProfile as jest.MockedFunction<typeof usersApi.completeProfile>;

describe('completeProfile', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Validation', () => {
    it('should return error when displayName is missing', async () => {
      const data: CompleteProfileData = {
        userId: 'user-123',
        displayName: '',
        role: 'student',
        email: 'john@example.com',
      };

      const result = await completeProfile(data);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Missing required fields');
      expect(mockApiCompleteProfile).not.toHaveBeenCalled();
    });

    it('should return error when role is missing', async () => {
      const data: CompleteProfileData = {
        userId: 'user-123',
        displayName: 'John Doe',
        role: '' as any,
        email: 'john@example.com',
      };

      const result = await completeProfile(data);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Missing required fields');
      expect(mockApiCompleteProfile).not.toHaveBeenCalled();
    });

    it('should return error when email is missing', async () => {
      const data: CompleteProfileData = {
        userId: 'user-123',
        displayName: 'John Doe',
        role: 'student',
        email: '',
      };

      const result = await completeProfile(data);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Missing required fields');
      expect(mockApiCompleteProfile).not.toHaveBeenCalled();
    });
  });

  describe('API Delegation', () => {
    it('should call apiCompleteProfile with correct payload', async () => {
      mockApiCompleteProfile.mockResolvedValue({
        success: true,
        redirectPath: '/student',
      });

      const data: CompleteProfileData = {
        userId: 'user-123',
        displayName: 'John Doe',
        role: 'student',
        email: 'john@example.com',
      };

      await completeProfile(data);

      expect(mockApiCompleteProfile).toHaveBeenCalledWith({
        displayName: 'John Doe',
        role: 'student',
        email: 'john@example.com',
        avatarFile: null,
        googlePhotoUrl: null,
      });
    });

    it('should pass avatarFile when provided', async () => {
      const mockFile = new File(['avatar'], 'avatar.jpg', { type: 'image/jpeg' });
      mockApiCompleteProfile.mockResolvedValue({
        success: true,
        redirectPath: '/student',
      });

      const data: CompleteProfileData = {
        userId: 'user-123',
        displayName: 'John Doe',
        role: 'student',
        email: 'john@example.com',
        avatarFile: mockFile,
      };

      await completeProfile(data);

      expect(mockApiCompleteProfile).toHaveBeenCalledWith(
        expect.objectContaining({ avatarFile: mockFile })
      );
    });

    it('should pass googlePhotoUrl when provided', async () => {
      mockApiCompleteProfile.mockResolvedValue({
        success: true,
        redirectPath: '/student',
      });

      const data: CompleteProfileData = {
        userId: 'user-123',
        displayName: 'John Doe',
        role: 'student',
        email: 'john@example.com',
        googlePhotoUrl: 'https://lh3.googleusercontent.com/photo.jpg',
      };

      await completeProfile(data);

      expect(mockApiCompleteProfile).toHaveBeenCalledWith(
        expect.objectContaining({
          googlePhotoUrl: 'https://lh3.googleusercontent.com/photo.jpg',
        })
      );
    });

    it('should handle API error response', async () => {
      mockApiCompleteProfile.mockResolvedValue({
        success: false,
        error: 'Profile setup failed',
      });

      const data: CompleteProfileData = {
        userId: 'user-123',
        displayName: 'John Doe',
        role: 'student',
        email: 'john@example.com',
      };

      const result = await completeProfile(data);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Profile setup failed');
    });
  });

  describe('Redirect Path', () => {
    it('should return /student redirect path for student role', async () => {
      mockApiCompleteProfile.mockResolvedValue({
        success: true,
        redirectPath: '/student',
      });

      const data: CompleteProfileData = {
        userId: 'user-123',
        displayName: 'John Doe',
        role: 'student',
        email: 'john@example.com',
      };

      const result = await completeProfile(data);

      expect(result.success).toBe(true);
      expect(result.redirectPath).toBe('/student');
    });

    it('should return /adviser redirect path for teacher role', async () => {
      mockApiCompleteProfile.mockResolvedValue({
        success: true,
        redirectPath: '/adviser',
      });

      const data: CompleteProfileData = {
        userId: 'user-123',
        displayName: 'Jane Smith',
        role: 'teacher',
        email: 'jane@example.com',
      };

      const result = await completeProfile(data);

      expect(result.success).toBe(true);
      expect(result.redirectPath).toBe('/adviser');
    });

    it('should fall back to local redirect path when API does not return one', async () => {
      mockApiCompleteProfile.mockResolvedValue({
        success: true,
      });

      const data: CompleteProfileData = {
        userId: 'user-123',
        displayName: 'John Doe',
        role: 'student',
        email: 'john@example.com',
      };

      const result = await completeProfile(data);

      expect(result.success).toBe(true);
      expect(result.redirectPath).toBe('/student');
    });

    it('should fall back to /adviser for teacher role when API does not return redirect', async () => {
      mockApiCompleteProfile.mockResolvedValue({
        success: true,
      });

      const data: CompleteProfileData = {
        userId: 'user-123',
        displayName: 'Jane Smith',
        role: 'teacher',
        email: 'jane@example.com',
      };

      const result = await completeProfile(data);

      expect(result.success).toBe(true);
      expect(result.redirectPath).toBe('/adviser');
    });
  });

  describe('Integration', () => {
    it('should complete full profile setup successfully with avatar', async () => {
      const mockFile = new File(['avatar'], 'avatar.jpg', { type: 'image/jpeg' });
      mockApiCompleteProfile.mockResolvedValue({
        success: true,
        redirectPath: '/student',
      });

      const data: CompleteProfileData = {
        userId: 'user-123',
        displayName: 'John Doe',
        role: 'student',
        email: 'john@example.com',
        avatarFile: mockFile,
      };

      const result = await completeProfile(data);

      expect(result.success).toBe(true);
      expect(result.redirectPath).toBe('/student');
      expect(mockApiCompleteProfile).toHaveBeenCalledTimes(1);
    });

    it('should handle unexpected errors gracefully', async () => {
      mockApiCompleteProfile.mockRejectedValue(new Error('Network error'));

      const data: CompleteProfileData = {
        userId: 'user-123',
        displayName: 'John Doe',
        role: 'student',
        email: 'john@example.com',
      };

      const result = await completeProfile(data);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Network error');
    });

    it('should handle non-Error thrown values', async () => {
      mockApiCompleteProfile.mockRejectedValue('string error');

      const data: CompleteProfileData = {
        userId: 'user-123',
        displayName: 'John Doe',
        role: 'student',
        email: 'john@example.com',
      };

      const result = await completeProfile(data);

      expect(result.success).toBe(false);
      expect(result.error).toBe('An unexpected error occurred');
    });
  });
});
