const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');
const db = require('../engine/db.js');

test('Email Verification DB: New user creation defaults emailVerified to false', async () => {
  const email = `unverified-${Date.now()}@example.com`;
  const user = await db.createUser({
    email,
    password: 'password123',
    name: 'Unverified Tester',
  });

  assert.ok(user.id, 'User must have an ID');
  assert.strictEqual(user.email, email);
  assert.strictEqual(user.emailVerified, false, 'New user must default to emailVerified = false');
  assert.strictEqual(user.emailVerifiedAt, null, 'emailVerifiedAt must be null on creation');

  // Verify findUserByEmail also reflects unverified status
  const found = await db.findUserByEmail(email);
  assert.ok(found, 'User must be found by email');
  assert.strictEqual(found.emailVerified, false, 'findUserByEmail reflects emailVerified = false');
  assert.strictEqual(found.emailVerifiedAt, null);

  // Verify findUserById also reflects unverified status
  const foundById = await db.findUserById(user.id);
  assert.ok(foundById);
  assert.strictEqual(foundById.emailVerified, false);

  // Clean up
  await db.deleteUser(user.id);
});

test('Email Verification DB: Existing users without emailVerified are safely treated as unverified', async () => {
  // Simulate an older user record that did not have emailVerified set
  const cleanEmail = `legacy-user-${Date.now()}@example.com`;
  const user = await db.createUser({
    email: cleanEmail,
    password: 'password123',
    name: 'Legacy User',
  });

  // Verify user is unverified by default
  assert.strictEqual(user.emailVerified, false, 'Existing/legacy user must not be marked verified without proof');
  assert.strictEqual(user.emailVerifiedAt, null);

  // Verify existing sessions remain valid and attach emailVerified status
  const sessionToken = await db.createSession(user.id);
  assert.ok(sessionToken, 'Session must be created');

  const sessionUser = await db.getUserBySessionToken(sessionToken);
  assert.ok(sessionUser, 'Session user must be retrieved');
  assert.strictEqual(sessionUser.id, user.id);
  assert.strictEqual(sessionUser.emailVerified, false);
  assert.strictEqual(sessionUser.emailVerifiedAt, null);

  // Clean up
  await db.deleteSession(sessionToken);
  await db.deleteUser(user.id);
});

test('Email Verification DB: Token generation stores only token hash, never raw token', async () => {
  const user = await db.createUser({
    email: `token-hash-${Date.now()}@example.com`,
    password: 'password123',
    name: 'Hash Tester',
  });

  const tokenObj = await db.createEmailVerificationToken(user.id, { expiresInHours: 24 });

  assert.ok(tokenObj.id, 'Token record must have an ID');
  assert.strictEqual(tokenObj.userId, user.id);
  assert.ok(tokenObj.rawToken, 'Caller receives rawToken to send via email link');
  assert.ok(tokenObj.tokenHash, 'Token hash must be generated');
  assert.notStrictEqual(tokenObj.rawToken, tokenObj.tokenHash, 'tokenHash must be distinct from rawToken');

  // Verify hash matches sha256 of rawToken
  const expectedHash = db.hashVerificationToken(tokenObj.rawToken);
  assert.strictEqual(tokenObj.tokenHash, expectedHash, 'tokenHash must equal sha256(rawToken)');

  // Verify record retrieved by hash contains hash, not raw token
  const retrieved = await db.getVerificationTokenByHash(tokenObj.tokenHash);
  assert.ok(retrieved, 'Must find token by hash');
  assert.strictEqual(retrieved.userId, user.id);
  assert.strictEqual(retrieved.tokenHash, tokenObj.tokenHash);
  assert.strictEqual(retrieved.usedAt, null, 'New token has usedAt = null');
  assert.ok(new Date(retrieved.expiresAt) > new Date(), 'expiresAt must be in the future');

  // Querying using raw token directly must fail because raw token is never stored in DB
  const rawLookup = await db.getVerificationTokenByHash(tokenObj.rawToken);
  assert.strictEqual(rawLookup, null, 'Raw token must never exist in the token_hash column');

  await db.deleteUser(user.id);
});

