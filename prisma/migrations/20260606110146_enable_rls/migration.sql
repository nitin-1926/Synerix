-- Security hardening: the app accesses Postgres exclusively through Prisma
-- (postgres role = table owner, unaffected by non-FORCE RLS). Enabling RLS
-- with NO policies denies all access via PostgREST (anon/authenticated),
-- which would otherwise expose these tables through the Supabase Data API.

ALTER TABLE "users" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "workspaces" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "memberships" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "brands" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "brand_assets" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "products" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "product_images" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "festivals" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "festival_occurrences" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "calendar_entries" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "generation_runs" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "creatives" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "creative_renders" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "creative_versions" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "workspace_credits" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "credit_ledger" ENABLE ROW LEVEL SECURITY;
