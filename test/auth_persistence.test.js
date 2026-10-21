const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const os = require('os');
const path = require('path');

process.env.DATA_DIR = fs.mkdtempSync(path.join(os.tmpdir(), 'adfilm-auth-'));
process.env.ANTHROPIC_API_KEY = 'test';
process.env.MAGNIFIC_API_KEY = 'test';

const { app } = require('../server');

let base, server;
test.before(() => new Promise((r) => {
  server = app.listen(0, () => {
    base = `http://127.0.0.1:${server.address().port}`;
    r();
  });
}));
test.after(() => server.close());

const post = async (url, body, token) => {
  const headers = { 'content-type': 'application/json' };
  if (token) headers['authorization'] = `Bearer ${token}`;
  const r = await fetch(base + url, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  });
  const data = await r.json().catch(() => ({}));
  return { status: r.status, body: data };
};

const get = async (url, token) => {
  const headers = {};
  if (token) headers['authorization'] = `Bearer ${token}`;
  const r = await fetch(base + url, { headers });
  const data = await r.json().catch(() => ({}));
  return { status: r.status, body: data };
};

const del = async (url, token) => {
  const headers = {};
  if (token) headers['authorization'] = `Bearer ${token}`;
  const r = await fetch(base + url, { method: 'DELETE', headers });
  const data = await r.json().catch(() => ({}));
  return { status: r.status, body: data };
};

test('Auth: Signup, Login, and Session validation', async () => {
  // 1. Signup with invalid email -> 400
  const badSignup = await post('/api/auth/signup', { email: 'invalid', password: '123' });
  assert.equal(badSignup.status, 400);

  // 2. Successful signup
  const signupRes = await post('/api/auth/signup', {
    email: 'owner@kirana.com',
    password: 'securepassword123',
    name: 'Ramesh Sharma',
    businessName: 'Sharma Kirana Store',
    businessType: 'Kirana & Grocery',
    town: 'Indore',
  });
  assert.equal(signupRes.status, 200);
  assert.equal(signupRes.body.user.email, 'owner@kirana.com');
  assert.ok(signupRes.body.token, 'Must return session token');
  assert.ok(signupRes.body.business, 'Must create default business');
  assert.equal(signupRes.body.business.businessName, 'Sharma Kirana Store');

  const token = signupRes.body.token;

  // 3. /api/auth/me returns current user
  const meRes = await get('/api/auth/me', token);
  assert.equal(meRes.status, 200);
  assert.equal(meRes.body.user.email, 'owner@kirana.com');
  assert.equal(meRes.body.businesses.length, 1);

  // 4. Bad login -> 401
  const badLogin = await post('/api/auth/login', {
    email: 'owner@kirana.com',
    password: 'wrongpassword',
  });
  assert.equal(badLogin.status, 401);

  // 5. Successful login
  const loginRes = await post('/api/auth/login', {
    email: 'owner@kirana.com',
    password: 'securepassword123',
  });
  assert.equal(loginRes.status, 200);
  assert.ok(loginRes.body.token);
});

test('Persistence: Multi-tenant business and project isolation', async () => {
  // Create User 1
  const u1 = (await post('/api/auth/signup', {
    email: 'user1@shop.com',
    password: 'password123',
    name: 'User One',
    businessName: 'User One Store',
  })).body;

  // Create User 2
  const u2 = (await post('/api/auth/signup', {
    email: 'user2@shop.com',
    password: 'password123',
    name: 'User Two',
    businessName: 'User Two Boutique',
  })).body;

  // User 1 saves a project
  const saveProjRes = await post('/api/projects', {
    title: 'Navratri Kirana Ad',
    businessName: 'User One Store',
    businessType: 'Kirana',
    town: 'Indore',
    brief: 'Fresh sabudana for fasting',
    currentStage: 'script',
    completedStages: ['business', 'brief', 'settings', 'idea', 'opening', 'story', 'script'],
    scenes: ['Scene 1', 'Scene 2', 'Scene 3', 'Scene 4'],
    status: 'script_approved',
  }, u1.token);

  assert.equal(saveProjRes.status, 200);
  const projId = saveProjRes.body.project.id;
  assert.ok(projId);

  // User 1 can fetch their project
  const u1Projs = await get('/api/projects', u1.token);
  assert.equal(u1Projs.status, 200);
  assert.equal(u1Projs.body.projects.length, 1);
  assert.equal(u1Projs.body.projects[0].id, projId);

  // User 2 CANNOT access User 1's project (isolation test)
  const u2GetU1Proj = await get(`/api/projects/${projId}`, u2.token);
  assert.equal(u2GetU1Proj.status, 404);

  const u2Projs = await get('/api/projects', u2.token);
  assert.equal(u2Projs.body.projects.length, 0, 'User 2 must not see User 1 projects');

  // User 1 deletes the project
  const delRes = await del(`/api/projects/${projId}`, u1.token);
  assert.equal(delRes.status, 200);

  const u1ProjsAfter = await get('/api/projects', u1.token);
  assert.equal(u1ProjsAfter.body.projects.length, 0);
});

