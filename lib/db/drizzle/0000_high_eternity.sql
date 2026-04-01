CREATE TABLE IF NOT EXISTS "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"password_hash" text NOT NULL,
	"name" text NOT NULL,
	"role" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "nurses" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"str_number" text NOT NULL,
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
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "nurses_str_number_unique" UNIQUE("str_number")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "connections" (
	"id" serial PRIMARY KEY NOT NULL,
	"patient_user_id" integer NOT NULL,
	"nurse_user_id" integer NOT NULL,
	"nurse_profile_id" integer NOT NULL,
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
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "messages" (
	"id" serial PRIMARY KEY NOT NULL,
	"connection_id" integer NOT NULL,
	"sender_user_id" integer NOT NULL,
	"sender_role" text NOT NULL,
	"text" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "nurses" ADD CONSTRAINT "nurses_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "connections" ADD CONSTRAINT "connections_patient_user_id_users_id_fk" FOREIGN KEY ("patient_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "connections" ADD CONSTRAINT "connections_nurse_user_id_users_id_fk" FOREIGN KEY ("nurse_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "connections" ADD CONSTRAINT "connections_nurse_profile_id_nurses_id_fk" FOREIGN KEY ("nurse_profile_id") REFERENCES "public"."nurses"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "messages" ADD CONSTRAINT "messages_connection_id_connections_id_fk" FOREIGN KEY ("connection_id") REFERENCES "public"."connections"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "messages" ADD CONSTRAINT "messages_sender_user_id_users_id_fk" FOREIGN KEY ("sender_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
