CREATE TABLE IF NOT EXISTS "users" (
  "id" serial PRIMARY KEY,
  "email" text NOT NULL UNIQUE,
  "password_hash" text NOT NULL,
  "name" text NOT NULL,
  "role" text NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "nurses" (
  "id" serial PRIMARY KEY,
  "user_id" integer NOT NULL REFERENCES "users"("id"),
  "str_number" text NOT NULL UNIQUE,
  "specialization" text NOT NULL,
  "is_online" boolean DEFAULT false NOT NULL,
  "rating" real DEFAULT 4.5 NOT NULL,
  "lat" real NOT NULL,
  "lng" real NOT NULL,
  "avatar_url" text,
  "total_patients" integer,
  "years_experience" integer,
  "phone" text,
  "address" text,
  "bio" text,
  "services" text,
  "rate" text,
  "str_expiry" text,
  "radius_km" integer DEFAULT 5,
  "updated_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "connections" (
  "id" serial PRIMARY KEY,
  "patient_user_id" integer NOT NULL REFERENCES "users"("id"),
  "nurse_user_id" integer NOT NULL REFERENCES "users"("id"),
  "nurse_profile_id" integer NOT NULL REFERENCES "nurses"("id"),
  "status" text DEFAULT 'pending' NOT NULL,
  "patient_name" text NOT NULL,
  "nurse_name" text NOT NULL,
  "nurse_spec" text NOT NULL,
  "order_status" text DEFAULT 'none' NOT NULL,
  "patient_lat" real,
  "patient_lng" real,
  "rating_given" real,
  "review_text" text,
  "completed_at" timestamp,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "messages" (
  "id" serial PRIMARY KEY,
  "connection_id" integer NOT NULL REFERENCES "connections"("id"),
  "sender_user_id" integer NOT NULL REFERENCES "users"("id"),
  "sender_role" text NOT NULL,
  "text" text NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL
);
