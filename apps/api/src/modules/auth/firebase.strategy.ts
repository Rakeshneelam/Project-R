import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-custom';
import * as admin from 'firebase-admin';

// Initialize Firebase Admin (in production, use environment variables)
// TODO: Replace this with your actual serviceAccountKey.json path or env vars
const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT
  ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)
  : null;

if (admin.apps.length === 0 && serviceAccount) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
} else if (admin.apps.length === 0) {
  // Fallback for development without service account yet (will fail verification until provided)
  console.warn('Firebase Admin is NOT initialized. Missing FIREBASE_SERVICE_ACCOUNT env var.');
  admin.initializeApp();
}

@Injectable()
export class FirebaseStrategy extends PassportStrategy(Strategy, 'firebase-jwt') {
  constructor() {
    super();
  }

  async validate(req: any): Promise<any> {
    const token = this.extractTokenFromHeader(req);
    if (!token) {
      throw new UnauthorizedException('No token provided');
    }

    try {
      const decodedToken = await admin.auth().verifyIdToken(token);
      // Passport will attach this returned object to req.user
      return { 
        id: decodedToken.uid, 
        email: decodedToken.email,
        phone: decodedToken.phone_number 
      };
    } catch (err) {
      throw new UnauthorizedException('Invalid Firebase Token');
    }
  }

  private extractTokenFromHeader(request: any): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }
}