test('Config: reports database driver and server configuration', async () => {
  const cfg = await get('/api/config');
  assert.equal(cfg.status, 200);
  assert.ok('database' in cfg.body);
  assert.equal(cfg.body.database, 'file_store');
});

test('Auth: Delete account cascades and revokes access', async () => {
  // 1. Signup a user to delete
  const signupRes = await post('/api/auth/signup', {
    email: 'delete_me@brand.com',
    password: 'password123',
    name: 'Temporary User',
    businessName: 'Temporary Brand',
    businessType: 'Retail',
  });
  assert.equal(signupRes.status, 200);
  const token = signupRes.body.token;

  // 2. User creates a project
  const projRes = await post('/api/projects', {
    title: 'Temp Project',
    businessName: 'Temporary Brand',
    scenes: ['Scene 1'],
  }, token);
  assert.equal(projRes.status, 200);
  const projId = projRes.body.project.id;

  // 3. User deletes account
  const delAccRes = await del('/api/auth/account', token);
  assert.equal(delAccRes.status, 200);
  assert.equal(delAccRes.body.status, 'success');

  // 4. Old session token is now invalid (401)
  const meRes = await get('/api/auth/me', token);
  assert.equal(meRes.status, 401);

  // 5. Cannot login with old email/password (401)
  const loginRes = await post('/api/auth/login', {
    email: 'delete_me@brand.com',
    password: 'password123',
  });
  assert.equal(loginRes.status, 401);

  // 6. Project is deleted / inaccessible
  const projGet = await get(`/api/projects/${projId}`, token);
  assert.equal(projGet.status, 401);
});

test('Auth Redesign: Video assets exist and are optimized', () => {
  const publicVideosDir = path.join(__dirname, '../public/videos');
  const optVideo = path.join(publicVideosDir, 'background-optimized.mp4');
  const origVideo = path.join(publicVideosDir, 'background.mp4');
  const poster = path.join(publicVideosDir, 'background-poster.jpg');

  assert.ok(fs.existsSync(optVideo), 'Optimized video file must exist');
  assert.ok(fs.existsSync(origVideo), 'Original video file must exist');
  assert.ok(fs.existsSync(poster), 'Poster image file must exist');

  const optStat = fs.statSync(optVideo);
  const origStat = fs.statSync(origVideo);
  const posterStat = fs.statSync(poster);

  assert.ok(optStat.size > 0 && optStat.size < origStat.size, 'Optimized video should be compressed and smaller than original');
  assert.ok(posterStat.size > 0, 'Poster image must have non-zero size');
});

test('Auth Redesign: AuthVideoShowcase component structure and video requirements', () => {
  const showcasePath = path.join(__dirname, '../src/components/v2/AuthVideoShowcase.jsx');
  assert.ok(fs.existsSync(showcasePath), 'AuthVideoShowcase component must exist');

  const code = fs.readFileSync(showcasePath, 'utf8');

  // Video element requirements from specification
  assert.ok(code.includes('<video'), 'Must contain HTML video element');
  assert.ok(code.includes('autoPlay'), 'Video must have autoPlay attribute');
  assert.ok(code.includes('muted'), 'Video must be muted');
  assert.ok(code.includes('loop'), 'Video must loop');
  assert.ok(code.includes('playsInline'), 'Video must have playsInline');
  assert.ok(code.includes('preload="metadata"'), 'Video must preload metadata');
  assert.ok(code.includes("objectFit: 'cover'") || code.includes('objectFit: "cover"'), 'Video must use objectFit: cover');
  assert.ok(code.includes('poster='), 'Video must specify a poster image');
  assert.ok(code.includes('prefers-reduced-motion'), 'Video must respect prefers-reduced-motion');
  assert.ok(code.includes('onError='), 'Video must handle errors gracefully');
  assert.ok(!code.match(/<video[^>]*\bcontrols\b/), 'Video tag must not display playback controls');

  // Full-viewport coverage behind elements, uncropped
  assert.ok(code.includes("position: 'fixed'") || code.includes('position: "fixed"'), 'Video showcase must position fixed to cover full viewport');
  assert.ok(code.includes('inset: 0') || code.includes('top: 0'), 'Video showcase must cover full viewport');
});

