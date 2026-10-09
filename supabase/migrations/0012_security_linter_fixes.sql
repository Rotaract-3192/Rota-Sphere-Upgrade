-- Fixes for Supabase Security Linter Warnings

-- 1. Function Search Path Mutable
-- Setting search_path explicitly prevents search path injection attacks.
ALTER FUNCTION public.update_push_sub_updated_at() SET search_path = '';
ALTER FUNCTION public.update_updated_at_col() SET search_path = '';
ALTER FUNCTION public.set_updated_at() SET search_path = '';
ALTER FUNCTION public.get_auth_club_id() SET search_path = '';
ALTER FUNCTION public.auth_has_role(VARIADIC text[]) SET search_path = '';
ALTER FUNCTION public.handle_new_user() SET search_path = '';

-- 2. Materialized View in API
-- Revokes API access (anon/authenticated) to the materialized view so it isn't publicly exposed.
REVOKE ALL ON public.leaderboard_rankings FROM anon, authenticated;

-- 3. Public Can Execute SECURITY DEFINER Function (For handle_new_user)
-- The handle_new_user function is an auth trigger, it should not be executable via API.
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
