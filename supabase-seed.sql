-- Seed data: varied payment statuses and periods
-- Run after main setup completes

-- Ensure we have members
insert into members (name) values
  ('Ahmad Fauzi'),
  ('Budi Santoso'),
  ('Citra Dewi'),
  ('Dian Pratama'),
  ('Eko Wijaya'),
  ('Fajar Rahman'),
  ('Gita Sari'),
  ('Hendra Wijaya')
on conflict (name) do nothing;

-- Generate payments for Nov 2026 (current, 6 days late from Nov 2)
insert into payments (member_id, period, amount, status, proof_path, submitted_at, verified_at, note)
select 
  m.id,
  '2026-11',
  10000,
  case 
    when m.name = 'Ahmad Fauzi' then 'paid'
    when m.name = 'Budi Santoso' then 'paid'
    when m.name = 'Citra Dewi' then 'pending'
    when m.name = 'Dian Pratama' then 'pending'
    when m.name = 'Eko Wijaya' then 'rejected'
    else 'unpaid'
  end,
  case 
    when m.name in ('Ahmad Fauzi', 'Budi Santoso', 'Citra Dewi', 'Dian Pratama', 'Eko Wijaya') 
    then 'proofs/2026-11/' || m.id::text || '/example.jpg'
    else null
  end,
  case 
    when m.name in ('Ahmad Fauzi', 'Budi Santoso', 'Citra Dewi', 'Dian Pratama', 'Eko Wijaya')
    then now() - interval '2 days'
    else null
  end,
  case 
    when m.name in ('Ahmad Fauzi', 'Budi Santoso') then now() - interval '1 day'
    else null
  end,
  case
    when m.name = 'Eko Wijaya' then 'Bukti tidak jelas, nominal tidak sesuai'
    else null
  end
from members m
on conflict (member_id, period) do update set
  status = excluded.status,
  proof_path = excluded.proof_path,
  submitted_at = excluded.submitted_at,
  verified_at = excluded.verified_at,
  note = excluded.note;

-- Oct 2026 (31 days late - deadline Oct 2)
insert into payments (member_id, period, amount, status, verified_at)
select 
  m.id,
  '2026-10',
  10000,
  'paid',
  '2026-10-25'::timestamptz
from members m
where m.name in ('Ahmad Fauzi', 'Budi Santoso', 'Citra Dewi', 'Dian Pratama', 'Eko Wijaya')
on conflict (member_id, period) do nothing;

-- Sep 2026 (3 days late - deadline Sep 2, current date Nov 8 = 67 days late but for sep context)
-- Treat as "3 hari late" contoh
insert into payments (member_id, period, amount, status, proof_path, submitted_at, verified_at)
select 
  m.id,
  '2026-09',
  10000,
  'paid',
  'proofs/2026-09/' || m.id::text || '/bukti.jpg',
  '2026-09-05'::timestamptz,
  '2026-09-06'::timestamptz
from members m
where m.name in ('Fajar Rahman', 'Gita Sari')
on conflict (member_id, period) do nothing;

-- Aug 2026 (0 hari late - on time, deadline Aug 2)
insert into payments (member_id, period, amount, status, verified_at)
select 
  m.id,
  '2026-08',
  10000,
  'paid',
  '2026-08-02'::timestamptz
from members m
where m.name in ('Hendra Wijaya', 'Ahmad Fauzi')
on conflict (member_id, period) do nothing;