test('Auth Redesign: AuthScreen layout, floating panel, and independent logo', () => {
  const authScreenPath = path.join(__dirname, '../src/components/v2/AuthScreen.jsx');
  assert.ok(fs.existsSync(authScreenPath), 'AuthScreen component must exist');

  const code = fs.readFileSync(authScreenPath, 'utf8');

  // Architecture: Imports AuthVideoShowcase as full-screen background
  assert.ok(code.includes("import AuthVideoShowcase from './AuthVideoShowcase.jsx'"), 'AuthScreen must import AuthVideoShowcase');
  assert.ok(code.includes('<AuthVideoShowcase'), 'AuthScreen must render AuthVideoShowcase as full-screen background');

  // Removed old two-card composition
  assert.ok(!code.includes('auth-screen-card'), 'Must remove old outer card .auth-screen-card');
  assert.ok(!code.includes('auth-left-column'), 'Must remove separate left card .auth-left-column');
  assert.ok(!code.includes('auth-right-column'), 'Must remove separate right card .auth-right-column');

  // Independent CleverCuts logo directly over full-screen video in top-left
  assert.ok(code.includes('auth-independent-logo'), 'Must render independent logo floating over video in top-left');
  assert.ok(code.includes('CleverCuts'), 'Must render CleverCuts brand title');
  assert.ok(code.includes('Clapperboard'), 'Must render Clapperboard brand icon');

  assert.ok(code.includes('auth-floating-wrapper'), 'Must define floating panel wrapper');
  assert.ok(code.includes('auth-floating-panel'), 'Must define floating panel on the right');
  assert.ok(code.includes('430px') || code.includes('420px') || code.includes('440px'), 'Floating panel must have width ~400-440px');
  assert.ok(code.includes('rgba(13, 14, 22') || code.includes('rgba(14, 14, 22') || code.includes('backdrop-filter: blur'), 'Panel must have translucent dark surface with backdrop blur');
  assert.ok(code.includes('justify-content: flex-end') || code.includes('justifyContent: flex-end'), 'Panel must align to the right');
  assert.ok(code.includes('margin-left: auto') || code.includes("marginLeft: 'auto'"), 'Panel must anchor firmly to the right side');

  // Showcase editorial caption on bottom-left
  assert.ok(code.includes('auth-showcase-caption'), 'Must render showcase caption in bottom-left');
  assert.ok(code.includes('Turn product briefs into customer-converting video ads'), 'Must have compelling headline in bottom-left');

  // Headers and titles
  assert.ok(code.includes('Create an account'), 'Must support "Create an account" for signup');
  assert.ok(code.includes('Welcome back'), 'Must support "Welcome back" for signin');

  // Google OAuth button
  assert.ok(code.includes('Sign up with Google'), 'Must have "Sign up with Google"');
  assert.ok(code.includes('Continue with Google'), 'Must have "Continue with Google"');
  assert.ok(code.includes('Or with email'), 'Must have "Or with email" divider');

  // Fields
  assert.ok(code.includes('Your name'), 'Must have "Your name" field for signup');
  assert.ok(code.includes('Email address'), 'Must have "Email address" field');
  assert.ok(code.includes('Password'), 'Must have "Password" field');

  // Password visibility toggle
  assert.ok(code.includes('showPassword'), 'Must have password visibility state');
  assert.ok(code.includes('Eye') && code.includes('EyeOff'), 'Must render Eye/EyeOff toggle buttons');

  // Remember me & Forgot password
  assert.ok(code.includes('Remember me'), 'Must have "Remember me" option');
  assert.ok(code.includes('clevertize_remember_email'), 'Must persist remembered email to localStorage');
  assert.ok(code.includes('Forgot password?'), 'Must have "Forgot password?" option');

  // Loading state & buttons
  assert.ok(code.includes('Please wait...'), 'Must render loading state during submission');
  assert.ok(code.includes('Create Account'), 'Must have submit button text for signup');
  assert.ok(code.includes('Log In'), 'Must have submit button text for login');

  // Footers
  assert.ok(code.includes("Already have an account?"), 'Must have mode switch for sign in');
  assert.ok(code.includes("Don't have an account?"), 'Must have mode switch for sign up');
  assert.ok(code.includes('Terms of Service') && code.includes('Privacy Policy'), 'Must have Terms and Privacy footnote');
});

test('Auth Redesign: AuthModal incorporates AuthVideoShowcase and modal controls', () => {
  const authModalPath = path.join(__dirname, '../src/components/v2/AuthModal.jsx');
  assert.ok(fs.existsSync(authModalPath), 'AuthModal component must exist');

  const code = fs.readFileSync(authModalPath, 'utf8');

  // Imports and renders AuthVideoShowcase
  assert.ok(code.includes("import AuthVideoShowcase from './AuthVideoShowcase.jsx'"), 'AuthModal must import AuthVideoShowcase');
  assert.ok(code.includes('<AuthVideoShowcase'), 'AuthModal must render AuthVideoShowcase');

  // Modal controls
  assert.ok(code.includes('Close modal') || code.includes('onClose'), 'Must include close trigger');
  assert.ok(code.includes('Create an account') && code.includes('Welcome back'), 'Must support both signup and login modes');
  assert.ok(code.includes('Sign up with Google') && code.includes('Continue with Google'), 'Must support Google OAuth buttons');
});