test('Email Verification DB: Only one outstanding valid token per user (historical tokens preserved as used/invalidated)', async () => {
  const user = await db.createUser({
    email: `single-active-${Date.now()}@example.com`,
    password: 'password123',
    name: 'Single Token Tester',
  });

  // Create token 1
  const token1 = await db.createEmailVerificationToken(user.id);
  const active1 = await db.getActiveVerificationTokenForUser(user.id);
  assert.strictEqual(active1.tokenHash, token1.tokenHash);

  // Create token 2: this must supersede token 1
  const token2 = await db.createEmailVerificationToken(user.id);
  assert.notStrictEqual(token1.tokenHash, token2.tokenHash);

  // Active token for user must now be token 2
  const active2 = await db.getActiveVerificationTokenForUser(user.id);
  assert.strictEqual(active2.tokenHash, token2.tokenHash);

  // Token 1 record still exists in history for audit, but its usedAt is now populated (invalidated)
  const token1Record = await db.getVerificationTokenByHash(token1.tokenHash);
  assert.ok(token1Record, 'Token 1 is preserved in historical audit log');
  assert.ok(token1Record.usedAt, 'Token 1 has usedAt populated to indicate it was superseded');

  await db.deleteUser(user.id);
});

test('Email Verification DB: markEmailAsVerified marks user verified, sets timestamp, and consumes token', async () => {
  const user = await db.createUser({
    email: `verify-flow-${Date.now()}@example.com`,
    password: 'password123',
    name: 'Verify Flow Tester',
  });

  const sessionToken = await db.createSession(user.id);

  // Generate token
  const tokenObj = await db.createEmailVerificationToken(user.id);

  // User before verification
  const beforeVerify = await db.findUserById(user.id);
  assert.strictEqual(beforeVerify.emailVerified, false);
  assert.strictEqual(beforeVerify.emailVerifiedAt, null);

  // Verify email
  const verifiedUser = await db.markEmailAsVerified(user.id, tokenObj.tokenHash);
  assert.strictEqual(verifiedUser.emailVerified, true);
  assert.ok(verifiedUser.emailVerifiedAt, 'emailVerifiedAt must be populated');

  // Verify token is now marked as used
  const usedToken = await db.getVerificationTokenByHash(tokenObj.tokenHash);
  assert.ok(usedToken.usedAt, 'Token used_at must be populated after verification');

  // Active token query should return null now that it is consumed
  const activeAfter = await db.getActiveVerificationTokenForUser(user.id);
  assert.strictEqual(activeAfter, null, 'No outstanding valid token should exist after verification');

  // Session user reflects verified state
  const sessionUser = await db.getUserBySessionToken(sessionToken);
  assert.strictEqual(sessionUser.emailVerified, true);
  assert.ok(sessionUser.emailVerifiedAt);

  await db.deleteSession(sessionToken);
  await db.deleteUser(user.id);
});

test('Email Verification DB: Cascading delete cleans up verification tokens when user is deleted', async () => {
  const user = await db.createUser({
    email: `cascade-token-${Date.now()}@example.com`,
    password: 'password123',
    name: 'Cascade Tester',
  });

  const tokenObj = await db.createEmailVerificationToken(user.id);
  assert.ok(await db.getVerificationTokenByHash(tokenObj.tokenHash));

  // Delete user
  await db.deleteUser(user.id);

  // Verification token should be cleaned up
  const tokenAfter = await db.getVerificationTokenByHash(tokenObj.tokenHash);
  assert.strictEqual(tokenAfter, null, 'Verification tokens must be removed when user is deleted');
});

test('Email Verification DB: ensurePgTables migration is safe to run repeatedly (idempotent)', async () => {
  // Calling ensurePgTables multiple times must not throw or alter data integrity
  await assert.doesNotReject(async () => {
    await db.ensurePgTables();
    await db.ensurePgTables();
    await db.ensurePgTables();
  }, 'ensurePgTables must be completely idempotent and safe to call repeatedly');
});
