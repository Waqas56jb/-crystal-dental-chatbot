-- Run this in Supabase SQL editor.
-- Creates all tables required for chatbot persistence and insights.

create extension if not exists pgcrypto;

create table if not exists public.chat_sessions (
  id uuid primary key default gen_random_uuid(),
  session_id text unique not null,
  language_hint text default 'English',
  created_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now()
);

create table if not exists public.chat_messages (
  id uuid primary key default gen_random_uuid(),
  session_id text not null,
  role text not null check (role in ('user', 'assistant', 'system')),
  content text not null,
  language text default 'English',
  created_at timestamptz not null default now()
);
create index if not exists idx_chat_messages_session_id on public.chat_messages (session_id);
create index if not exists idx_chat_messages_created_at on public.chat_messages (created_at desc);

create table if not exists public.chat_insights (
  id uuid primary key default gen_random_uuid(),
  session_id text not null,
  user_message text not null,
  bot_reply text not null,
  topic_allowed boolean not null default true,
  intent_label text default 'other',
  urgency_level text default 'low',
  sentiment text default 'neutral',
  booking_intent boolean not null default false,
  suggested_service_primary text,
  suggested_service_secondary text,
  language_used text default 'English',
  created_at timestamptz not null default now()
);
create index if not exists idx_chat_insights_session_id on public.chat_insights (session_id);
create index if not exists idx_chat_insights_created_at on public.chat_insights (created_at desc);

create table if not exists public.chat_leads (
  id uuid primary key default gen_random_uuid(),
  session_id text not null,
  full_name text not null,
  email text,
  phone text,
  preferred_service text,
  preferred_date text,
  notes text,
  status text not null default 'new',
  source text not null default 'chatbot',
  created_at timestamptz not null default now()
);
create index if not exists idx_chat_leads_session_id on public.chat_leads (session_id);
create index if not exists idx_chat_leads_created_at on public.chat_leads (created_at desc);

create table if not exists public.chat_feedback (
  id uuid primary key default gen_random_uuid(),
  session_id text not null,
  rating int not null check (rating between 1 and 5),
  comment text,
  created_at timestamptz not null default now()
);
create index if not exists idx_chat_feedback_session_id on public.chat_feedback (session_id);

create table if not exists public.chat_support_tickets (
  id uuid primary key default gen_random_uuid(),
  session_id text not null,
  full_name text,
  contact text,
  issue text not null,
  priority text not null default 'medium',
  status text not null default 'open',
  created_at timestamptz not null default now()
);
create index if not exists idx_chat_support_session_id on public.chat_support_tickets (session_id);

create table if not exists public.chat_reviews (
  id uuid primary key default gen_random_uuid(),
  session_id text not null,
  patient_name text not null default 'Anonymous',
  stars int not null check (stars between 1 and 5),
  review_text text not null,
  source text not null default 'chatbot',
  created_at timestamptz not null default now()
);
create index if not exists idx_chat_reviews_session_id on public.chat_reviews (session_id);

create table if not exists public.admin_knowledge (
  id uuid primary key default gen_random_uuid(),
  question text not null,
  category text not null default 'general',
  answer_en text not null,
  answer_hu text,
  answer_fr text,
  tags text[] not null default '{}',
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_admin_knowledge_category on public.admin_knowledge (category);
create index if not exists idx_admin_knowledge_active on public.admin_knowledge (is_active);

create table if not exists public.admin_services (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  price_from text not null,
  duration text,
  languages text[] not null default '{"EN","HU","FR"}',
  description text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.admin_languages (
  code text primary key,
  label text not null,
  enabled boolean not null default true,
  traffic_percent int not null default 0,
  updated_at timestamptz not null default now()
);

create table if not exists public.admin_settings (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz not null default now()
);

create table if not exists public.chatbot_context (
  id uuid primary key default gen_random_uuid(),
  context_name text not null default 'default',
  context_text text not null,
  is_active boolean not null default true,
  updated_at timestamptz not null default now()
);

-- Seed defaults (safe upserts)
insert into public.admin_languages (code, label, enabled, traffic_percent)
values
  ('EN', 'English', true, 48),
  ('HU', 'Hungarian', true, 36),
  ('FR', 'French', true, 16)
on conflict (code) do nothing;

insert into public.admin_settings (key, value)
values
  ('chatbot_behavior', '{"smart_symptom_detection":true,"auto_language_detection":true,"grammar_auto_correction":true,"booking_integration":true,"fallback_human_support":true}'::jsonb),
  ('chatbot_config', '{"model":"gpt-4.1-mini","welcome_message_en":"Hello! I am your DentaLux AI assistant.","booking_contact":"+36 1 234 5678"}'::jsonb)
on conflict (key) do nothing;

insert into public.chatbot_context (context_name, context_text, is_active)
values
  ('default', 'DentaLux Clinic context: multilingual dental assistant, approved services, pricing transparency, emergency triage, and booking guidance.', true)
on conflict do nothing;

-- Optional: if your project uses RLS globally, service-role key bypasses it.
-- If you also want dashboard access with anon key, define RLS policies accordingly.
