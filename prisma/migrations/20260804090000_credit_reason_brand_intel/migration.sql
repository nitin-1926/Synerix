-- Brand Creative Intelligence refresh is now a user-triggered, paid action, so
-- its ledger entries need their own reason. Without this the spend would be
-- indistinguishable from generation in /admin/costs and the credit ledger.
ALTER TYPE "CreditReason" ADD VALUE IF NOT EXISTS 'BRAND_INTEL';