test('Auth Redesign: Responsive styles in index.css for mobile and tablet', () => {
  const cssPath = path.join(__dirname, '../src/index.css');
  const css = fs.readFileSync(cssPath, 'utf8');

  assert.ok(css.includes('.auth-independent-logo'), 'CSS must define .auth-independent-logo');
  assert.ok(css.includes('.auth-floating-wrapper'), 'CSS must define .auth-floating-wrapper');
  assert.ok(css.includes('.auth-floating-panel'), 'CSS must define .auth-floating-panel');
  assert.ok(css.includes('@media (max-width: 1024px)'), 'CSS must include tablet media query');
  assert.ok(css.includes('@media (max-width: 640px)'), 'CSS must include mobile media query');
});

test('Google Auth: UI button triggers friendly coming soon notice while authentication uses email/password', () => {
  const screenCode = fs.readFileSync(path.join(__dirname, '../src/components/v2/AuthScreen.jsx'), 'utf8');
  assert.ok(screenCode.includes('auth-btn-google'), 'AuthScreen must render Google button');
  assert.ok(screenCode.includes('Continue with Google'), 'AuthScreen must display Continue with Google');
  assert.ok(screenCode.includes('googleNotice'), 'AuthScreen must manage googleNotice state');
  assert.ok(screenCode.includes('Google sign-in is coming soon!'), 'AuthScreen must display coming soon notice');
  assert.ok(!screenCode.includes('GoogleAuthModal'), 'AuthScreen must not import or render GoogleAuthModal');

  const modalCode = fs.readFileSync(path.join(__dirname, '../src/components/v2/AuthModal.jsx'), 'utf8');
  assert.ok(modalCode.includes('auth-btn-google') || modalCode.includes('Continue with Google'), 'AuthModal must render Google button');
  assert.ok(modalCode.includes('googleNotice'), 'AuthModal must manage googleNotice state');
  assert.ok(modalCode.includes('Google sign-in is coming soon!'), 'AuthModal must display coming soon notice');
  assert.ok(!modalCode.includes('GoogleAuthModal'), 'AuthModal must not import or render GoogleAuthModal');
});

test('Auth Legal Documents: AuthScreen and AuthModal feature interactive Terms of Service and Privacy Policy links and render LegalDocumentModal', () => {
  const legalModalPath = path.join(__dirname, '../src/components/v2/LegalDocumentModal.jsx');
  assert.ok(fs.existsSync(legalModalPath), 'LegalDocumentModal.jsx must exist');

  const legalCode = fs.readFileSync(legalModalPath, 'utf8');
  assert.ok(legalCode.includes('CleverCuts Terms of Service'), 'Must contain Terms of Service heading');
  assert.ok(legalCode.includes('CleverCuts Privacy Policy'), 'Must contain Privacy Policy heading');
  assert.ok(legalCode.includes('Commercial Ownership Guarantee'), 'Must guarantee commercial rights to user videos');
  assert.ok(legalCode.includes('Acceptable Use Policy'), 'Must define acceptable use');
  assert.ok(legalCode.includes('Information We Collect'), 'Must define data collection terms');
  assert.ok(legalCode.includes('Permanent Erasure') || legalCode.includes('Account Deletion'), 'Must detail deletion and erasure rights');
  assert.ok(legalCode.includes('window.print()'), 'Must provide print functionality');

  const screenCode = fs.readFileSync(path.join(__dirname, '../src/components/v2/AuthScreen.jsx'), 'utf8');
  assert.ok(screenCode.includes("import LegalDocumentModal from './LegalDocumentModal.jsx'"), 'AuthScreen must import LegalDocumentModal');
  assert.ok(screenCode.includes('setLegalModalOpen(true)'), 'AuthScreen must trigger legal modal open');
  assert.ok(screenCode.includes("<LegalDocumentModal"), 'AuthScreen must render LegalDocumentModal');

  const modalCode = fs.readFileSync(path.join(__dirname, '../src/components/v2/AuthModal.jsx'), 'utf8');
  assert.ok(modalCode.includes("import LegalDocumentModal from './LegalDocumentModal.jsx'"), 'AuthModal must import LegalDocumentModal');
  assert.ok(modalCode.includes('setLegalModalOpen(true)'), 'AuthModal must trigger legal modal open');
  assert.ok(modalCode.includes("<LegalDocumentModal"), 'AuthModal must render LegalDocumentModal');
});
