-- ============================================================
-- GODS: fix ambiguous bump_daily_quest_progress overload
--
-- The previous migration added a 3rd defaulted parameter via CREATE OR REPLACE, expecting it
-- to replace the existing 2-parameter function. It didn't -- Postgres treats
-- bump_daily_quest_progress(uuid, boolean) and bump_daily_quest_progress(uuid, boolean,
-- text[]) as distinct overloads, so both ended up coexisting, and any 2-argument call (like
-- leave-game's, which was never updated to pass p_gods_used) became ambiguous: "Could not
-- choose the best candidate function". Caught immediately by the verification script before
-- this ever reached leave-game in production. Explicitly drops the old 2-arg overload so only
-- the 3-arg (with default) version remains.
-- ============================================================

drop function if exists public.bump_daily_quest_progress(uuid, boolean);
