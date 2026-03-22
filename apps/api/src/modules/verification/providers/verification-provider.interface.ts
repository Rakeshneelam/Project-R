/**
 * Verification Provider Interface
 * 
 * Abstraction layer for identity verification providers.
 * Implementations: MockVerificationProvider (dev), DigiLockerAdapter (prod)
 */
export interface VerificationResult {
  success: boolean;
  providerRefId?: string;
  verifiedName?: string;
  verifiedAge?: number;
  expiresAt?: Date;
  rejectionReason?: string;
  metadata?: Record<string, any>;
}

export interface InitiateVerificationResult {
  redirectUrl?: string;
  sessionId: string;
  provider: string;
}

export interface IVerificationProvider {
  /** Unique provider name */
  readonly providerName: string;

  /** Initiate verification flow — returns redirect URL or session ID */
  initiateVerification(userId: string, metadata?: Record<string, any>): Promise<InitiateVerificationResult>;

  /** Handle callback from verification provider */
  handleCallback(sessionId: string, callbackData: Record<string, any>): Promise<VerificationResult>;

  /** Check the current verification status */
  checkStatus(providerRefId: string): Promise<VerificationResult>;
}
