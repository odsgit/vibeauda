// Supabase Edge Function: deletes original audio + stem files in Storage for
// tracks nobody has opened in `STALE_DAYS` days. Rows in `tracks` (marked
// status='expired', file_url=null) and `sheets` are kept — only the audio
// itself and the `stems` metadata rows are removed, per the Storage-capacity
// risk mitigation in the project plan.
//
// Deploy:   supabase functions deploy cleanup-stale-tracks --no-verify-jwt
// Schedule: see ./schedule.sql (run once, manually, in the Supabase SQL editor)
import { createClient } from 'jsr:@supabase/supabase-js@2';

const STALE_DAYS = 90;
const AUDIO_TRACKS_BUCKET = 'audio-tracks';
const AUDIO_STEMS_BUCKET = 'audio-stems';

Deno.serve(async (req) => {
  const cronSecret = Deno.env.get('CRON_SECRET');
  if (cronSecret && req.headers.get('Authorization') !== `Bearer ${cronSecret}`) {
    return new Response('Unauthorized', { status: 401 });
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  );

  const cutoff = new Date(Date.now() - STALE_DAYS * 24 * 60 * 60 * 1000).toISOString();

  const { data: staleTracks, error: tracksError } = await supabase
    .from('tracks')
    .select('id, file_url')
    .lt('last_accessed_at', cutoff)
    .neq('status', 'expired');

  if (tracksError) {
    return new Response(JSON.stringify({ error: tracksError.message }), { status: 500 });
  }

  let deletedTrackFiles = 0;
  let deletedStemFiles = 0;
  let deletedStemRows = 0;

  for (const track of staleTracks ?? []) {
    if (track.file_url) {
      const { error: removeError } = await supabase.storage
        .from(AUDIO_TRACKS_BUCKET)
        .remove([track.file_url]);
      if (!removeError) deletedTrackFiles += 1;
    }

    const { data: stems } = await supabase
      .from('stems')
      .select('id, file_url')
      .eq('track_id', track.id);

    if (stems && stems.length > 0) {
      const stemPaths = stems.map((stem) => stem.file_url);
      const { error: stemRemoveError } = await supabase.storage
        .from(AUDIO_STEMS_BUCKET)
        .remove(stemPaths);
      if (!stemRemoveError) deletedStemFiles += stemPaths.length;

      const { error: stemDeleteError, count } = await supabase
        .from('stems')
        .delete({ count: 'exact' })
        .eq('track_id', track.id);
      if (!stemDeleteError) deletedStemRows += count ?? 0;
    }

    await supabase
      .from('tracks')
      .update({ file_url: null, status: 'expired' })
      .eq('id', track.id);
  }

  return new Response(
    JSON.stringify({
      staleTracksProcessed: staleTracks?.length ?? 0,
      deletedTrackFiles,
      deletedStemFiles,
      deletedStemRows,
    }),
    { headers: { 'Content-Type': 'application/json' } },
  );
});
