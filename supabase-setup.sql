-- Create members table
create table if not exists members (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  active boolean not null default true,
  created_at timestamptz default now()
);

-- Create payments table
create table if not exists payments (
  id uuid primary key default gen_random_uuid(),
  member_id uuid not null references members(id) on delete restrict,
  period char(7) not null,
  amount integer not null default 10000,
  status text not null default 'unpaid' check (status in ('unpaid','pending','paid','rejected')),
  proof_path text,
  note text,
  submitted_at timestamptz,
  verified_at timestamptz,
  unique (member_id, period)
);

-- Create indexes if not exist
drop index if exists payments_period_idx;
create index if not exists payments_period_idx on payments(period);
drop index if exists payments_status_idx;
create index if not exists payments_status_idx on payments(status);
drop index if exists payments_member_period_idx;
create index if not exists payments_member_period_idx on payments(member_id, period);

-- Create storage bucket for proof images
insert into storage.buckets (id, name, public) 
values ('proofs', 'proofs', false)
on conflict (id) do nothing;

-- Storage policies: drop then create
drop policy if exists "Anon can upload proofs" on storage.objects;
create policy "Anon can upload proofs"
on storage.objects for insert
to anon
with check (bucket_id = 'proofs');

drop policy if exists "Authenticated can view proofs" on storage.objects;
create policy "Authenticated can view proofs"
on storage.objects for select
to authenticated
using (bucket_id = 'proofs');

-- RLS policies
alter table members enable row level security;
alter table payments enable row level security;

drop policy if exists "Anyone can read members" on members;
create policy "Anyone can read members"
on members for select
to anon
using (active = true);

drop policy if exists "Anyone can read payments" on payments;
create policy "Anyone can read payments"
on payments for select
to anon
using (true);

-- Insert sample members
insert into members (name) values
  ('Ahmad Fauzi'),
  ('Budi Santoso'),
  ('Citra Dewi'),
  ('Dian Pratama'),
  ('Eko Wijaya')
on conflict (name) do nothing;

-- Auto-generate payments for current month
insert into payments (member_id, period)
select id, to_char(now(), 'YYYY-MM')
from members
where active = true
on conflict (member_id, period) do nothing;
