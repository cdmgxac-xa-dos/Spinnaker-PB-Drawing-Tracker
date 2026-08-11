-- Adds the 'status_corrected' review_action value used by xa_set_status()
-- in 09_xa_set_status.sql. Must run alone, in its own transaction/
-- execution, before that file — Postgres forbids comparing against a
-- brand-new enum value in the same transaction that added it.
alter type review_action add value if not exists 'status_corrected';
