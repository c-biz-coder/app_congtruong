-- Supabase local seed aggregator.
-- Runs all domain seed files in order via psql \i includes.
\i 'supabase/seed/roles.sql'
\i 'supabase/seed/permissions.sql'
\i 'supabase/seed/role_permissions.sql'
\i 'supabase/seed/demo.sql'