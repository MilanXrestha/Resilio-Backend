// Authentication Middleware - validates Firebase JWT tokens OR SuperTokens access tokens
const admin = require('firebase-admin');

// Initialize Firebase Admin if not already done
if (!admin.apps.length) {
  // Try environment variables first (for Vercel/production)
  // Then fall back to JSON file (for local development)
  let credential;

  if (process.env.FIREBASE_PRIVATE_KEY) {
    // Use environment variables
    credential = admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    });
    console.log('✓ Firebase Admin initialized from environment variables');
  } else {
    // Fall back to JSON file for local development
    try {
      const serviceAccount = require('../../serviceAccountKey.json');
      credential = admin.credential.cert(serviceAccount);
      console.log('✓ Firebase Admin initialized from serviceAccountKey.json');
    } catch (err) {
      console.error('✗ Firebase initialization failed: No credentials found');
      console.error('  Set FIREBASE_PRIVATE_KEY env var or add serviceAccountKey.json');
    }
  }

  if (credential) {
    admin.initializeApp({ credential });
  } else {
    // Initialize without credentials (will fail on auth calls)
    admin.initializeApp();
  }
}

/**
 * Decode a JWT payload without verifying the signature.
 * Used only to inspect the `aud` claim and decide which verifier to use.
 * Returns null if the string is not a well-formed JWT.
 */
function decodeJwtPayload(token) {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    // Node ≥ 16 supports 'base64url'; fall back to 'base64' for older runtimes
    const payload = Buffer.from(parts[1], 'base64url').toString('utf8');
    return JSON.parse(payload);
  } catch {
    return null;
  }
}

async function authMiddleware(req, res, next) {
  try {
    console.log('=== Auth Middleware ===');
    console.log('Authorization header present:', !!req.headers.authorization);

    // Get token from Authorization header
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('✗ No Bearer token found');
      return res.status(401).json({ error: 'Unauthorized - No token provided' });
    }

    const token = authHeader.split(' ')[1];
    console.log('Token received, length:', token.length);

    // ── Peek at the JWT payload to determine the issuing provider ────────────
    // Firebase tokens always have aud === FIREBASE_PROJECT_ID.
    // SuperTokens tokens have a different (or missing) aud value.
    const payload = decodeJwtPayload(token);
    const isFirebaseToken = payload?.aud === process.env.FIREBASE_PROJECT_ID;
    console.log('Token provider:', isFirebaseToken ? 'firebase' : 'supertokens');

    if (isFirebaseToken) {
      // ── Firebase path ─────────────────────────────────────────────────────
      const decodedToken = await admin.auth().verifyIdToken(token);
      console.log('✓ Firebase token verified for user:', decodedToken.uid);

      req.user = {
        id: decodedToken.uid,
        email: decodedToken.email,
        firebaseUid: decodedToken.uid,
        provider: 'firebase',
      };
    } else {
      // ── SuperTokens path ──────────────────────────────────────────────────
      // Lazy-require so this module is only loaded when needed.
      const Session = require('supertokens-node/recipe/session');

      try {
        const session = await Session.getSessionWithoutRequestResponse(token);
        const userId = session.getUserId();
        console.log('✓ SuperTokens token verified for user:', userId);

        req.user = {
          id: userId,
          // ST access tokens may carry email in the payload; use it if present
          email: payload?.email ?? payload?.sub ?? null,
          superTokensUserId: userId,
          provider: 'supertokens',
        };
      } catch (stErr) {
        console.error('✗ SuperTokens token verification failed:', stErr.message);
        return res.status(401).json({ error: 'Unauthorized - Invalid or expired token' });
      }
    }

    next();
  } catch (error) {
    console.error('✗ Auth middleware error:', error.message);
    console.error('Error code:', error.code);

    if (error.code === 'auth/id-token-expired') {
      return res.status(401).json({ error: 'Token expired' });
    }

    if (error.code === 'auth/argument-error') {
      return res.status(401).json({ error: 'Invalid token' });
    }

    return res.status(401).json({ error: 'Unauthorized' });
  }
}

module.exports = { authMiddleware };