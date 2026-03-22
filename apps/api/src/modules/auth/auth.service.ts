import {
  Injectable,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '@/common/prisma/prisma.service';
import { SignupDto } from './dto';

@Injectable()
export class AuthService {
  constructor(private prisma: PrismaService) {}

  async syncUser(firebaseUser: { id: string; email?: string; phone?: string }, dto: SignupDto) {
    // Check if the user already exists in Postgres
    const existing = await this.prisma.user.findUnique({ where: { id: firebaseUser.id } });
    if (existing) {
      // If they already exist, just return the profile.
      // This can happen if the mobile app accidentally calls signup twice.
      return existing;
    }

    if (!firebaseUser.email && !firebaseUser.phone && !dto.email) {
      throw new BadRequestException('Email or phone is required');
    }

    // Force exact correspondence to the Firebase UID
    const user = await this.prisma.user.create({
      data: {
        id: firebaseUser.id,
        email: firebaseUser.email || dto.email,
        phone: firebaseUser.phone || dto.phone,
        password: 'FIREBASE_MANAGED', // Dummy value since password is in Firebase
        profile: {
          create: {
            displayName: dto.displayName || 'User',
            dateOfBirth: dto.dateOfBirth ? new Date(dto.dateOfBirth) : undefined,
          },
        },
        scores: {
          create: {}, 
        },
        settings: {
          create: {}, 
        },
      },
      include: {
        profile: true,
      },
    });

    return user;
  }
}
