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


