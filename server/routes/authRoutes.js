import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import rateLimit from 'express-rate-limit';
import db from '../config/db.js';
import authenticateToken from '../middleware/auth.js';

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_movie_match_jwt_key_2026';

// Rate Limiter for Authentication (prevents brute force, skips CORS OPTIONS preflights)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 50, // 50 requests per IP
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => req.method === 'OPTIONS',
  message: { error: 'Too many authentication attempts from this IP. Please try again in 15 minutes.' }
});

router.use('/login', authLimiter);
router.use('/register', authLimiter);

const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

// Register User
router.post('/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({ error: 'Username, email, and password are required.' });
    }

    const cleanUsername = username.trim();
    const cleanEmail = email.trim().toLowerCase();

    if (cleanUsername.length < 3) {
      return res.status(400).json({ error: 'Username must be at least 3 characters long.' });
    }

    if (!EMAIL_REGEX.test(cleanEmail)) {
      return res.status(400).json({ error: 'Please enter a valid email address (e.g. user@domain.com).' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters long.' });
    }

    // Check existing
    const existing = db.prepare('SELECT * FROM users WHERE username = ? OR email = ?').get(cleanUsername, cleanEmail);
    if (existing) {
      return res.status(409).json({ error: 'An account with this username or email already exists.' });
    }

    // Hash password
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Insert user
    const insert = db.prepare('INSERT INTO users (username, email, password_hash) VALUES (?, ?, ?)');
    const result = insert.run(username.trim(), email.trim().toLowerCase(), passwordHash);

    const userId = result.lastInsertRowid;
    const userPayload = { id: userId, username: username.trim(), email: email.trim().toLowerCase() };

    // Generate JWT Token
    const token = jwt.sign(userPayload, JWT_SECRET, { expiresIn: '7d' });

    res.status(201).json({
      message: 'Account created successfully',
      token,
      user: userPayload
    });
  } catch (err) {
    console.error('Registration error:', err);
    res.status(500).json({ error: 'Internal server error during registration.' });
  }
});

