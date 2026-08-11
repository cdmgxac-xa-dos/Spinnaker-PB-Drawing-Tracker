-- Adds a "batch" grouping level above category (e.g. delivery/procurement
-- batches like "BATCH 1"), separate from the equipment-type category that
-- already groups items within a batch.
alter table drawing_items add column if not exists batch text;
create index if not exists idx_drawing_items_batch on drawing_items (batch);

-- CREATE OR REPLACE VIEW can only append columns at the end, not insert one
-- in the middle of the existing list, so drop and recreate instead.
drop view if exists client_dashboard_view;
create view client_dashboard_view as
select
  di.id,
  di.item_no,
  di.description,
  di.category,
  di.batch,
  di.unit,
  di.qty,
  di.target_submission_date,
  di.status,
  di.submission_date,
  di.approval_date,
  di.revision_number
from drawing_items di;

grant select on client_dashboard_view to anon, authenticated;
