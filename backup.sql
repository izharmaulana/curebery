--
-- PostgreSQL database dump
--

\restrict a7oWNxLmsVqjb3ldPNChQ90xQWhcqEGWbbwGbjpNikZwEwv7fNgFXV8aPmqyYd7

-- Dumped from database version 16.10
-- Dumped by pg_dump version 16.10

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: drizzle; Type: SCHEMA; Schema: -; Owner: postgres
--

CREATE SCHEMA drizzle;


ALTER SCHEMA drizzle OWNER TO postgres;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: __drizzle_migrations; Type: TABLE; Schema: drizzle; Owner: postgres
--

CREATE TABLE drizzle.__drizzle_migrations (
    id integer NOT NULL,
    hash text NOT NULL,
    created_at bigint
);


ALTER TABLE drizzle.__drizzle_migrations OWNER TO postgres;

--
-- Name: __drizzle_migrations_id_seq; Type: SEQUENCE; Schema: drizzle; Owner: postgres
--

CREATE SEQUENCE drizzle.__drizzle_migrations_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE drizzle.__drizzle_migrations_id_seq OWNER TO postgres;

--
-- Name: __drizzle_migrations_id_seq; Type: SEQUENCE OWNED BY; Schema: drizzle; Owner: postgres
--

ALTER SEQUENCE drizzle.__drizzle_migrations_id_seq OWNED BY drizzle.__drizzle_migrations.id;


--
-- Name: connections; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.connections (
    id integer NOT NULL,
    patient_user_id integer NOT NULL,
    nurse_user_id integer NOT NULL,
    nurse_profile_id integer NOT NULL,
    status text DEFAULT 'pending'::text NOT NULL,
    patient_name text NOT NULL,
    nurse_name text NOT NULL,
    nurse_spec text NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    order_status text DEFAULT 'none'::text NOT NULL,
    patient_lat real,
    patient_lng real,
    rating_given real,
    review_text text,
    completed_at timestamp without time zone
);


ALTER TABLE public.connections OWNER TO postgres;

--
-- Name: connections_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.connections_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.connections_id_seq OWNER TO postgres;

--
-- Name: connections_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.connections_id_seq OWNED BY public.connections.id;


