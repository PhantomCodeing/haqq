create table public.click_stats (
  id uuid not null default gen_random_uuid (),
  created_at timestamp with time zone not null default now(),
  event_type text not null,
  element_selector text null,
  url text null,
  session_id text null,
  constraint click_stats_pkey primary key (id)
) tablespace pg_default;
