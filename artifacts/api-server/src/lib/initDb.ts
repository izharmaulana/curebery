import pg from "pg";
import { logger } from "./logger";

export async function initDb(pool: pg.Pool) {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS "session" (
        "sid" varchar NOT NULL COLLATE "default",
        "sess" json NOT NULL,
        "expire" timestamp(6) NOT NULL,
        CONSTRAINT "session_pkey" PRIMARY KEY ("sid") NOT DEFERRABLE INITIALLY IMMEDIATE
      ) WITH (OIDS=FALSE);
    `);
    await pool.query(`
      CREATE INDEX IF NOT EXISTS "IDX_session_expire" ON "session" ("expire");
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id serial PRIMARY KEY,
        email text NOT NULL UNIQUE,
        password_hash text NOT NULL,
        name text NOT NULL,
        role text NOT NULL,
        created_at timestamp DEFAULT now() NOT NULL
      );
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS nurses (
        id serial PRIMARY KEY,
        user_id integer NOT NULL REFERENCES users(id),
        str_number text NOT NULL UNIQUE,
        specialization text NOT NULL,
        is_online boolean DEFAULT false NOT NULL,
        rating real DEFAULT 4.5 NOT NULL,
        lat real NOT NULL,
        lng real NOT NULL,
        avatar_url text,
        total_patients integer DEFAULT 0,
        years_experience integer DEFAULT 0,
        phone text,
        address text,
        bio text,
        services text,
        rate text,
        str_expiry text,
        updated_at timestamp DEFAULT now() NOT NULL
      );
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS connections (
        id serial PRIMARY KEY,
        patient_user_id integer NOT NULL REFERENCES users(id),
        nurse_user_id integer NOT NULL REFERENCES users(id),
        nurse_profile_id integer NOT NULL REFERENCES nurses(id),
        status text DEFAULT 'pending' NOT NULL,
        patient_name text NOT NULL,
        nurse_name text NOT NULL,
        nurse_spec text NOT NULL,
        order_status text DEFAULT 'none' NOT NULL,
        patient_lat real,
        patient_lng real,
        created_at timestamp DEFAULT now() NOT NULL,
        updated_at timestamp DEFAULT now() NOT NULL
      );
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS messages (
        id serial PRIMARY KEY,
        connection_id integer NOT NULL REFERENCES connections(id),
        sender_user_id integer NOT NULL REFERENCES users(id),
        sender_role text NOT NULL,
        text text NOT NULL,
        created_at timestamp DEFAULT now() NOT NULL
      );
    `);

    await pool.query(`
      ALTER TABLE nurses
        ADD COLUMN IF NOT EXISTS rate text,
        ADD COLUMN IF NOT EXISTS str_expiry text;
    `);

    // Remove spurious sequences left from when FK columns were incorrectly serial()
    // These cause Drizzle schema validation failures during deployment
    await pool.query(`
      ALTER TABLE nurses
        ALTER COLUMN user_id DROP DEFAULT;
      ALTER TABLE connections
        ALTER COLUMN patient_user_id DROP DEFAULT,
        ALTER COLUMN nurse_user_id DROP DEFAULT,
        ALTER COLUMN nurse_profile_id DROP DEFAULT;
      DROP SEQUENCE IF EXISTS nurses_user_id_seq;
      DROP SEQUENCE IF EXISTS nurses_total_patients_seq;
      DROP SEQUENCE IF EXISTS nurses_years_experience_seq;
      DROP SEQUENCE IF EXISTS connections_patient_user_id_seq;
      DROP SEQUENCE IF EXISTS connections_nurse_user_id_seq;
      DROP SEQUENCE IF EXISTS connections_nurse_profile_id_seq;
    `);

    await pool.query(`
      ALTER TABLE connections
        ADD COLUMN IF NOT EXISTS order_status text NOT NULL DEFAULT 'none',
        ADD COLUMN IF NOT EXISTS patient_lat real,
        ADD COLUMN IF NOT EXISTS patient_lng real,
        ADD COLUMN IF NOT EXISTS rating_given real,
        ADD COLUMN IF NOT EXISTS review_text text,
        ADD COLUMN IF NOT EXISTS completed_at timestamp;
    `);

    // Reset semua perawat ke offline saat server restart (bersihkan status lama)
    await pool.query(`UPDATE nurses SET is_online = false WHERE is_online = true;`);
    logger.info("All nurses set to offline on startup");

    logger.info("Database tables initialized successfully");
  } catch (err) {
    logger.error({ err }, "Failed to initialize database tables");
    throw err;
  }
}
