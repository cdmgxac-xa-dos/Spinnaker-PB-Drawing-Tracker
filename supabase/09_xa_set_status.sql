-- =============================================================================
-- XA — direct status correction ("undo" for accidental clicks).
--
-- Every other status change goes through a workflow RPC that only allows
-- specific from -> to transitions for a specific role (draftsman_start_task,
-- daaa_review, gpi_review, etc.) — that's deliberate, it's what makes the
-- audit trail meaningful. But someone will always fat-finger a button, and
-- the spec already gives XA general authority to "Update internal status"
-- (section 3, XA Drawing Management). This is that: XA can set a drawing to
-- any status directly, logged distinctly from a normal transition so the
-- audit trail still shows it was a manual correction, not a real workflow
-- event.
-- =============================================================================

create or replace function xa_set_status(p_item_id uuid, p_status drawing_status, p_comments text default null)
returns drawing_items
language plpgsql security definer set search_path = public as $$
declare
  v_row drawing_items;
  v_old_status drawing_status;
begin
  if app_current_role() <> 'xa_admin' then
    raise exception 'Only XA can correct a drawing''s status' using errcode = '42501';
  end if;

  select status into v_old_status from drawing_items where id = p_item_id;
  if not found then
    raise exception 'Drawing item not found';
  end if;

  update drawing_items set status = p_status where id = p_item_id
  returning * into v_row;

  perform log_review(
    v_row.id,
    'status_corrected',
    trim(both ' ' from
      concat('Corrected from "', v_old_status, '" to "', p_status, '"', case when p_comments is not null and length(trim(p_comments)) > 0 then ' — ' || p_comments else '' end)
    )
  );
  return v_row;
end;
$$;

revoke execute on function xa_set_status(uuid, drawing_status, text) from public;
grant execute on function xa_set_status(uuid, drawing_status, text) to authenticated;

-- Manual corrections are internal housekeeping, not a real workflow
-- milestone — keep them out of the client/Landco-facing timeline the same
-- way free-form remarks already are.
drop view if exists client_dashboard_timeline;
create view client_dashboard_timeline as
select
  rh.drawing_item_id,
  rh.date,
  rh.action,
  case when rh.action = 'remark_added' then null else rh.comments end as comments,
  rh.role
from review_history rh
where rh.action not in ('remark_added', 'status_corrected');

grant select on client_dashboard_timeline to anon, authenticated;