// Login User
router.post('/login', async (req, res) => {
  try {
    const { usernameOrEmail, password } = req.body;

    if (!usernameOrEmail || !password) {
      return res.status(400).json({ error: 'Username/Email and password are required.' });
    }

    const user = db.prepare('SELECT * FROM users WHERE username = ? OR email = ?').get(usernameOrEmail, usernameOrEmail.toLowerCase());
    if (!user) {
      return res.status(401).json({ error: 'Invalid username/email or password.' });
    }

    if (!user.password_hash) {
      return res.status(400).json({ error: 'This account uses Authentik SSO login. Please log in with Authentik.' });
    }

    const validPassword = await bcrypt.compare(password, user.password_hash);
    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid username/email or password.' });
    }

    const userPayload = { id: user.id, username: user.username, email: user.email };
    const token = jwt.sign(userPayload, JWT_SECRET, { expiresIn: '7d' });

    res.json({
      message: 'Login successful',
      token,
      user: userPayload
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Internal server error during login.' });
  }
});

// Authentik OIDC Config Status
router.get('/authentik/config', (req, res) => {
  const clientId = process.env.AUTHENTIK_CLIENT_ID;
  const issuerUrl = process.env.AUTHENTIK_ISSUER_URL;

  res.json({
    configured: Boolean(clientId && issuerUrl),
    clientId: clientId || null,
    issuerUrl: issuerUrl || null
  });
});

// Authentik OIDC Login Redirect Initiator
router.get('/authentik/login', (req, res) => {
  const clientId = process.env.AUTHENTIK_CLIENT_ID;
  const issuerUrl = process.env.AUTHENTIK_ISSUER_URL;
  const redirectUri = process.env.AUTHENTIK_REDIRECT_URI || 'http://localhost:5001/api/auth/authentik/callback';
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';

  // If Client ID & Issuer URL are provided, perform real Authentik OIDC authorization redirect
  if (clientId && clientId.trim().length > 0 && issuerUrl && issuerUrl.trim().length > 0) {
    const baseUrl = issuerUrl.trim().replace(/\/$/, '');
    const authUrl = `${baseUrl}/authorize/?client_id=${encodeURIComponent(clientId.trim())}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=openid%20profile%20email`;
    return res.redirect(authUrl);
  }

  // Demo SSO mode when client ID is not yet provided
  try {
    const demoSub = 'authentik-sso-demo-sub-2026';
    const demoEmail = 'authentik.user@moviematch.io';
    const demoUsername = 'Authentik SSO User';

    let user = db.prepare('SELECT * FROM users WHERE authentik_sub = ? OR email = ?').get(demoSub, demoEmail);
    if (!user) {
      const insert = db.prepare('INSERT INTO users (username, email, authentik_sub) VALUES (?, ?, ?)');
      const result = insert.run(demoUsername, demoEmail, demoSub);
      user = { id: result.lastInsertRowid, username: demoUsername, email: demoEmail };
    }

    const userPayload = { id: user.id, username: user.username, email: user.email, authProvider: 'authentik' };
    const sessionToken = jwt.sign(userPayload, JWT_SECRET, { expiresIn: '7d' });

    return res.redirect(`${frontendUrl}?token=${sessionToken}`);
  } catch (err) {
    console.error('Demo Authentik login error:', err);
    return res.redirect(`${frontendUrl}?auth_error=Authentik%20SSO%20login%20failed`);
  }
});

// Authentik OIDC Callback Endpoint
router.get('/authentik/callback', async (req, res) => {
  const { code } = req.query;
  const clientId = process.env.AUTHENTIK_CLIENT_ID;
  const clientSecret = process.env.AUTHENTIK_CLIENT_SECRET;
  const issuerUrl = process.env.AUTHENTIK_ISSUER_URL;
  const redirectUri = process.env.AUTHENTIK_REDIRECT_URI || 'http://localhost:5001/api/auth/authentik/callback';
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';

  if (!code) {
    return res.redirect(`${frontendUrl}?auth_error=No authorization code provided`);
  }

  try {
    const baseUrl = issuerUrl ? issuerUrl.trim().replace(/\/$/, '') : '';
    const tokenEndpoint = `${baseUrl}/token/`;
    const userinfoEndpoint = `${baseUrl}/userinfo/`;

    // 1. Exchange code for access token
    const tokenParams = new URLSearchParams({
      grant_type: 'authorization_code',
      client_id: clientId ? clientId.trim() : '',
      client_secret: clientSecret ? clientSecret.trim() : '',
      code,
      redirect_uri: redirectUri
    });

    const tokenRes = await fetch(tokenEndpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: tokenParams.toString()
    });

    if (!tokenRes.ok) {
      throw new Error(`Token exchange failed with HTTP ${tokenRes.status}`);
    }

    const tokenData = await tokenRes.json();
    const accessToken = tokenData.access_token;

    // 2. Fetch User Info from Authentik
    const userRes = await fetch(userinfoEndpoint, {
      headers: { 'Authorization': `Bearer ${accessToken}` }
    });

    if (!userRes.ok) {
      throw new Error(`Userinfo request failed with HTTP ${userRes.status}`);
    }

    const oidcUser = await userRes.json();
    const sub = oidcUser.sub;
    const email = (oidcUser.email || `${sub}@authentik.local`).toLowerCase();
    const username = oidcUser.preferred_username || oidcUser.name || email.split('@')[0];

    // 3. Upsert user into SQLite
    let user = db.prepare('SELECT * FROM users WHERE authentik_sub = ? OR email = ?').get(sub, email);

    if (!user) {
      const insert = db.prepare('INSERT INTO users (username, email, authentik_sub) VALUES (?, ?, ?)');
      const result = insert.run(username, email, sub);
      user = { id: result.lastInsertRowid, username, email };
    } else if (!user.authentik_sub) {
      // Link existing account to Authentik sub
      db.prepare('UPDATE users SET authentik_sub = ? WHERE id = ?').run(sub, user.id);
    }

    // 4. Generate Movie Matcher JWT session token
    const userPayload = { id: user.id, username: user.username, email: user.email, authProvider: 'authentik' };
    const sessionToken = jwt.sign(userPayload, JWT_SECRET, { expiresIn: '7d' });

    // Redirect to frontend with token
    res.redirect(`${frontendUrl}?token=${sessionToken}`);
  } catch (err) {
    console.error('Authentik OIDC callback error:', err);
    res.redirect(`${frontendUrl}?auth_error=${encodeURIComponent(err.message)}`);
  }
});

// Get Current User Profile
router.get('/me', authenticateToken, (req, res) => {
  const user = db.prepare('SELECT id, username, email, authentik_sub, created_at FROM users WHERE id = ?').get(req.user.id);
  if (!user) {
    return res.status(404).json({ error: 'User not found.' });
  }
  res.json({ user });
});

export default router;
