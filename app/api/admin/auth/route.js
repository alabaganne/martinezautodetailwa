import { cookies } from 'next/headers';
import crypto from 'crypto';

// Get admin password from environment variable
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';
const SESSION_NAME = 'admin_session';
const SESSION_MAX_AGE = 60 * 60 * 24; // 24 hours in seconds

// Generate a secure session token
const generateSessionToken = () => {
  return crypto.randomBytes(32).toString('hex');
};

// Store for session tokens (in production, use a database or Redis)
const activeSessions = new Set();

/**
 * GET /api/admin/auth
 * Check if user is authenticated
 */
export async function GET() {
  try {
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get(SESSION_NAME);
    
    // In development, accept any session cookie as valid
    // In production, validate against the session store
    if (process.env.NODE_ENV === 'development') {
      if (sessionToken && sessionToken.value) {
        console.log('[Auth] Dev mode: Session cookie found, treating as authenticated');
        return Response.json({ authenticated: true });
      }
    } else {
      // Production: validate against session store
      if (sessionToken && activeSessions.has(sessionToken.value)) {
        return Response.json({ authenticated: true });
      }
    }
    
    console.log('[Auth] No valid session found');
    return Response.json({ authenticated: false }, { status: 401 });
  } catch (error) {
    console.error('[Auth] Check failed:', error);
    return Response.json({ error: 'Auth check failed' }, { status: 500 });
  }
}

/**
 * POST /api/admin/auth
 * Authenticate with password
 */
export async function POST(request) {
  try {
    const body = await request.json();
    const { password } = body;
    
    if (!password) {
      return Response.json({ error: 'Password is required' }, { status: 400 });
    }
    
    // Check password
    if (password !== ADMIN_PASSWORD) {
      return Response.json({ error: 'Invalid password' }, { status: 401 });
    }
    
    // Generate session token
    const sessionToken = generateSessionToken();
    activeSessions.add(sessionToken);
    
    // Set session cookie
    const cookieStore = await cookies();
    cookieStore.set(SESSION_NAME, sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: SESSION_MAX_AGE,
      path: '/'
    });
    
    // Clean up old sessions periodically (simple cleanup)
    if (activeSessions.size > 100) {
      activeSessions.clear();
      activeSessions.add(sessionToken);
    }
    
    return Response.json({ 
      success: true,
      message: 'Authentication successful' 
    });
  } catch (error) {
    console.error('Auth error:', error);
    return Response.json({ error: 'Authentication failed' }, { status: 500 });
  }
}

/**
 * DELETE /api/admin/auth
 * Logout (clear session)
 */
export async function DELETE() {
  try {
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get(SESSION_NAME);
    
    if (sessionToken) {
      activeSessions.delete(sessionToken.value);
    }
    
    cookieStore.delete(SESSION_NAME);
    
    return Response.json({ 
      success: true,
      message: 'Logged out successfully' 
    });
  } catch (error) {
    return Response.json({ error: 'Logout failed' }, { status: 500 });
  }
}