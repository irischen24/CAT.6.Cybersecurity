/* CAT.6 deployment configuration.
 * LOCAL / DEMO mode (default): data is kept in this browser's localStorage — nothing leaves the device.
 * SUPABASE mode: set backend to 'supabase' and fill url / anonKey / organizationId, then sign in from
 * Assessment Setup → Workspace & Data. Only the PUBLIC anon key belongs here — never a service_role key,
 * password or other secret. Row Level Security in supabase/schema.sql protects the data. */
CAT6.config = {
  backend: 'local',              // 'local' | 'supabase'
  supabase: { url: '', anonKey: '', organizationId: '' },
  storagePrefix: 'cat6:v2:'
};
