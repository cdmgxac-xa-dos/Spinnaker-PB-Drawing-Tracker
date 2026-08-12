-- =============================================================================
-- XA — batch assign draftsman + target date across multiple drawing items
-- in one action, instead of opening each item individually.
--
-- Same logic as xa_assign_draftsman (per-item), just looped in a single
-- transaction: draftsman must actually be a draftsman, each item's
-- revision_number bumps if it was in revision_required, status becomes
-- 'assigned', and each item gets its own audit-trail entry so the timeline
-- stays accurate per drawing.
-- =============================================================================

create or replace function xa_bulk_assign_draftsman(
  p_item_ids uuid[],
  p_draftsman_id uuid,
  p_target_date date default null,
  p_comments text default null
) returns integer
language plpgsql security definer set search_path = public as $$
declare
  v_item_id uuid;
  v_old_status drawing_status;
  v_draftsman_role app_role;
  v_count integer := 0;
begin
  if app_current_role() <> 'xa_admin' then
    raise exception 'Only XA can assign draftsmen' using errcode = '42501';
  end if;

  select role into v_draftsman_role from profiles where id = p_draftsman_id;
  if v_draftsman_role is distinct from 'draftsman' then
    raise exception 'Target user is not a draftsman';
  end if;

  if p_item_ids is null or array_length(p_item_ids, 1) is null then
    raise exception 'No drawing items selected';
  end if;

  foreach v_item_id in array p_item_ids loop
    select status into v_old_status from drawing_items where id = v_item_id;
    if not found then
      continue;
    end if;

    update drawing_items set
      assigned_draftsman = p_draftsman_id,
      target_submission_date = coalesce(p_target_date, target_submission_date),
      status = 'assigned',
      revision_number = case when v_old_status = 'revision_required' then revision_number + 1 else revision_number end
    where id = v_item_id;

    perform log_review(
      v_item_id,
      (case when v_old_status = 'revision_required' then 'revision_reassigned' else 'assigned' end)::review_action,
      p_comments
    );
    v_count := v_count + 1;
  end loop;

  return v_count;
end;
$$;

revoke execute on function xa_bulk_assign_draftsman(uuid[], uuid, date, text) from public;
grant execute on function xa_bulk_assign_draftsman(uuid[], uuid, date, text) to authenticated;
