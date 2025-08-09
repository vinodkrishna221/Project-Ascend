import { createClient } from '@supabase/supabase-js'
import { Database } from '../database.types'
import { createRoleManagementService, ROLE_PERMISSIONS } from '../role-management.service'
import { UserRole, VerificationMethod, VerificationStatus } from '../auth.types'

// Mock Supabase client
const mockSupabase = {
  from: jest.fn(),
  rpc: jest.fn()
} as any

const roleService = createRoleManagementService(mockSupabase)

describe('RoleManagementService', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('assignRoleBasedOnVerification', () => {
    it('should assign student role for email verification', async () => {
      const mockUpdate = {
        update: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: { id: 'user-1', role: 'student' },
          error: null
        })
      }

      mockSupabase.from.mockReturnValue(mockUpdate)
      mockSupabase.rpc.mockResolvedValue({ data: null, error: null })

      const result = await roleService.assignRoleBasedOnVerification(
        'user-1',
        'email',
        'verified',
        'college-1'
      )

      expect(result.success).toBe(true)
      expect(result.role).toBe('student')
      expect(mockUpdate.update).toHaveBeenCalledWith({
        role: 'student',
        updated_at: expect.any(String)
      })
    })

    it('should assign student role for college database verification', async () => {
      const mockUpdate = {
        update: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: { id: 'user-1', role: 'student' },
          error: null
        })
      }

      mockSupabase.from.mockReturnValue(mockUpdate)
      mockSupabase.rpc.mockResolvedValue({ data: null, error: null })

      const result = await roleService.assignRoleBasedOnVerification(
        'user-1',
        'college_database',
        'verified'
      )

      expect(result.success).toBe(true)
      expect(result.role).toBe('student')
    })

    it('should assign aspirant role for manual verification', async () => {
      const mockUpdate = {
        update: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: { id: 'user-1', role: 'aspirant' },
          error: null
        })
      }

      mockSupabase.from.mockReturnValue(mockUpdate)
      mockSupabase.rpc.mockResolvedValue({ data: null, error: null })

      const result = await roleService.assignRoleBasedOnVerification(
        'user-1',
        'manual',
        'verified'
      )

      expect(result.success).toBe(true)
      expect(result.role).toBe('aspirant')
    })

    it('should fail for unverified users', async () => {
      const result = await roleService.assignRoleBasedOnVerification(
        'user-1',
        'email',
        'pending'
      )

      expect(result.success).toBe(false)
      expect(result.error).toBe('User must be verified before role assignment')
    })
  })

  describe('checkPermission', () => {
    it('should grant permission for student with valid permission', async () => {
      const mockSelect = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: {
            role: 'student',
            verification_status: 'verified',
            college_id: 'college-1'
          },
          error: null
        })
      }

      mockSupabase.from.mockReturnValue(mockSelect)

      const result = await roleService.checkPermission('user-1', 'canCreatePosts')

      expect(result.hasPermission).toBe(true)
    })

    it('should deny permission for aspirant trying to create posts', async () => {
      const mockSelect = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: {
            role: 'aspirant',
            verification_status: 'verified',
            college_id: null
          },
          error: null
        })
      }

      mockSupabase.from.mockReturnValue(mockSelect)

      const result = await roleService.checkPermission('user-1', 'canCreatePosts')

      expect(result.hasPermission).toBe(false)
      expect(result.reason).toContain('aspirant')
    })

    it('should deny permission for unverified users', async () => {
      const mockSelect = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: {
            role: 'student',
            verification_status: 'pending',
            college_id: 'college-1'
          },
          error: null
        })
      }

      mockSupabase.from.mockReturnValue(mockSelect)

      const result = await roleService.checkPermission('user-1', 'canCreatePosts')

      expect(result.hasPermission).toBe(false)
      expect(result.reason).toBe('User not verified')
    })

    it('should check guild admin permissions with context', async () => {
      const mockSelect = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: {
            role: 'guild_admin',
            verification_status: 'verified',
            college_id: 'college-1'
          },
          error: null
        })
      }

      mockSupabase.from.mockReturnValue(mockSelect)

      const result = await roleService.checkPermission(
        'user-1',
        'canManageGuild',
        { guildId: 'college-1' }
      )

      expect(result.hasPermission).toBe(true)
    })

    it('should deny guild admin permissions for wrong guild', async () => {
      const mockSelect = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: {
            role: 'guild_admin',
            verification_status: 'verified',
            college_id: 'college-1'
          },
          error: null
        })
      }

      mockSupabase.from.mockReturnValue(mockSelect)

      const result = await roleService.checkPermission(
        'user-1',
        'canManageGuild',
        { guildId: 'college-2' }
      )

      expect(result.hasPermission).toBe(false)
      expect(result.reason).toContain('not admin of this guild')
    })
  })

  describe('updateUserRole', () => {
    it('should update user role and invalidate sessions', async () => {
      const mockProfileSelect = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: {
            role: 'student',
            verification_status: 'verified'
          },
          error: null
        })
      }

      const mockProfileUpdate = {
        update: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: { id: 'user-1', role: 'guild_admin' },
          error: null
        })
      }

      const mockSessionUpdate = {
        update: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        mockResolvedValue: jest.fn().mockResolvedValue({
          data: null,
          error: null
        })
      }

      mockSupabase.from
        .mockReturnValueOnce(mockProfileSelect) // First call for getting current profile
        .mockReturnValueOnce(mockProfileUpdate) // Second call for updating profile
        .mockReturnValueOnce(mockSessionUpdate) // Third call for invalidating sessions

      mockSupabase.rpc.mockResolvedValue({ data: null, error: null })

      const result = await roleService.updateUserRole(
        'user-1',
        'guild_admin',
        'admin-1',
        'Promoted to guild admin'
      )

      expect(result.success).toBe(true)
      expect(result.updatedRole).toBe('guild_admin')
    })

    it('should fail for unverified users', async () => {
      const mockSelect = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: {
            role: 'student',
            verification_status: 'pending'
          },
          error: null
        })
      }

      mockSupabase.from.mockReturnValue(mockSelect)

      const result = await roleService.updateUserRole(
        'user-1',
        'guild_admin',
        'admin-1'
      )

      expect(result.success).toBe(false)
      expect(result.error).toBe('Cannot update role for unverified user')
    })
  })

  describe('verifyAndDesignateGuildAdmin', () => {
    it('should successfully designate guild admin for verified student', async () => {
      const mockProfileSelect = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: {
            role: 'student',
            verification_status: 'verified',
            college_id: 'college-1'
          },
          error: null
        })
      }

      const mockProfileUpdate = {
        update: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        mockResolvedValue: jest.fn().mockResolvedValue({
          data: null,
          error: null
        })
      }

      const mockSessionUpdate = {
        update: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        mockResolvedValue: jest.fn().mockResolvedValue({
          data: null,
          error: null
        })
      }

      mockSupabase.from
        .mockReturnValueOnce(mockProfileSelect)
        .mockReturnValueOnce(mockProfileUpdate)
        .mockReturnValueOnce(mockSessionUpdate)

      mockSupabase.rpc.mockResolvedValue({ data: null, error: null })

      const result = await roleService.verifyAndDesignateGuildAdmin(
        'user-1',
        'college-1',
        'admin-1'
      )

      expect(result.success).toBe(true)
      expect(result.isVerified).toBe(true)
      expect(result.guildId).toBe('college-1')
    })

    it('should fail for users from different college', async () => {
      const mockSelect = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: {
            role: 'student',
            verification_status: 'verified',
            college_id: 'college-2'
          },
          error: null
        })
      }

      mockSupabase.from.mockReturnValue(mockSelect)

      const result = await roleService.verifyAndDesignateGuildAdmin(
        'user-1',
        'college-1',
        'admin-1'
      )

      expect(result.success).toBe(false)
      expect(result.isVerified).toBe(false)
      expect(result.error).toBe('User must be from the same college as the guild')
    })

    it('should fail for aspirants', async () => {
      const mockSelect = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: {
            role: 'aspirant',
            verification_status: 'verified',
            college_id: 'college-1'
          },
          error: null
        })
      }

      mockSupabase.from.mockReturnValue(mockSelect)

      const result = await roleService.verifyAndDesignateGuildAdmin(
        'user-1',
        'college-1',
        'admin-1'
      )

      expect(result.success).toBe(false)
      expect(result.isVerified).toBe(false)
      expect(result.error).toBe('Only verified students can become guild admins')
    })
  })

  describe('ROLE_PERMISSIONS', () => {
    it('should have correct permissions for student role', () => {
      const studentPerms = ROLE_PERMISSIONS.student
      expect(studentPerms.canCreatePosts).toBe(true)
      expect(studentPerms.canJoinCommunities).toBe(true)
      expect(studentPerms.canAccessGuilds).toBe(true)
      expect(studentPerms.canEndorseSkills).toBe(true)
      expect(studentPerms.canCreateProjects).toBe(true)
      expect(studentPerms.canModerateContent).toBe(false)
      expect(studentPerms.canManageGuild).toBe(false)
      expect(studentPerms.canAccessAdminPanel).toBe(false)
    })

    it('should have correct permissions for aspirant role', () => {
      const aspirantPerms = ROLE_PERMISSIONS.aspirant
      expect(aspirantPerms.canCreatePosts).toBe(false)
      expect(aspirantPerms.canJoinCommunities).toBe(true)
      expect(aspirantPerms.canAccessGuilds).toBe(true)
      expect(aspirantPerms.canEndorseSkills).toBe(false)
      expect(aspirantPerms.canCreateProjects).toBe(false)
      expect(aspirantPerms.canModerateContent).toBe(false)
      expect(aspirantPerms.canManageGuild).toBe(false)
      expect(aspirantPerms.canAccessAdminPanel).toBe(false)
    })

    it('should have correct permissions for guild_admin role', () => {
      const guildAdminPerms = ROLE_PERMISSIONS.guild_admin
      expect(guildAdminPerms.canCreatePosts).toBe(true)
      expect(guildAdminPerms.canJoinCommunities).toBe(true)
      expect(guildAdminPerms.canAccessGuilds).toBe(true)
      expect(guildAdminPerms.canEndorseSkills).toBe(true)
      expect(guildAdminPerms.canCreateProjects).toBe(true)
      expect(guildAdminPerms.canModerateContent).toBe(true)
      expect(guildAdminPerms.canManageGuild).toBe(true)
      expect(guildAdminPerms.canAccessAdminPanel).toBe(false)
      expect(guildAdminPerms.canViewAnalytics).toBe(true)
    })

    it('should have correct permissions for platform_admin role', () => {
      const platformAdminPerms = ROLE_PERMISSIONS.platform_admin
      expect(platformAdminPerms.canCreatePosts).toBe(true)
      expect(platformAdminPerms.canJoinCommunities).toBe(true)
      expect(platformAdminPerms.canAccessGuilds).toBe(true)
      expect(platformAdminPerms.canEndorseSkills).toBe(true)
      expect(platformAdminPerms.canCreateProjects).toBe(true)
      expect(platformAdminPerms.canModerateContent).toBe(true)
      expect(platformAdminPerms.canManageGuild).toBe(true)
      expect(platformAdminPerms.canAccessAdminPanel).toBe(true)
      expect(platformAdminPerms.canViewAnalytics).toBe(true)
    })
  })
})