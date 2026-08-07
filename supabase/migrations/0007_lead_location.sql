-- Location captured with the lead before a face scan.
--
-- The scan lead-gate now asks for name + mobile + location (city/area), so the
-- sales team knows roughly where a lead is when they follow up. Free text,
-- nullable — older leads have none, and it is never required to store a lead.

alter table public.leads
  add column if not exists location text;
