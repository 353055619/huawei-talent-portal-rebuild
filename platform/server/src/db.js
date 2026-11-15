import pg from 'pg';

const { PGHOST, PGPORT, PGUSER, PGPASSWORD, PGDATABASE } = process.env;

export const pool = new pg.Pool({
  host: PGHOST || '127.0.0.1',
  port: Number(PGPORT || 5432),
  user: PGUSER || 'hindsight_user',
  password: PGPASSWORD || '4b8feb209663a7e6516640f324eb105f',
  database: PGDATABASE || 'talent_portal',
  max: 10,
});

export function q(text, params) {
  return pool.query(text, params);
}
