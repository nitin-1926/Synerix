-- Completes the RLS lockdown started in 20260606110146_enable_rls.
--
-- That migration covered the 16 tables that existed at the time. Every table
-- added since (NextAuth's accounts/sessions/verification_tokens, invites,
-- ai_models, api_cost_log, tests, test_results) was never enabled by any
-- migration. They ARE enabled on the Tokyo project — but by something outside
-- the migration history, so a freshly provisioned project (e.g. the ap-south-1
-- move) would come up with them exposed to the PostgREST Data API under the
-- anon key. Security that only holds by accident is not security.
--
-- Same model as before: the app reaches Postgres exclusively through Prisma as
-- the `postgres` role (table owner, unaffected by non-FORCE RLS), so enabling
-- RLS with NO policies is a pure deny-all for anon/authenticated over the Data
-- API and changes nothing for the application.
--
-- accounts/sessions/verification_tokens are the sharp end: they hold OAuth
-- refresh/access tokens and session material.

ALTER TABLE "accounts" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "sessions" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "verification_tokens" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "workspace_invites" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ai_models" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "api_cost_log" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "tests" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "test_results" ENABLE ROW LEVEL SECURITY;
