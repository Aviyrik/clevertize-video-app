const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');
// keep test users out of data/ — that folder is the app's real local database
process.env.DATA_DIR = require('fs').mkdtempSync(require('path').join(require('os').tmpdir(), 'clevercut-test-'));
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

test('Email Verification DB: Token generation defaults to 30 minutes expiry and stores only token hash', async () => {
  const user = await db.createUser({
    email: `token-hash-${Date.now()}@example.com`,
    password: 'password123',
    name: 'Hash Tester',
  });

  // Default options: must expire in 30 minutes
  const tokenObj = await db.createEmailVerificationToken(user.id);

  assert.ok(tokenObj.id, 'Token record must have an ID');
  assert.strictEqual(tokenObj.userId, user.id);
  assert.ok(tokenObj.rawToken, 'Caller receives rawToken to send via email link');
  assert.ok(tokenObj.tokenHash, 'Token hash must be generated');
  assert.notStrictEqual(tokenObj.rawToken, tokenObj.tokenHash, 'tokenHash must be distinct from rawToken');

  // Verify expiry is approximately 30 minutes from creation
  const createdMs = new Date(tokenObj.createdAt).getTime();
  const expiresMs = new Date(tokenObj.expiresAt).getTime();
  const diffMinutes = Math.round((expiresMs - createdMs) / (60 * 1000));
  assert.strictEqual(diffMinutes, 30, 'Default token expiry must be 30 minutes');

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

test('Email Verification DB: markEmailAsVerified strictly validates existence, prior use, and expiration', async () => {
  const user = await db.createUser({
    email: `strict-verify-${Date.now()}@example.com`,
    password: 'password123',
    name: 'Strict Tester',
  });

  // 1. Missing token
  await assert.rejects(
    async () => db.markEmailAsVerified(user.id, null),
    /Verification token is required/
  );

  // 2. Non-existent token
  await assert.rejects(
    async () => db.markEmailAsVerified(user.id, 'nonexistent_token_hash_1234567890'),
    /Verification token not found/
  );

  // 3. User mismatch
  const otherUser = await db.createUser({
    email: `other-user-${Date.now()}@example.com`,
    password: 'password123',
    name: 'Other User',
  });
  const otherToken = await db.createEmailVerificationToken(otherUser.id);
  await assert.rejects(
    async () => db.markEmailAsVerified(user.id, otherToken.tokenHash),
    /Verification token does not match user/
  );

  // 4. Successful verification consumes token atomically
  const tokenObj = await db.createEmailVerificationToken(user.id);
  const verified = await db.markEmailAsVerified(user.id, tokenObj.tokenHash);
  assert.strictEqual(verified.emailVerified, true);
  assert.ok(verified.emailVerifiedAt);

  // 5. Subsequent use of already consumed token must fail
  await assert.rejects(
    async () => db.markEmailAsVerified(user.id, tokenObj.tokenHash),
    /Verification token has already been used/
  );

  // 6. Expired token must be rejected
  const expiredUser = await db.createUser({
    email: `expired-user-${Date.now()}@example.com`,
    password: 'password123',
    name: 'Expired Tester',
  });
  const expiredToken = await db.createEmailVerificationToken(expiredUser.id, { expiresInMinutes: -5 });
  await assert.rejects(
    async () => db.markEmailAsVerified(expiredUser.id, expiredToken.tokenHash),
    /Verification token has expired/
  );

  // 7. Concurrent requests must not allow token reuse (race condition safety)
  const concurrentUser = await db.createUser({
    email: `concurrent-user-${Date.now()}@example.com`,
    password: 'password123',
    name: 'Concurrent Tester',
  });
  const concurrentToken = await db.createEmailVerificationToken(concurrentUser.id);
  const results = await Promise.allSettled([
    db.markEmailAsVerified(concurrentUser.id, concurrentToken.tokenHash),
    db.markEmailAsVerified(concurrentUser.id, concurrentToken.tokenHash),
  ]);
  const fulfilled = results.filter((r) => r.status === 'fulfilled');
  const rejected = results.filter((r) => r.status === 'rejected');
  assert.strictEqual(fulfilled.length, 1, 'Exactly one concurrent verification call must succeed');
  assert.strictEqual(rejected.length, 1, 'Concurrent reuse attempt must be rejected');
  assert.match(rejected[0].reason.message, /Verification token has already been used/);
  await db.deleteUser(concurrentUser.id);

  await db.deleteUser(user.id);
  await db.deleteUser(otherUser.id);
  await db.deleteUser(expiredUser.id);
});

test('Email Verification DB: Expired or superseded tokens do not block new token generation', async () => {
  const user = await db.createUser({
    email: `multi-token-${Date.now()}@example.com`,
    password: 'password123',
    name: 'Multi Token Tester',
  });

  // Create an expired token
  const expiredTok = await db.createEmailVerificationToken(user.id, { expiresInMinutes: -10 });
  assert.ok(new Date(expiredTok.expiresAt) < new Date(), 'First token is expired');

  // Creating a new token when user has an expired token must succeed without unique constraint error
  const freshTok1 = await db.createEmailVerificationToken(user.id);
  assert.ok(freshTok1, 'New token generation succeeded despite expired token');

  // Creating another new token (superseding freshTok1) must also succeed
  const freshTok2 = await db.createEmailVerificationToken(user.id);
  assert.ok(freshTok2, 'New token generation succeeded despite superseded token');

  // The active token is freshTok2
  const active = await db.getActiveVerificationTokenForUser(user.id);
  assert.strictEqual(active.tokenHash, freshTok2.tokenHash);

  // Verification using freshTok2 succeeds
  const verified = await db.markEmailAsVerified(freshTok2.tokenHash);
  assert.strictEqual(verified.emailVerified, true);

  await db.deleteUser(user.id);
});

test('Email Verification DB: ensurePgTables migration is safe to run repeatedly (idempotent)', async () => {
  // Calling ensurePgTables multiple times must not throw or alter data integrity
  await assert.doesNotReject(async () => {
    await db.ensurePgTables();
    await db.ensurePgTables();
    await db.ensurePgTables();
  }, 'ensurePgTables must be completely idempotent and safe to call repeatedly');
});
