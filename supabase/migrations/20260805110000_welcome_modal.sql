-- ============================================================
-- GODS: First-login welcome modal (no onboarding existed at all before this --
-- /rules was only ever linked from /play, easy for a brand new player to never see)
-- ============================================================

alter table public.profiles add column if not exists has_seen_welcome boolean not null default false;

-- Backfill: existing players have already been playing, don't surprise them with a
-- "welcome, here's the basics" popup they don't need.
update public.profiles set has_seen_welcome = true where has_seen_welcome = false;

-- Self-only, low-stakes flag -- same posture as last_active_at.
grant update (username, avatar, needs_setup, last_active_at, has_seen_welcome) on public.profiles to authenticated;
