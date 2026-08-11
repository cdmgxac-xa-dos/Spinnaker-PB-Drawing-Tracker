-- Locks Landco (the project owner, per the Excel header — "OWNER: LANDCO
-- PACIFIC CORPORATION") down to exactly the same curated, read-only data
-- the public Client Transparency Dashboard shows: progress, status, dates,
-- approved PDFs and formal review events. Landco is explicitly NOT part of
-- the workflow, so — unlike XA/Draftsman/DAAA/GPI — they get no direct
-- access to drawing_items/drawing_pdfs/review_history at all; they only
-- ever read through the client_dashboard_* views (already granted to
-- `authenticated` in 01_schema.sql).
--
-- Run this only after 04_add_landco_role.sql has been committed.

drop policy if exists drawing_items_select on drawing_items;
create policy drawing_items_select on drawing_items
  for select to authenticated
  using (app_current_role() <> 'landco');

drop policy if exists drawing_pdfs_select on drawing_pdfs;
create policy drawing_pdfs_select on drawing_pdfs
  for select to authenticated
  using (app_current_role() <> 'landco');

drop policy if exists review_history_select on review_history;
create policy review_history_select on review_history
  for select to authenticated
  using (app_current_role() <> 'landco');

-- Landco can still read their own profile row (needed to load their name/
-- role on login) but not the internal staff roster.
drop policy if exists profiles_select on profiles;
create policy profiles_select on profiles
  for select to authenticated
  using (auth.uid() = id or app_current_role() <> 'landco');
