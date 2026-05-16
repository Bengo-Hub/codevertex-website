SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;
SET default_tablespace = '';
SET default_table_access_method = heap;
CREATE TABLE public._prisma_migrations (
    id character varying(36) NOT NULL,
    checksum character varying(64) NOT NULL,
    finished_at timestamp with time zone,
    migration_name character varying(255) NOT NULL,
    logs text,
    rolled_back_at timestamp with time zone,
    started_at timestamp with time zone DEFAULT now() NOT NULL,
    applied_steps_count integer DEFAULT 0 NOT NULL
);
CREATE TABLE public.blog_posts (
    id bigint NOT NULL,
    slug text NOT NULL,
    title text NOT NULL,
    excerpt text,
    content text NOT NULL,
    author text NOT NULL,
    cover_image text,
    tags text[] DEFAULT ARRAY[]::text[],
    published boolean DEFAULT false NOT NULL,
    published_at timestamp(3) without time zone,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL
);
CREATE SEQUENCE public.blog_posts_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
ALTER SEQUENCE public.blog_posts_id_seq OWNED BY public.blog_posts.id;
CREATE TABLE public.cohorts (
    id bigint NOT NULL,
    course_id text NOT NULL,
    name text NOT NULL,
    start_date date NOT NULL,
    end_date date,
    max_slots integer DEFAULT 20 NOT NULL,
    status text DEFAULT 'open'::text NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);
CREATE SEQUENCE public.cohorts_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
ALTER SEQUENCE public.cohorts_id_seq OWNED BY public.cohorts.id;
CREATE TABLE public.contact_submissions (
    id bigint NOT NULL,
    name text NOT NULL,
    email text NOT NULL,
    phone text,
    service text,
    message text NOT NULL,
    source text DEFAULT 'website'::text NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);
CREATE SEQUENCE public.contact_submissions_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
ALTER SEQUENCE public.contact_submissions_id_seq OWNED BY public.contact_submissions.id;
CREATE TABLE public.courses (
    id text NOT NULL,
    category_id text NOT NULL,
    name text NOT NULL,
    short_name text,
    slug text NOT NULL,
    duration text NOT NULL,
    mode text NOT NULL,
    price integer NOT NULL,
    currency text DEFAULT 'KES'::text NOT NULL,
    description text NOT NULL,
    long_description text,
    level text DEFAULT 'beginner'::text NOT NULL,
    audience text,
    stack text,
    cover_image text,
    outcomes text[],
    prerequisites text[] DEFAULT ARRAY[]::text[],
    career_paths text[] DEFAULT ARRAY[]::text[],
    includes text[] DEFAULT ARRAY[]::text[],
    featured boolean DEFAULT false NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    sort_order integer DEFAULT 0 NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL
);
CREATE TABLE public.enrollments (
    id bigint NOT NULL,
    course_id text NOT NULL,
    course_name text NOT NULL,
    category text NOT NULL,
    full_name text NOT NULL,
    email text NOT NULL,
    phone text NOT NULL,
    dob date,
    experience text,
    how_heard text,
    amount integer NOT NULL,
    currency text DEFAULT 'KES'::text NOT NULL,
    payment_ref text,
    payment_status text DEFAULT 'pending'::text NOT NULL,
    payment_plan text,
    installment_no integer,
    cohort_id bigint,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);
CREATE SEQUENCE public.enrollments_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
ALTER SEQUENCE public.enrollments_id_seq OWNED BY public.enrollments.id;
CREATE TABLE public.leads (
    id bigint NOT NULL,
    name text,
    email text,
    phone text,
    topic text,
    preferred_time text,
    source text DEFAULT 'chatbot'::text NOT NULL,
    notes text,
    status text DEFAULT 'new'::text NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);
CREATE SEQUENCE public.leads_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
ALTER SEQUENCE public.leads_id_seq OWNED BY public.leads.id;
CREATE TABLE public.site_users (
    id text NOT NULL,
    email text NOT NULL,
    full_name text,
    avatar_url text,
    role text DEFAULT 'member'::text NOT NULL,
    tenant_id text,
    tenant_slug text,
    last_login_at timestamp(3) without time zone,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL
);
ALTER TABLE ONLY public.blog_posts ALTER COLUMN id SET DEFAULT nextval('public.blog_posts_id_seq'::regclass);
ALTER TABLE ONLY public.cohorts ALTER COLUMN id SET DEFAULT nextval('public.cohorts_id_seq'::regclass);
ALTER TABLE ONLY public.contact_submissions ALTER COLUMN id SET DEFAULT nextval('public.contact_submissions_id_seq'::regclass);
ALTER TABLE ONLY public.enrollments ALTER COLUMN id SET DEFAULT nextval('public.enrollments_id_seq'::regclass);
ALTER TABLE ONLY public.leads ALTER COLUMN id SET DEFAULT nextval('public.leads_id_seq'::regclass);
ALTER TABLE ONLY public._prisma_migrations
    ADD CONSTRAINT _prisma_migrations_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.blog_posts
    ADD CONSTRAINT blog_posts_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.cohorts
    ADD CONSTRAINT cohorts_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.contact_submissions
    ADD CONSTRAINT contact_submissions_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.courses
    ADD CONSTRAINT courses_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.enrollments
    ADD CONSTRAINT enrollments_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.leads
    ADD CONSTRAINT leads_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.site_users
    ADD CONSTRAINT site_users_pkey PRIMARY KEY (id);
CREATE INDEX blog_posts_published_at_idx ON public.blog_posts USING btree (published_at DESC);
CREATE INDEX blog_posts_published_idx ON public.blog_posts USING btree (published);
CREATE INDEX blog_posts_slug_idx ON public.blog_posts USING btree (slug);
CREATE UNIQUE INDEX blog_posts_slug_key ON public.blog_posts USING btree (slug);
CREATE INDEX contact_submissions_created_at_idx ON public.contact_submissions USING btree (created_at DESC);
CREATE INDEX courses_category_id_idx ON public.courses USING btree (category_id);
CREATE INDEX courses_featured_idx ON public.courses USING btree (featured);
CREATE INDEX courses_is_active_idx ON public.courses USING btree (is_active);
CREATE UNIQUE INDEX courses_slug_key ON public.courses USING btree (slug);
CREATE INDEX enrollments_email_idx ON public.enrollments USING btree (email);
CREATE INDEX enrollments_payment_status_idx ON public.enrollments USING btree (payment_status);
CREATE INDEX leads_status_idx ON public.leads USING btree (status);
CREATE INDEX site_users_email_idx ON public.site_users USING btree (email);
CREATE UNIQUE INDEX site_users_email_key ON public.site_users USING btree (email);
CREATE INDEX site_users_tenant_id_idx ON public.site_users USING btree (tenant_id);
ALTER TABLE ONLY public.enrollments
    ADD CONSTRAINT enrollments_cohort_id_fkey FOREIGN KEY (cohort_id) REFERENCES public.cohorts(id) ON UPDATE CASCADE ON DELETE SET NULL;
