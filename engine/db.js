// Server-side persistent storage for users, sessions, businesses, and projects
// Supports PostgreSQL (via process.env.DATABASE_URL) with automatic table creation,
// and gracefully falls back to atomic local JSON files when DATABASE_URL is not set.

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, '..', 'data');

// ----------------------------------------------------
// POSTGRESQL POOL & TABLE INITIALIZATION
// ----------------------------------------------------

let pgPool = null;
let tablesInitialized = false;

function isPostgresConfigured() {
  return Boolean(process.env.DATABASE_URL && process.env.DATABASE_URL.trim());
}

function getPgPool() {
  if (!isPostgresConfigured()) return null;
  if (!pgPool) {
    const { Pool } = require('pg');
    const dbUrl = process.env.DATABASE_URL.trim();
    const isLocalhost = /localhost|127\.0\.0\.1/.test(dbUrl);
    pgPool = new Pool({
      connectionString: dbUrl,
      ssl: isLocalhost ? false : { rejectUnauthorized: false },
    });
    pgPool.on('error', (err) => {
      console.error('[pg-pool] Unexpected error on idle PostgreSQL client:', err.message);
    });
  }
  return pgPool;
}

async function ensurePgTables() {
  const pool = getPgPool();
  if (!pool || tablesInitialized) return;

  const client = await pool.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id VARCHAR(255) PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        name VARCHAR(255),
        avatar TEXT,
        password_hash TEXT NOT NULL,
        salt TEXT NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );

      ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar TEXT;

      CREATE TABLE IF NOT EXISTS sessions (
        token VARCHAR(255) PRIMARY KEY,
        user_id VARCHAR(255) REFERENCES users(id) ON DELETE CASCADE,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        expires_at TIMESTAMPTZ NOT NULL
      );

      CREATE TABLE IF NOT EXISTS businesses (
        id VARCHAR(255) PRIMARY KEY,
        user_id VARCHAR(255) REFERENCES users(id) ON DELETE CASCADE,
        business_name TEXT NOT NULL,
        business_type TEXT,
        town TEXT,
        target_audience TEXT,
        website_url TEXT,
        logo TEXT,
        product_images JSONB DEFAULT '[]'::jsonb,
        brand_tone TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS projects (
        id VARCHAR(255) PRIMARY KEY,
        user_id VARCHAR(255) REFERENCES users(id) ON DELETE CASCADE,
        business_id VARCHAR(255),
        title TEXT NOT NULL,
        business_name TEXT,
        business_type TEXT,
        town TEXT,
        brief TEXT,
        entry_point TEXT,
        current_stage TEXT,
        completed_stages JSONB DEFAULT '[]'::jsonb,
        explicit_choices JSONB DEFAULT '{}'::jsonb,
        creative_dna JSONB DEFAULT '{}'::jsonb,
        scenes JSONB DEFAULT '[]'::jsonb,
        character1 TEXT,
        character2 TEXT,
        setting TEXT,
        quality_gate_passed BOOLEAN DEFAULT FALSE,
        status TEXT,
        video_url TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
      CREATE INDEX IF NOT EXISTS idx_sessions_token ON sessions(token);
      CREATE INDEX IF NOT EXISTS idx_businesses_user ON businesses(user_id);
      CREATE INDEX IF NOT EXISTS idx_projects_user ON projects(user_id);

      CREATE TABLE IF NOT EXISTS video_runs (
        run_id VARCHAR(255) PRIMARY KEY,
        user_id VARCHAR(255) REFERENCES users(id) ON DELETE CASCADE,
        status VARCHAR(64) DEFAULT 'PENDING',
        video_url TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_video_runs_user ON video_runs(user_id);

      -- Enable Row Level Security (RLS) on all tables to secure Supabase Data API
      ALTER TABLE users ENABLE ROW LEVEL SECURITY;
      ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
      ALTER TABLE businesses ENABLE ROW LEVEL SECURITY;
      ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
      ALTER TABLE video_runs ENABLE ROW LEVEL SECURITY;

      -- Revoke public PostgREST API access from anon/authenticated roles if running on Supabase
      DO $$
      BEGIN
        IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN
          REVOKE ALL ON TABLE users, sessions, businesses, projects, video_runs FROM anon;
        END IF;
        IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
          REVOKE ALL ON TABLE users, sessions, businesses, projects, video_runs FROM authenticated;
        END IF;
      END $$;
    `);
    tablesInitialized = true;
    console.log('[db] PostgreSQL database and tables verified successfully.');
  } catch (err) {
    console.error('[db] Failed to initialize PostgreSQL tables:', err.message);
    throw err;
  } finally {
    client.release();
  }
}

// ----------------------------------------------------
// FILE-BASED STORAGE HELPERS (FALLBACK)
// ----------------------------------------------------

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

function getFilePath(filename) {
  ensureDataDir();
  return path.join(DATA_DIR, filename);
}

function readJsonFile(filename, defaultValue) {
  const filePath = getFilePath(filename);
  try {
    if (!fs.existsSync(filePath)) {
      return defaultValue;
    }
    const raw = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(raw);
  } catch (err) {
    console.warn(`[db] Error reading ${filename}, returning default:`, err.message);
    return defaultValue;
  }
}

function writeJsonFile(filename, data) {
  const filePath = getFilePath(filename);
  ensureDataDir();
  const tempPath = `${filePath}.tmp.${Date.now()}`;
  fs.writeFileSync(tempPath, JSON.stringify(data, null, 2), 'utf8');
  fs.renameSync(tempPath, filePath);
}

// ----------------------------------------------------
// PASSWORD HASHING
// ----------------------------------------------------

function hashPassword(password, salt = crypto.randomBytes(16).toString('hex')) {
  const hash = crypto.scryptSync(password, salt, 64).toString('hex');
  return { hash, salt };
}

function verifyPassword(password, hash, salt) {
  const testHash = crypto.scryptSync(password, salt, 64).toString('hex');
  return crypto.timingSafeEqual(Buffer.from(testHash, 'hex'), Buffer.from(hash, 'hex'));
}

// Helper to map DB row to business object
function mapBusinessRow(row) {
  if (!row) return null;
  return {
    id: row.id,
    userId: row.user_id,
    businessName: row.business_name,
    name: row.business_name,
    businessType: row.business_type,
    category: row.business_type,
    town: row.town,
    targetAudience: row.target_audience,
    websiteUrl: row.website_url,
    logo: row.logo,
    productImages: typeof row.product_images === 'string' ? JSON.parse(row.product_images) : (row.product_images || []),
    brandTone: row.brand_tone,
    createdAt: row.created_at instanceof Date ? row.created_at.toISOString() : row.created_at,
    updatedAt: row.updated_at instanceof Date ? row.updated_at.toISOString() : row.updated_at,
  };
}

// Helper to map DB row to project object
function mapProjectRow(row) {
  if (!row) return null;
  return {
    id: row.id,
    userId: row.user_id,
    businessId: row.business_id,
    title: row.title,
    businessName: row.business_name,
    businessType: row.business_type,
    town: row.town,
    brief: row.brief,
    entryPoint: row.entry_point,
    currentStage: row.current_stage,
    completedStages: typeof row.completed_stages === 'string' ? JSON.parse(row.completed_stages) : (row.completed_stages || []),
    explicitChoices: typeof row.explicit_choices === 'string' ? JSON.parse(row.explicit_choices) : (row.explicit_choices || {}),
    creativeDNA: typeof row.creative_dna === 'string' ? JSON.parse(row.creative_dna) : (row.creative_dna || {}),
    shotSpec: row.shot_spec || (row.creative_dna && (typeof row.creative_dna === 'string' ? JSON.parse(row.creative_dna) : row.creative_dna).shotSpec) || null,
    stages: (row.creative_dna && (typeof row.creative_dna === 'string' ? JSON.parse(row.creative_dna) : row.creative_dna).stages) || null,
    scenes: typeof row.scenes === 'string' ? JSON.parse(row.scenes) : (row.scenes || []),
    character1: row.character1 || '',
    character2: row.character2 || '',
    setting: row.setting || '',
    qualityGatePassed: Boolean(row.quality_gate_passed),
    status: row.status,
    videoUrl: row.video_url,
    createdAt: row.created_at instanceof Date ? row.created_at.toISOString() : row.created_at,
    updatedAt: row.updated_at instanceof Date ? row.updated_at.toISOString() : row.updated_at,
  };
}

// ----------------------------------------------------
// USER & AUTH METHODS
// ----------------------------------------------------

async function findUserByEmail(email) {
  if (!email) return null;
  const cleanEmail = String(email).trim().toLowerCase();

  const pool = getPgPool();
  if (pool) {
    await ensurePgTables();
    const res = await pool.query(
      'SELECT id, email, name, avatar, password_hash, salt, created_at FROM users WHERE LOWER(email) = $1',
      [cleanEmail]
    );
    if (!res.rows.length) return null;
    const r = res.rows[0];
    return {
      id: r.id,
      email: r.email,
      name: r.name,
      avatar: r.avatar || null,
      passwordHash: r.password_hash,
      salt: r.salt,
      createdAt: r.created_at instanceof Date ? r.created_at.toISOString() : r.created_at,
    };
  }

  const users = readJsonFile('users.json', []);
  const u = users.find((x) => x.email.toLowerCase() === cleanEmail);
  if (!u) return null;
  return {
    ...u,
    avatar: u.avatar || null,
  };
}

async function findUserById(userId) {
  if (!userId) return null;

  const pool = getPgPool();
  if (pool) {
    await ensurePgTables();
    const res = await pool.query(
      'SELECT id, email, name, avatar, password_hash, salt, created_at FROM users WHERE id = $1',
      [userId]
    );
    if (!res.rows.length) return null;
    const r = res.rows[0];
    return {
      id: r.id,
      email: r.email,
      name: r.name,
      avatar: r.avatar || null,
      passwordHash: r.password_hash,
      salt: r.salt,
      createdAt: r.created_at instanceof Date ? r.created_at.toISOString() : r.created_at,
    };
  }

  const users = readJsonFile('users.json', []);
  const u = users.find((x) => x.id === userId);
  if (!u) return null;
  return {
    ...u,
    avatar: u.avatar || null,
  };
}

async function createUser({ email, password, name = '', avatar = null }) {
  const cleanEmail = String(email || '').trim().toLowerCase();
  if (!cleanEmail || !cleanEmail.includes('@')) {
    throw new Error('Please enter a valid email address.');
  }
  if (!password || String(password).length < 6) {
    throw new Error('Password must be at least 6 characters.');
  }

  const existing = await findUserByEmail(cleanEmail);
  if (existing) {
    throw new Error('An account with this email already exists.');
  }

  const { hash, salt } = hashPassword(String(password));
  const id = `usr_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
  const userName = String(name || cleanEmail.split('@')[0]).trim();
  const createdAt = new Date().toISOString();

  const pool = getPgPool();
  if (pool) {
    await ensurePgTables();
    await pool.query(
      'INSERT INTO users (id, email, name, avatar, password_hash, salt, created_at) VALUES ($1, $2, $3, $4, $5, $6, $7)',
      [id, cleanEmail, userName, avatar || null, hash, salt, createdAt]
    );
    return { id, email: cleanEmail, name: userName, avatar: avatar || null, createdAt };
  }

  const user = {
    id,
    email: cleanEmail,
    name: userName,
    avatar: avatar || null,
    passwordHash: hash,
    salt,
    createdAt,
  };

  const users = readJsonFile('users.json', []);
  users.push(user);
  writeJsonFile('users.json', users);

  return {
    id: user.id,
    email: user.email,
    name: user.name,
    avatar: user.avatar || null,
    createdAt: user.createdAt,
  };
}

async function authenticateUser({ email, password }) {
  const cleanEmail = String(email || '').trim().toLowerCase();
  const user = await findUserByEmail(cleanEmail);
  if (!user) {
    throw new Error('No account found with this email.');
  }

  const isValid = verifyPassword(String(password || ''), user.passwordHash, user.salt);
  if (!isValid) {
    throw new Error('Incorrect password. Please try again.');
  }

  return {
    id: user.id,
    email: user.email,
    name: user.name,
    avatar: user.avatar || null,
    createdAt: user.createdAt,
  };
}

async function deleteUser(userId) {
  if (!userId) return false;

  const pool = getPgPool();
  if (pool) {
    await ensurePgTables();
    // Tables have ON DELETE CASCADE so foreign keys are automatically deleted
    const res = await pool.query('DELETE FROM users WHERE id = $1', [userId]);
    return (res.rowCount || 0) > 0;
  }

  // Atomic JSON file-store cascading delete
  const sessions = readJsonFile('sessions.json', []);
  writeJsonFile('sessions.json', sessions.filter((s) => s.userId !== userId));

  const businesses = readJsonFile('businesses.json', []);
  writeJsonFile('businesses.json', businesses.filter((b) => b.userId !== userId));

  const projects = readJsonFile('projects.json', []);
  writeJsonFile('projects.json', projects.filter((p) => p.userId !== userId));

  const runs = readJsonFile('video_runs.json', []);
  writeJsonFile('video_runs.json', runs.filter((r) => r.userId !== userId));

  const users = readJsonFile('users.json', []);
  const filteredUsers = users.filter((u) => u.id !== userId);
  const changed = filteredUsers.length !== users.length;
  if (changed) {
    writeJsonFile('users.json', filteredUsers);
  }
  return changed;
}

async function updateUserProfile(userId, { name, avatar }) {
  if (!userId) throw new Error('User ID is required.');

  const pool = getPgPool();
  if (pool) {
    await ensurePgTables();
    await pool.query(
      `UPDATE users SET
         name = CASE WHEN $2::text IS NOT NULL THEN $2 ELSE name END,
         avatar = CASE WHEN $3::text IS NOT NULL THEN $3 ELSE avatar END
       WHERE id = $1`,
      [userId, name !== undefined ? name : null, avatar !== undefined ? avatar : null]
    );
    return findUserById(userId);
  }

  const users = readJsonFile('users.json', []);
  const idx = users.findIndex((u) => u.id === userId);
  if (idx < 0) throw new Error('User not found.');
  if (name !== undefined) users[idx].name = name;
  if (avatar !== undefined) users[idx].avatar = avatar;
  writeJsonFile('users.json', users);
  const u = users[idx];
  return {
    id: u.id,
    email: u.email,
    name: u.name,
    avatar: u.avatar || null,
    createdAt: u.createdAt,
  };
}

// ----------------------------------------------------
// SESSION METHODS
// ----------------------------------------------------

async function createSession(userId) {
  const token = crypto.randomBytes(32).toString('hex');
  const now = new Date();
  const expiresAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 days

  const pool = getPgPool();
  if (pool) {
    await ensurePgTables();
    await pool.query('DELETE FROM sessions WHERE expires_at <= NOW()');
    await pool.query(
      'INSERT INTO sessions (token, user_id, created_at, expires_at) VALUES ($1, $2, $3, $4)',
      [token, userId, now.toISOString(), expiresAt.toISOString()]
    );
    return token;
  }

  const session = {
    token,
    userId,
    createdAt: now.toISOString(),
    expiresAt: expiresAt.toISOString(),
  };

  const sessions = readJsonFile('sessions.json', []);
  const nowDate = now.toISOString();
  const active = sessions.filter((s) => s.expiresAt > nowDate);
  active.push(session);
  writeJsonFile('sessions.json', active);

  return token;
}

async function getUserBySessionToken(token) {
  if (!token) return null;

  const pool = getPgPool();
  if (pool) {
    await ensurePgTables();
    const res = await pool.query(
      `SELECT u.id, u.email, u.name, u.avatar, u.created_at
       FROM sessions s
       JOIN users u ON s.user_id = u.id
       WHERE s.token = $1 AND s.expires_at > NOW()`,
      [token]
    );
    if (!res.rows.length) return null;
    const r = res.rows[0];
    return {
      id: r.id,
      email: r.email,
      name: r.name,
      avatar: r.avatar || null,
      createdAt: r.created_at instanceof Date ? r.created_at.toISOString() : r.created_at,
    };
  }

  const sessions = readJsonFile('sessions.json', []);
  const now = new Date().toISOString();
  const session = sessions.find((s) => s.token === token && s.expiresAt > now);
  if (!session) return null;

  const user = await findUserById(session.userId);
  if (!user) return null;

  return {
    id: user.id,
    email: user.email,
    name: user.name,
    avatar: user.avatar || null,
    createdAt: user.createdAt,
  };
}

async function deleteSession(token) {
  if (!token) return;

  const pool = getPgPool();
  if (pool) {
    await ensurePgTables();
    await pool.query('DELETE FROM sessions WHERE token = $1', [token]);
    return;
  }

  const sessions = readJsonFile('sessions.json', []);
  const filtered = sessions.filter((s) => s.token !== token);
  writeJsonFile('sessions.json', filtered);
}

// ----------------------------------------------------
// BUSINESS METHODS
// ----------------------------------------------------

async function getBusinessesForUser(userId) {
  if (!userId) return [];

  const pool = getPgPool();
  if (pool) {
    await ensurePgTables();
    const res = await pool.query(
      'SELECT * FROM businesses WHERE user_id = $1 ORDER BY updated_at DESC',
      [userId]
    );
    return res.rows.map(mapBusinessRow);
  }

  const businesses = readJsonFile('businesses.json', []);
  return businesses
    .filter((b) => b.userId === userId)
    .map((b) => ({
      ...b,
      businessName: b.businessName || b.name,
      name: b.name || b.businessName,
      businessType: b.businessType || b.category || 'Retail Store',
      category: b.category || b.businessType || 'Retail Store',
    }));
}

async function getBusinessById(businessId, userId) {
  if (!businessId || !userId) return null;

  const pool = getPgPool();
  if (pool) {
    await ensurePgTables();
    const res = await pool.query(
      'SELECT * FROM businesses WHERE id = $1 AND user_id = $2',
      [businessId, userId]
    );
    return res.rows.length ? mapBusinessRow(res.rows[0]) : null;
  }

  const businesses = readJsonFile('businesses.json', []);
  const found = businesses.find((b) => b.id === businessId && b.userId === userId);
  if (!found) return null;
  return {
    ...found,
    businessName: found.businessName || found.name,
    name: found.name || found.businessName,
    businessType: found.businessType || found.category || 'Retail Store',
    category: found.category || found.businessType || 'Retail Store',
  };
}

async function saveBusiness(businessData, userId) {
  if (!userId) throw new Error('Authentication required to save business.');
  const bData = businessData || {};
  const id = bData.id;
  const businessName = bData.businessName || bData.name;
  const businessType = bData.businessType || bData.category || 'Retail Store';
  const town = bData.town;
  const targetAudience = bData.targetAudience;
  const websiteUrl = bData.websiteUrl;
  const logo = bData.logo || bData.brandLogo;
  const productImages = bData.productImages;
  const brandTone = bData.brandTone;

  if (!businessName || !String(businessName).trim()) {
    throw new Error('Business name is required.');
  }

  const now = new Date().toISOString();
  const businessId = id || `biz_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
  const bName = String(businessName).trim();
  const bType = String(businessType || 'Retail Store').trim();
  const bTown = String(town || '').trim();
  const bAudience = String(targetAudience || '').trim();
  const bUrl = String(websiteUrl || '').trim();
  const bLogo = logo || null;
  const bImages = Array.isArray(productImages) ? productImages : [];
  const bTone = String(brandTone || 'Relatable & Trustworthy').trim();

  const pool = getPgPool();
  if (pool) {
    await ensurePgTables();
    if (id) {
      const ownerCheck = await pool.query('SELECT user_id FROM businesses WHERE id = $1', [id]);
      if (ownerCheck.rows.length && ownerCheck.rows[0].user_id !== userId) {
        throw Object.assign(new Error('Business ID belongs to another user.'), { status: 403 });
      }
    }
    const res = await pool.query(
      `INSERT INTO businesses (
        id, user_id, business_name, business_type, town, target_audience, website_url, logo, product_images, brand_tone, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $11)
      ON CONFLICT (id) DO UPDATE SET
        business_name = EXCLUDED.business_name,
        business_type = EXCLUDED.business_type,
        town = EXCLUDED.town,
        target_audience = EXCLUDED.target_audience,
        website_url = EXCLUDED.website_url,
        logo = EXCLUDED.logo,
        product_images = EXCLUDED.product_images,
        brand_tone = EXCLUDED.brand_tone,
        updated_at = EXCLUDED.updated_at
      WHERE businesses.user_id = EXCLUDED.user_id
      RETURNING *`,
      [businessId, userId, bName, bType, bTown, bAudience, bUrl, bLogo, JSON.stringify(bImages), bTone, now]
    );
    return mapBusinessRow(res.rows[0]);
  }

  const businesses = readJsonFile('businesses.json', []);
  let existingIndex = -1;
  if (id) {
    existingIndex = businesses.findIndex((b) => b.id === id && b.userId === userId);
    if (
      existingIndex < 0 &&
      businesses.some((b) => b.id === id && b.userId !== userId)
    ) {
      throw Object.assign(new Error('Business ID belongs to another user.'), { status: 403 });
    }
  }

  const record = {
    id: existingIndex >= 0 ? businesses[existingIndex].id : businessId,
    userId,
    businessName: bName,
    name: bName,
    businessType: bType,
    category: bType,
    town: bTown,
    targetAudience: bAudience,
    websiteUrl: bUrl,
    logo: bLogo,
    productImages: bImages,
    brandTone: bTone,
    createdAt: existingIndex >= 0 ? businesses[existingIndex].createdAt : now,
    updatedAt: now,
  };

  if (existingIndex >= 0) {
    businesses[existingIndex] = record;
  } else {
    businesses.push(record);
  }

  writeJsonFile('businesses.json', businesses);
  return record;
}

// ----------------------------------------------------
// PROJECT METHODS (Scripts, Briefs, Progress)
// ----------------------------------------------------

async function getProjectsForUser(userId) {
  if (!userId) return [];

  const pool = getPgPool();
  if (pool) {
    await ensurePgTables();
    const res = await pool.query(
      'SELECT * FROM projects WHERE user_id = $1 ORDER BY updated_at DESC',
      [userId]
    );
    return res.rows.map(mapProjectRow);
  }

  const projects = readJsonFile('projects.json', []);
  return projects
    .filter((p) => p.userId === userId)
    .sort((a, b) => new Date(b.updatedAt || b.createdAt) - new Date(a.updatedAt || a.createdAt));
}

async function getProjectById(projectId, userId) {
  if (!projectId || !userId) return null;

  const pool = getPgPool();
  if (pool) {
    await ensurePgTables();
    const res = await pool.query(
      'SELECT * FROM projects WHERE id = $1 AND user_id = $2',
      [projectId, userId]
    );
    return res.rows.length ? mapProjectRow(res.rows[0]) : null;
  }

  const projects = readJsonFile('projects.json', []);
  return projects.find((p) => p.id === projectId && p.userId === userId) || null;
}

async function saveProject(projectData, userId) {
  if (!userId) throw new Error('Authentication required to save project.');
  const {
    id,
    businessId,
    title,
    businessName,
    businessType,
    town,
    brief,
    entryPoint,
    currentStage,
    completedStages,
    explicitChoices,
    creativeDNA,
    scenes,
    character1,
    character2,
    setting,
    qualityGatePassed,
    status,
    videoUrl,
    shotSpec,
    stages,
  } = projectData || {};

  const now = new Date().toISOString();
  const targetId = id || (projectData && projectData.idempotencyKey) || null;
  const projectId = targetId || `proj_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
  const projTitle = title || (brief ? brief.slice(0, 40) + '…' : `${businessName || 'Brand'} Ad Script`);
  const cStages = Array.isArray(completedStages) ? completedStages : [];
  const eChoices = explicitChoices || {};
  const cDNA = Object.assign({}, creativeDNA || {});
  if (shotSpec) cDNA.shotSpec = shotSpec;
  if (stages) cDNA.stages = stages;
  const scList = Array.isArray(scenes) ? scenes : [];
  const pStatus = status || (scList.length >= 4 ? 'script_ready' : 'in_progress');

  const pool = getPgPool();
  if (pool) {
    await ensurePgTables();
    if (targetId) {
      const ownerCheck = await pool.query('SELECT user_id FROM projects WHERE id = $1', [targetId]);
      if (ownerCheck.rows.length && ownerCheck.rows[0].user_id !== userId) {
        throw Object.assign(new Error('Project ID belongs to another user.'), { status: 403 });
      }
    }
    const res = await pool.query(
      `INSERT INTO projects (
        id, user_id, business_id, title, business_name, business_type, town, brief,
        entry_point, current_stage, completed_stages, explicit_choices, creative_dna,
        scenes, character1, character2, setting, quality_gate_passed, status, video_url,
        created_at, updated_at
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $21
      )
      ON CONFLICT (id) DO UPDATE SET
        business_id = EXCLUDED.business_id,
        title = EXCLUDED.title,
        business_name = EXCLUDED.business_name,
        business_type = EXCLUDED.business_type,
        town = EXCLUDED.town,
        brief = EXCLUDED.brief,
        entry_point = EXCLUDED.entry_point,
        current_stage = EXCLUDED.current_stage,
        completed_stages = EXCLUDED.completed_stages,
        explicit_choices = EXCLUDED.explicit_choices,
        creative_dna = EXCLUDED.creative_dna,
        scenes = EXCLUDED.scenes,
        character1 = EXCLUDED.character1,
        character2 = EXCLUDED.character2,
        setting = EXCLUDED.setting,
        quality_gate_passed = EXCLUDED.quality_gate_passed,
        status = EXCLUDED.status,
        video_url = EXCLUDED.video_url,
        updated_at = EXCLUDED.updated_at
      WHERE projects.user_id = EXCLUDED.user_id
      RETURNING *`,
      [
        projectId,
        userId,
        businessId || null,
        String(projTitle).trim(),
        String(businessName || '').trim(),
        String(businessType || 'Retail Store').trim(),
        String(town || '').trim(),
        String(brief || '').trim(),
        entryPoint || 'brief',
        currentStage || 'business',
        JSON.stringify(cStages),
        JSON.stringify(eChoices),
        JSON.stringify(cDNA),
        JSON.stringify(scList),
        character1 || '',
        character2 || '',
        setting || '',
        Boolean(qualityGatePassed),
        pStatus,
        videoUrl || null,
        now,
      ]
    );
    return mapProjectRow(res.rows[0]);
  }

  const projects = readJsonFile('projects.json', []);
  let existingIndex = -1;
  if (targetId) {
    existingIndex = projects.findIndex(
      (p) => (p.id === targetId || (p.idempotencyKey && p.idempotencyKey === targetId)) && p.userId === userId
    );
    // Security check: if ID belongs to another user, prevent overwrite/hijacking
    if (
      existingIndex < 0 &&
      projects.some(
        (p) => (p.id === targetId || (p.idempotencyKey && p.idempotencyKey === targetId)) && p.userId !== userId
      )
    ) {
      throw Object.assign(new Error('Project ID belongs to another user.'), { status: 403 });
    }
  }

  const record = {
    id: existingIndex >= 0 ? projects[existingIndex].id : projectId,
    idempotencyKey: (projectData && projectData.idempotencyKey) || (existingIndex >= 0 ? projects[existingIndex].idempotencyKey : undefined),
    userId,
    businessId: businessId || null,
    title: String(projTitle).trim(),
    businessName: String(businessName || '').trim(),
    businessType: String(businessType || 'Retail Store').trim(),
    town: String(town || '').trim(),
    brief: String(brief || '').trim(),
    entryPoint: entryPoint || 'brief',
    currentStage: currentStage || 'business',
    completedStages: cStages,
    explicitChoices: eChoices,
    creativeDNA: cDNA,
    shotSpec: shotSpec || cDNA.shotSpec || (existingIndex >= 0 ? projects[existingIndex].shotSpec : null),
    stages: stages || cDNA.stages || (existingIndex >= 0 ? projects[existingIndex].stages : null),
    scenes: scList,
    character1: character1 || '',
    character2: character2 || '',
    setting: setting || '',
    qualityGatePassed: Boolean(qualityGatePassed),
    status: pStatus,
    videoUrl: videoUrl || null,
    createdAt: existingIndex >= 0 ? projects[existingIndex].createdAt : now,
    updatedAt: now,
  };

  if (existingIndex >= 0) {
    projects[existingIndex] = record;
  } else {
    projects.push(record);
  }

  writeJsonFile('projects.json', projects);
  return record;
}

async function deleteProject(projectId, userId) {
  if (!projectId || !userId) return false;

  const pool = getPgPool();
  if (pool) {
    await ensurePgTables();
    const res = await pool.query(
      'DELETE FROM projects WHERE id = $1 AND user_id = $2',
      [projectId, userId]
    );
    return (res.rowCount || 0) > 0;
  }

  const projects = readJsonFile('projects.json', []);
  const filtered = projects.filter((p) => !(p.id === projectId && p.userId === userId));
  const changed = filtered.length !== projects.length;
  if (changed) {
    writeJsonFile('projects.json', filtered);
  }
  return changed;
}

async function saveVideoRun(runId, userId, initialData = {}) {
  if (!runId || !userId) throw new Error('runId and userId are required to persist video run');
  const now = new Date().toISOString();
  const pool = getPgPool();
  if (pool) {
    await ensurePgTables();
    await pool.query(
      `INSERT INTO video_runs (run_id, user_id, status, video_url, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $5)
       ON CONFLICT (run_id) DO UPDATE SET
         status = EXCLUDED.status,
         video_url = COALESCE(EXCLUDED.video_url, video_runs.video_url),
         updated_at = EXCLUDED.updated_at`,
      [runId, userId, initialData.status || 'PENDING', initialData.videoUrl || null, now]
    );
    return { runId, userId, status: initialData.status || 'PENDING', videoUrl: initialData.videoUrl || null, createdAt: now, updatedAt: now };
  }

  const runs = readJsonFile('video_runs.json', []);
  const existingIdx = runs.findIndex((r) => r.runId === runId);
  const record = {
    runId,
    userId,
    status: initialData.status || 'PENDING',
    videoUrl: initialData.videoUrl || null,
    createdAt: existingIdx >= 0 ? runs[existingIdx].createdAt : now,
    updatedAt: now,
  };
  if (existingIdx >= 0) {
    runs[existingIdx] = record;
  } else {
    runs.push(record);
  }
  writeJsonFile('video_runs.json', runs);
  return record;
}

async function getVideoRun(runId) {
  if (!runId) return null;
  const pool = getPgPool();
  if (pool) {
    await ensurePgTables();
    const res = await pool.query(
      'SELECT run_id AS "runId", user_id AS "userId", status, video_url AS "videoUrl", created_at AS "createdAt", updated_at AS "updatedAt" FROM video_runs WHERE run_id = $1 LIMIT 1',
      [runId]
    );
    return res.rows.length ? res.rows[0] : null;
  }
  const runs = readJsonFile('video_runs.json', []);
  return runs.find((r) => r.runId === runId) || null;
}

async function userOwnsVideoRun(userId, runId) {
  if (!userId || !runId) return false;
  const run = await getVideoRun(runId);
  return Boolean(run && run.userId === userId);
}

async function updateVideoRun(runId, updateData = {}) {
  if (!runId) return null;
  const now = new Date().toISOString();
  const pool = getPgPool();
  if (pool) {
    await ensurePgTables();
    const res = await pool.query(
      `UPDATE video_runs
       SET status = COALESCE($2, status),
           video_url = COALESCE($3, video_url),
           updated_at = $4
       WHERE run_id = $1
       RETURNING run_id AS "runId", user_id AS "userId", status, video_url AS "videoUrl", created_at AS "createdAt", updated_at AS "updatedAt"`,
      [runId, updateData.status || null, updateData.videoUrl || null, now]
    );
    return res.rows.length ? res.rows[0] : null;
  }
  const runs = readJsonFile('video_runs.json', []);
  const idx = runs.findIndex((r) => r.runId === runId);
  if (idx < 0) return null;
  runs[idx] = {
    ...runs[idx],
    status: updateData.status !== undefined ? updateData.status : runs[idx].status,
    videoUrl: updateData.videoUrl !== undefined ? updateData.videoUrl : runs[idx].videoUrl,
    updatedAt: now,
  };
  writeJsonFile('video_runs.json', runs);
  return runs[idx];
}

async function userOwnsVideoUrl(userId, videoUrl) {
  if (!userId || !videoUrl) return false;
  const pool = getPgPool();
  if (pool) {
    await ensurePgTables();
    const res = await pool.query(
      `SELECT 1 FROM projects WHERE user_id = $1 AND video_url = $2
       UNION
       SELECT 1 FROM video_runs WHERE user_id = $1 AND video_url = $2
       LIMIT 1`,
      [userId, videoUrl]
    );
    return (res.rowCount || 0) > 0;
  }
  const projects = readJsonFile('projects.json', []);
  if (projects.some((p) => p.userId === userId && p.videoUrl === videoUrl)) return true;
  const runs = readJsonFile('video_runs.json', []);
  return runs.some((r) => r.userId === userId && r.videoUrl === videoUrl);
}

async function isVideoUrlRegistered(videoUrl) {
  if (!videoUrl) return false;
  const pool = getPgPool();
  if (pool) {
    await ensurePgTables();
    const res = await pool.query(
      `SELECT 1 FROM projects WHERE video_url = $1
       UNION
       SELECT 1 FROM video_runs WHERE video_url = $1
       LIMIT 1`,
      [videoUrl]
    );
    return (res.rowCount || 0) > 0;
  }
  const projects = readJsonFile('projects.json', []);
  if (projects.some((p) => p.videoUrl === videoUrl)) return true;
  const runs = readJsonFile('video_runs.json', []);
  return runs.some((r) => r.videoUrl === videoUrl);
}

module.exports = {
  isPostgresConfigured,
  ensurePgTables,
  getPgPool,
  findUserByEmail,
  findUserById,
  createUser,
  authenticateUser,
  deleteUser,
  createSession,
  getUserBySessionToken,
  deleteSession,
  getBusinessesForUser,
  getBusinessById,
  saveBusiness,
  getProjectsForUser,
  getProjectById,
  saveProject,
  deleteProject,
  updateUserProfile,
  userOwnsVideoUrl,
  isVideoUrlRegistered,
  saveVideoRun,
  getVideoRun,
  userOwnsVideoRun,
  updateVideoRun,
};
