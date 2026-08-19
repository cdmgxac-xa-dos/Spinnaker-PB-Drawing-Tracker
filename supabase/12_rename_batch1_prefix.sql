-- =============================================================================
-- One-time migration: prefix live Batch 1 item numbers with "B1-" to match
-- Batch 2's "B2-" prefix (added after Batch 2 was already live, so Batch 1's
-- original seed predates the convention).
--
-- Only touches rows tagged batch = 'BATCH 1' that aren't already prefixed —
-- safe to re-run, and does not touch Batch 2 or any other data.
-- =============================================================================

update drawing_items
set item_no = 'B1-' || item_no
where batch = 'BATCH 1'
  and item_no !~ '^B1-';