--
-- Name: messages; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.messages (
    id integer NOT NULL,
    connection_id integer NOT NULL,
    sender_user_id integer NOT NULL,
    sender_role text NOT NULL,
    text text NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.messages OWNER TO postgres;

--
-- Name: messages_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.messages_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.messages_id_seq OWNER TO postgres;

--
-- Name: messages_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.messages_id_seq OWNED BY public.messages.id;


--
-- Name: nurses; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.nurses (
    id integer NOT NULL,
    user_id integer NOT NULL,
    str_number text NOT NULL,
    specialization text NOT NULL,
    is_online boolean DEFAULT false NOT NULL,
    rating real DEFAULT 4.5 NOT NULL,
    lat real NOT NULL,
    lng real NOT NULL,
    avatar_url text,
    total_patients integer,
    years_experience integer,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    phone text,
    address text,
    bio text,
    services text,
    rate text,
    str_expiry text,
    radius_km integer DEFAULT 5
);


ALTER TABLE public.nurses OWNER TO postgres;

--
-- Name: nurses_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.nurses_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.nurses_id_seq OWNER TO postgres;

--
-- Name: nurses_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.nurses_id_seq OWNED BY public.nurses.id;


--
-- Name: users; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.users (
    id integer NOT NULL,
    email text NOT NULL,
    password_hash text NOT NULL,
    name text NOT NULL,
    role text NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.users OWNER TO postgres;

--
-- Name: users_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.users_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.users_id_seq OWNER TO postgres;

--
-- Name: users_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.users_id_seq OWNED BY public.users.id;


--
-- Name: __drizzle_migrations id; Type: DEFAULT; Schema: drizzle; Owner: postgres
--

ALTER TABLE ONLY drizzle.__drizzle_migrations ALTER COLUMN id SET DEFAULT nextval('drizzle.__drizzle_migrations_id_seq'::regclass);


--
-- Name: connections id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.connections ALTER COLUMN id SET DEFAULT nextval('public.connections_id_seq'::regclass);


--
-- Name: messages id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.messages ALTER COLUMN id SET DEFAULT nextval('public.messages_id_seq'::regclass);


--
-- Name: nurses id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.nurses ALTER COLUMN id SET DEFAULT nextval('public.nurses_id_seq'::regclass);


--
-- Name: users id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users ALTER COLUMN id SET DEFAULT nextval('public.users_id_seq'::regclass);


--
-- Data for Name: __drizzle_migrations; Type: TABLE DATA; Schema: drizzle; Owner: postgres
--

COPY drizzle.__drizzle_migrations (id, hash, created_at) FROM stdin;
1	93dfd8635dba9df5cd144bf9ff4b55ee96aba2d5e49c5bd433ab370a2e202d7c	1775072072219
\.


--
-- Data for Name: connections; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.connections (id, patient_user_id, nurse_user_id, nurse_profile_id, status, patient_name, nurse_name, nurse_spec, created_at, updated_at, order_status, patient_lat, patient_lng, rating_given, review_text, completed_at) FROM stdin;
1	2	1	1	accepted	Budi Pasien	Rina Perawat S.Kep	Perawat Umum	2026-03-30 15:32:12.209195	2026-03-30 15:32:18.534	none	\N	\N	\N	\N	\N
2	2	1	1	accepted	Budi Pasien	Rina Perawat S.Kep	Perawat Umum	2026-03-30 15:33:42.826369	2026-03-30 15:33:57.932	none	\N	\N	\N	\N	\N
3	7	14	7	pending	izhar5	Uji Perawat Baru	Perawat Umum	2026-03-30 23:28:01.212589	2026-03-30 23:28:01.212589	none	\N	\N	\N	\N	\N
\.


--
-- Data for Name: messages; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.messages (id, connection_id, sender_user_id, sender_role, text, created_at) FROM stdin;
\.


--
-- Data for Name: nurses; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.nurses (id, user_id, str_number, specialization, is_online, rating, lat, lng, avatar_url, total_patients, years_experience, updated_at, phone, address, bio, services, rate, str_expiry, radius_km) FROM stdin;
2	4	12312341234	Perawat Umum	f	4.5	-6.2088	106.8456	\N	0	1	2026-03-30 15:35:47.51107	\N	\N	\N	\N	\N	\N	5
5	8	STR-TEST-11	Perawat Umum	f	4.5	-6.2088	106.8456	\N	0	1	2026-03-30 16:11:03.364451	\N	\N	\N	\N	\N	\N	5
3	5	STR-TEST-99	Perawat Umum	f	4.5	-6.2088	106.8456	\N	0	2	2026-03-30 15:39:52.687	\N	\N	\N	\N	\N	\N	5
6	9	STR-2026-TEST404	Perawat Umum	f	4.5	-0.02	109.34	\N	0	0	2026-03-30 16:19:50.065662	\N	\N	\N	\N	\N	\N	5
4	6	STR-2026-SARI01	Perawat Umum	f	4.5	-6.2088	106.8456	\N	0	3	2026-03-30 15:41:59.146	\N	\N	\N	\N	\N	\N	5
7	14	STR-UJITEST	Perawat Umum	f	0	-6.2088	106.8456	\N	0	1	2026-03-30 18:14:39.891	\N	\N	\N	\N	\N	\N	5
1	1	STR-2024-TEST01	Perawat Umum	f	4.5	-6.2088	106.8456	\N	0	3	2026-03-30 23:40:56.403	08123456789	Jl. Sudirman No. 1, Jakarta	Perawat berpengalaman dengan dedikasi tinggi	[]	\N	\N	5
8	15	STR-SYNC-TEST-001	Perawat Umum	f	0	-6.2088	106.8456	\N	0	2	2026-03-31 00:15:17.090335	081234567890	\N	\N	\N	\N	\N	5
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.users (id, email, password_hash, name, role, created_at) FROM stdin;
2	budi@test.com	63ef3b2019adcf14ef128ead442cd5197561f3eaf9d4750468cda056e4e2a257	Budi Pasien	patient	2026-03-30 14:54:27.749874
3	izhar1@gmail.com	3a837ae4da31664218a6fbf0f4389c4eab6b4df306bf6b99ae571c122ed6aa9a	izhar1	patient	2026-03-30 15:07:35.299287
4	izhar4@gmail.com	3a837ae4da31664218a6fbf0f4389c4eab6b4df306bf6b99ae571c122ed6aa9a	izhar4	nurse	2026-03-30 15:35:47.478086
5	testnurse@test.com	63ef3b2019adcf14ef128ead442cd5197561f3eaf9d4750468cda056e4e2a257	Test Nurse	nurse	2026-03-30 15:39:42.818571
6	sari.test@gmail.com	f0db6c118ca975db66649498a4e04b6b09de0c40deedae7a91e86e6c11b14735	Sari Perawat	nurse	2026-03-30 15:41:44.077214
7	izhar5@gmail.com	3a837ae4da31664218a6fbf0f4389c4eab6b4df306bf6b99ae571c122ed6aa9a	izhar5	patient	2026-03-30 16:02:09.593304
8	newtest@test.com	63ef3b2019adcf14ef128ead442cd5197561f3eaf9d4750468cda056e4e2a257	Test	nurse	2026-03-30 16:11:03.165453
9	testbaru404@test.com	f617ac6b96ca8d08f49a9ba3edab9f08c138add2a2600397ef46764e333fabf6	Dr. Test Baru S.Kep	nurse	2026-03-30 16:19:49.846316
10	izhar7@gmail.com	3a837ae4da31664218a6fbf0f4389c4eab6b4df306bf6b99ae571c122ed6aa9a	izhar7	patient	2026-03-30 17:08:14.474363
11	budi.klien.test@gmail.com	a9ca6f634946ab2025d8364dd902b26399f9a34b19059f3d74aee1f5ae8e8a35	Budi Klien	patient	2026-03-30 18:05:24.636574
12	budi.klien.test2@gmail.com	a9ca6f634946ab2025d8364dd902b26399f9a34b19059f3d74aee1f5ae8e8a35	Budi Klien	patient	2026-03-30 18:05:30.719394
13	siti.test.klien@gmail.com	65980facbcef44cce6e127e5e90e7607efbd0e088dc0e8a404d39a2654b018e0	Siti Rahmawati	patient	2026-03-30 18:06:45.244194
14	uji.baru.rating@test.com	d0965cfb51d4426f2003c4f2519e65fae84766122ddc62d569988a5870058638	Uji Perawat Baru	nurse	2026-03-30 18:13:46.890339
1	rina@test.com	63ef3b2019adcf14ef128ead442cd5197561f3eaf9d4750468cda056e4e2a257	Rina Perawat S.Kep	nurse	2026-03-30 14:54:26.462671
15	budi.test.sync@curebery.id	f0db6c118ca975db66649498a4e04b6b09de0c40deedae7a91e86e6c11b14735	Budi Santoso Test	nurse	2026-03-31 00:15:16.8477
16	izhar18@gmail.com	07d10de37b158de1a28b12841258b21e352c1d0abccbd3c431fcc60223fff492	izhar18	patient	2026-03-31 01:26:50.599203
17	testpasien_dev9@test.com	e0a8c1eca1893a93b1857e4534a9663fa0f588d2c4bf55481669feb2d234a01f	Test Pasien	patient	2026-03-31 03:52:14.266082
\.


--
-- Name: __drizzle_migrations_id_seq; Type: SEQUENCE SET; Schema: drizzle; Owner: postgres
--

SELECT pg_catalog.setval('drizzle.__drizzle_migrations_id_seq', 1, true);


--
-- Name: connections_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.connections_id_seq', 3, true);


--
-- Name: messages_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.messages_id_seq', 1, false);


--
-- Name: nurses_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.nurses_id_seq', 8, true);


--
-- Name: users_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.users_id_seq', 17, true);


--
-- Name: __drizzle_migrations __drizzle_migrations_pkey; Type: CONSTRAINT; Schema: drizzle; Owner: postgres
--

ALTER TABLE ONLY drizzle.__drizzle_migrations
    ADD CONSTRAINT __drizzle_migrations_pkey PRIMARY KEY (id);


--
-- Name: connections connections_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.connections
    ADD CONSTRAINT connections_pkey PRIMARY KEY (id);


--
-- Name: messages messages_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.messages
    ADD CONSTRAINT messages_pkey PRIMARY KEY (id);


--
-- Name: nurses nurses_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.nurses
    ADD CONSTRAINT nurses_pkey PRIMARY KEY (id);


--
-- Name: nurses nurses_str_number_unique; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.nurses
    ADD CONSTRAINT nurses_str_number_unique UNIQUE (str_number);


--
-- Name: users users_email_unique; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_unique UNIQUE (email);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: connections connections_nurse_profile_id_nurses_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.connections
    ADD CONSTRAINT connections_nurse_profile_id_nurses_id_fk FOREIGN KEY (nurse_profile_id) REFERENCES public.nurses(id);


--
-- Name: connections connections_nurse_user_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.connections
    ADD CONSTRAINT connections_nurse_user_id_users_id_fk FOREIGN KEY (nurse_user_id) REFERENCES public.users(id);


--
-- Name: connections connections_patient_user_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.connections
    ADD CONSTRAINT connections_patient_user_id_users_id_fk FOREIGN KEY (patient_user_id) REFERENCES public.users(id);


--
-- Name: messages messages_connection_id_connections_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.messages
    ADD CONSTRAINT messages_connection_id_connections_id_fk FOREIGN KEY (connection_id) REFERENCES public.connections(id);


--
-- Name: messages messages_sender_user_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.messages
    ADD CONSTRAINT messages_sender_user_id_users_id_fk FOREIGN KEY (sender_user_id) REFERENCES public.users(id);


--
-- Name: nurses nurses_user_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.nurses
    ADD CONSTRAINT nurses_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- PostgreSQL database dump complete
--

\unrestrict a7oWNxLmsVqjb3ldPNChQ90xQWhcqEGWbbwGbjpNikZwEwv7fNgFXV8aPmqyYd7

