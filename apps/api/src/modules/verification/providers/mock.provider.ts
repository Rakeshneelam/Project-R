import { Injectable } from '@nestjs/common';
import {
  IVerificationProvider,
  VerificationResult,
  InitiateVerificationResult,
} from './verification-provider.interface';
import { v4 as uuidv4 } from 'uuid';

/**
 * Mock verification provider for development/testing.
 * Simulates verification flow with auto-approval.
 */
@Injectable()
export class MockVerificationProvider implements IVerificationProvider {
  readonly providerName = 'mock';

  async initiateVerification(
    userId: string,
    metadata?: Record<string, any>,
  ): Promise<InitiateVerificationResult> {
    const sessionId = uuidv4();
    return {
      sessionId,
      provider: this.providerName,
      redirectUrl: `http://localhost:3000/api/verification/mock-callback?session=${sessionId}`,
    };
  }

  async handleCallback(
    sessionId: string,
    callbackData: Record<string, any>,
  ): Promise<VerificationResult> {
    // Mock: auto-approve verification
    return {
      success: true,
      providerRefId: `mock_${sessionId}`,
      verifiedName: callbackData.name || 'Mock User',
      verifiedAge: callbackData.age || 25,
      expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year
      metadata: { provider: 'mock', sessionId },
    };
  }

  async checkStatus(providerRefId: string): Promise<VerificationResult> {
    return {
      success: true,
      providerRefId,
      verifiedName: 'Mock User',
      verifiedAge: 25,
    };
  }
}
