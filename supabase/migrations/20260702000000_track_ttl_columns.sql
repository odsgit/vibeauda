-- ============================================================
-- Storage TTL support: track last access + an "expired" status
-- ============================================================

-- Tracks a track's most recent view/open, so the cleanup-stale-tracks
-- Edge Function can find tracks nobody has touched in N days.
-- The app must call `update tracks set last_accessed_at = now() ...`
-- whenever a track is opened; this migration only adds the column.
alter table tracks add column last_accessed_at timestamptz not null default now();

-- 'expired': original audio (and its stems) has been deleted by the TTL
-- cleanup job. tracks/sheets rows are kept so notation/lyrics stay
-- accessible even after the source audio is gone.
alter type track_status add value 'expired';

-- file_url becomes unset once the underlying Storage object is deleted.
alter table tracks alter column file_url drop not null;
