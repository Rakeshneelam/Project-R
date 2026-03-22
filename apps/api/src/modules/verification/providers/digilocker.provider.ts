import { Injectable } from '@nestjs/common';
import {
  IVerificationProvider,
  VerificationResult,
  InitiateVerificationResult,
} from './verification-provider.interface';

/**
 * DigiLocker verification provider adapter.
 * Implements the real DigiLocker OAuth2 flow for Aadhaar/PAN verification.
 * 
 * TODO: Implement when production DigiLocker API keys are available.
 * Reference: https://digilocker.gov.in/
 */
@Injectable()
export class DigiLockerProvider implements IVerificationProvider {
  readonly providerName = 'digilocker';

  async initiateVerification(
    userId: string,
    metadata?: Record<string, any>,
  ): Promise<InitiateVerificationResult> {
    // TODO: Build DigiLocker OAuth2 authorization URL
    // 1. Generate state parameter (CSRF protection)
    // 2. Build authorization URL with client_id, redirect_uri, scope
    // 3. Store session mapping (state -> userId)
    throw new Error('DigiLocker provider not yet configured. Set VERIFICATION_PROVIDER=mock for development.');
  }

  async handleCallback(
    sessionId: string,
    callbackData: Record<string, any>,
  ): Promise<VerificationResult> {
    // TODO: Exchange authorization code for access token
    // 1. POST to DigiLocker token endpoint
    // 2. Fetch user documents (Aadhaar, PAN)
    // 3. Extract and verify identity data
    // 4. Return verification result
    throw new Error('DigiLocker provider not yet configured.');
  }

  async checkStatus(providerRefId: string): Promise<VerificationResult> {
    throw new Error('DigiLocker provider not yet configured.');
  }
}
