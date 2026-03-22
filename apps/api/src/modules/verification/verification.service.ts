import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '@/common/prisma/prisma.service';
import { IVerificationProvider } from './providers/verification-provider.interface';
import { MockVerificationProvider } from './providers/mock.provider';
import { DigiLockerProvider } from './providers/digilocker.provider';
import { VerificationStatus } from '@bondbridge/database';

@Injectable()
export class VerificationService {
  private provider: IVerificationProvider;

  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
  ) {
    const providerName = this.configService.get('VERIFICATION_PROVIDER', 'mock');
    this.provider = providerName === 'digilocker'
      ? new DigiLockerProvider()
      : new MockVerificationProvider();
  }

  async initiateVerification(userId: string) {
    const existing = await this.prisma.userVerification.findUnique({
      where: { userId },
    });

    if (existing?.status === 'VERIFIED') {
      throw new BadRequestException('User is already verified');
    }

    if (existing && existing.attempts >= 5) {
      throw new BadRequestException('Maximum verification attempts reached. Contact support.');
    }

    const result = await this.provider.initiateVerification(userId);

    await this.prisma.userVerification.upsert({
      where: { userId },
      create: {
        userId,
        status: VerificationStatus.PENDING,
        provider: this.provider.providerName,
        providerRefId: result.sessionId,
        attempts: 1,
      },
      update: {
        status: VerificationStatus.PENDING,
        provider: this.provider.providerName,
        providerRefId: result.sessionId,
        attempts: { increment: 1 },
      },
    });

    return {
      redirectUrl: result.redirectUrl,
      sessionId: result.sessionId,
      provider: result.provider,
    };
  }

  async handleCallback(sessionId: string, callbackData: Record<string, any>) {
    const verification = await this.prisma.userVerification.findFirst({
      where: { providerRefId: sessionId },
    });

    if (!verification) {
      throw new NotFoundException('Verification session not found');
    }

    const result = await this.provider.handleCallback(sessionId, callbackData);

    if (result.success) {
      await this.prisma.userVerification.update({
        where: { id: verification.id },
        data: {
          status: VerificationStatus.VERIFIED,
          verifiedName: result.verifiedName,
          verifiedAge: result.verifiedAge,
          verifiedAt: new Date(),
          expiresAt: result.expiresAt,
          metadata: result.metadata as any,
        },
      });

      // Boost trust score on verification
      await this.prisma.userScore.update({
        where: { userId: verification.userId },
        data: { trustScore: { increment: 15 } },
      });
    } else {
      await this.prisma.userVerification.update({
        where: { id: verification.id },
        data: {
          status: VerificationStatus.REJECTED,
          rejectionReason: result.rejectionReason,
        },
      });
    }

    return { success: result.success, status: result.success ? 'VERIFIED' : 'REJECTED' };
  }

  async getVerificationStatus(userId: string) {
    const verification = await this.prisma.userVerification.findUnique({
      where: { userId },
      select: { status: true, verifiedAt: true, expiresAt: true, attempts: true, provider: true },
    });
    return verification || { status: 'NONE', verifiedAt: null };
  }
}
