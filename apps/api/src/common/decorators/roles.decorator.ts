import { SetMetadata } from '@nestjs/common';
import { UserRole } from '@bondbridge/shared';

export const ROLES_KEY = 'roles';

/**
 * Restricts endpoint access to users with specified roles.
 * Usage: @Roles(UserRole.ADMIN, UserRole.MODERATOR)
 */
export const Roles = (...roles: UserRole[]) => SetMetadata(ROLES_KEY, roles);
