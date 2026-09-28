/* CAT.6 deployment configuration.
 * LOCAL / DEMO mode (default): data is kept in this browser's localStorage — nothing leaves the device.
 * SUPABASE mode: set backend to 'supabase' and fill url / anonKey / organizationId, then sign in from
 * Assessment Setup → Workspace & Data. Only the PUBLIC anon key belongs here — never a service_role key,
 * password or other secret. Row Level Security in supabase/schema.sql protects the data. */
CAT6.config = {
  backend: 'supabase',           // 'local' | 'supabase'
  supabase: {
    url: 'https://vzgbopbnzodttkxufkoa.supabase.co',   // project URL (without /rest/v1)
    anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ6Z2JvcGJuem9kdHRreHVma29hIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTA1MjY5NTgsImV4cCI6MjEwNjEwMjk1OH0.nZ_OTnXY4mjv0nT0NM3qCxpbzXsX_UoT6F_EmYZ5Www',
    organizationId: ''                                  // fill with organizations.id after running supabase/schema.sql
  },
  storagePrefix: 'cat6:v2:'
};
