-- Rollback for 20260923000010_audit_log.sql.
-- Refuses to drop the table when audit rows exist: audit data is never deleted by rollback.
do $$
begin
  if exists (select 1 from public.audit_log) then
    raise exception 'audit_log has rows; rollback refused to keep audit history';
  end if;
end;
$$;

drop policy if exists "audit log readable by tenant administrators" on public.audit_log;
drop function if exists public.can_read_audit(uuid);
drop function if exists public.write_audit(text, text, text, uuid, uuid, uuid, jsonb, text);
drop function if exists public.audit_payload_allowed(jsonb);
drop table if exists public.audit_log;
drop function if exists public.audit_log_block_mutation();
