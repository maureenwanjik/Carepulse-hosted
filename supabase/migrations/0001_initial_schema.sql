-- CarePulse schema for the Appwrite -> Supabase/Vercel migration.
-- Keep patient identification documents in a private Supabase Storage bucket.
-- Public medicine images can move to Vercel Blob after the Blob store is created.

create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  name text not null,
  phone text not null default '',
  legacy_appwrite_user_id text unique,
  created_at timestamptz not null default now()
);

create table if not exists public.patients (
  id text primary key default gen_random_uuid()::text,
  user_id uuid not null unique references public.profiles (id) on delete cascade,
  name text not null,
  email text not null,
  phone text not null,
  birth_date date,
  gender text check (gender in ('male', 'female')),
  address text not null default '',
  occupation text not null default '',
  emergency_contact_name text not null default '',
  emergency_contact_number text not null default '',
  primary_physician text not null default '',
  insurance_provider text not null default '',
  insurance_policy_number text not null default '',
  allergies text,
  current_medication text,
  family_medical_history text,
  past_medical_history text,
  identification_type text,
  identification_number text,
  identification_document_path text,
  privacy_consent boolean not null default false,
  legacy_appwrite_id text unique,
  created_at timestamptz not null default now()
);

create table if not exists public.doctors (
  id text primary key default gen_random_uuid()::text,
  name text not null unique,
  image text not null default '',
  legacy_appwrite_id text unique,
  created_at timestamptz not null default now()
);

create table if not exists public.medicines (
  id text primary key default gen_random_uuid()::text,
  medicine_id text,
  medicine_name text not null,
  image_path text,
  description text not null default '',
  price numeric(12, 2) not null default 0 check (price >= 0),
  category text not null default '',
  stock integer not null default 0 check (stock >= 0),
  unit text not null default '',
  dosage text not null default '',
  requires_prescription boolean not null default false,
  manufacturer text not null default '',
  expiry_date date,
  legacy_appwrite_id text unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists medicines_name_search_idx
  on public.medicines using gin (to_tsvector('simple', medicine_name));
create index if not exists medicines_category_idx on public.medicines (category);

create table if not exists public.appointments (
  id text primary key default gen_random_uuid()::text,
  user_id uuid not null references public.profiles (id) on delete cascade,
  patient_id text not null references public.patients (id) on delete cascade,
  primary_physician text not null,
  reason text not null default '',
  schedule timestamptz not null,
  status text not null default 'pending'
    check (status in ('pending', 'scheduled', 'cancelled')),
  note text,
  cancellation_reason text,
  legacy_appwrite_id text unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists appointments_schedule_idx on public.appointments (schedule desc);
create index if not exists appointments_user_idx on public.appointments (user_id, schedule desc);

create table if not exists public.orders (
  id text primary key default gen_random_uuid()::text,
  user_id uuid not null references public.profiles (id) on delete restrict,
  patient_id text not null references public.patients (id) on delete restrict,
  status text not null default 'pending'
    check (status in ('pending', 'confirmed', 'out_for_delivery', 'delivered', 'cancelled')),
  total_amount numeric(12, 2) not null check (total_amount >= 0),
  delivery_address text not null,
  payment_method text not null default '',
  payment_status text not null default 'unpaid' check (payment_status in ('unpaid', 'paid')),
  notes text not null default '',
  legacy_appwrite_id text unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists orders_user_idx on public.orders (user_id, created_at desc);
create index if not exists orders_created_idx on public.orders (created_at desc);

create table if not exists public.order_items (
  id text primary key default gen_random_uuid()::text,
  order_id text not null references public.orders (id) on delete cascade,
  medicine_id text references public.medicines (id) on delete set null,
  medicine_name text not null,
  quantity integer not null check (quantity > 0),
  unit_price numeric(12, 2) not null check (unit_price >= 0),
  subtotal numeric(12, 2) not null check (subtotal >= 0),
  legacy_appwrite_id text unique,
  created_at timestamptz not null default now()
);

create index if not exists order_items_order_idx on public.order_items (order_id);

-- All application writes go through trusted server actions. Client-side direct
-- access is denied; server-side service-role access bypasses RLS.
alter table public.profiles enable row level security;
alter table public.patients enable row level security;
alter table public.doctors enable row level security;
alter table public.medicines enable row level security;
alter table public.appointments enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;

-- Store patient identity scans in a private bucket. App access goes through
-- trusted server code using the Supabase service role; never expose these URLs.
insert into storage.buckets (id, name, public)
values ('patient-identification-documents', 'patient-identification-documents', false)
on conflict (id) do update set public = false;
