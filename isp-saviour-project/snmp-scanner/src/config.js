require('dotenv').config();

function requireEnv(name) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}. Copy .env.example to .env and fill it in.`);
  }
  return value;
}

const config = {
  olt: {
    host: requireEnv('OLT_HOST'),
    port: Number(process.env.OLT_PORT || 161),
    community: process.env.SNMP_COMMUNITY || 'public',
    brand: (process.env.OLT_BRAND || 'generic').toLowerCase(),
  },
  supabase: {
    url: requireEnv('SUPABASE_URL'),
    serviceRoleKey: requireEnv('SUPABASE_SERVICE_ROLE_KEY'),
  },
  scanIntervalMs: Number(process.env.SCAN_INTERVAL_MS || 60000),
};

module.exports = config;
