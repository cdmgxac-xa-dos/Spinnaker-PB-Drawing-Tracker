-- Adds the Landco (project owner) role. Must run alone, in its own
-- transaction/execution, before 05_landco_permissions.sql — Postgres
-- forbids comparing against a brand-new enum value in the same
-- transaction that added it.
alter type app_role add value if not exists 'landco';
