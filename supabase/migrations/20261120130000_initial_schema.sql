create extension if not exists btree_gist with schema extensions;

create type public.module_area as enum ('theory', 'lab', 'internship');
create type public.assessment_kind as enum ('intermediate_test', 'final_test', 'postponed_test');
create type public.calendar_event_kind as enum ('holiday', 'suspension', 'event', 'early_exit');
create type public.import_status as enum ('draft', 'applied', 'superseded', 'discarded');
create type public.import_row_kind as enum ('lesson', 'event');

create table public.course (
  id bigint generated always as identity primary key,
  code text not null unique,
  name text not null,
  edition text not null,
  venue text,
  timezone text not null default 'Europe/Rome'
);

create table public.module (
  id bigint generated always as identity primary key,
  course_id bigint not null references public.course (id) on delete cascade,
  name text not null,
  area public.module_area not null,
  semesters smallint[] not null default '{}',
  planned_hours smallint check (planned_hours > 0),
  in_curriculum boolean not null default true,
  sort_order smallint,
  unique (course_id, name, area)
);

create table public.module_alias (
  alias text primary key,
  module_id bigint not null references public.module (id) on delete cascade
);

create table public.teacher (
  id bigint generated always as identity primary key,
  full_name text not null unique
);

create table public.teacher_alias (
  alias text primary key,
  teacher_id bigint not null references public.teacher (id) on delete cascade
);

create table public.app_admin (
  user_id uuid primary key references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);

create function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (select 1 from public.app_admin where user_id = (select auth.uid()));
$$;

create table public.import_batch (
  id bigint generated always as identity primary key,
  course_id bigint not null references public.course (id) on delete cascade,
  file_name text not null,
  storage_path text not null,
  sha256 text not null,
  period_start date not null,
  period_end date not null,
  declared_hours numeric(5, 1),
  status public.import_status not null default 'draft',
  report jsonb not null default '{}',
  created_by uuid default auth.uid() references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  applied_at timestamptz,
  check (period_end >= period_start)
);

create unique index import_batch_applied_sha256_idx on public.import_batch (sha256) where status = 'applied';

create table public.import_row (
  id bigint generated always as identity primary key,
  batch_id bigint not null references public.import_batch (id) on delete cascade,
  kind public.import_row_kind not null,
  row_date date,
  start_time time,
  end_time time,
  raw_module text,
  raw_teacher text,
  module_key text,
  teacher_key text,
  module_id bigint references public.module (id),
  teacher_id bigint references public.teacher (id),
  assessment public.assessment_kind,
  event_kind public.calendar_event_kind,
  title text,
  note text,
  issues jsonb not null default '[]',
  page smallint,
  row_no smallint
);

create index import_row_batch_id_idx on public.import_row (batch_id);

create table public.lesson (
  id bigint generated always as identity primary key,
  course_id bigint not null references public.course (id) on delete cascade,
  module_id bigint not null references public.module (id),
  teacher_id bigint references public.teacher (id),
  lesson_date date not null,
  start_time time not null,
  end_time time not null,
  hours numeric(3, 1) generated always as (extract(epoch from end_time - start_time) / 3600) stored,
  assessment public.assessment_kind,
  note text,
  import_batch_id bigint references public.import_batch (id) on delete set null,
  edited_by uuid references auth.users (id) on delete set null,
  edited_at timestamptz,
  check (end_time > start_time),
  exclude using gist (
    course_id with =,
    tsrange(lesson_date + start_time, lesson_date + end_time) with &&
  )
);

create index lesson_module_id_idx on public.lesson (module_id);
create index lesson_teacher_id_idx on public.lesson (teacher_id);
create index lesson_import_batch_id_idx on public.lesson (import_batch_id);

create table public.calendar_event (
  id bigint generated always as identity primary key,
  course_id bigint not null references public.course (id) on delete cascade,
  event_date date not null,
  kind public.calendar_event_kind not null,
  title text not null,
  import_batch_id bigint references public.import_batch (id) on delete set null,
  edited_by uuid references auth.users (id) on delete set null,
  edited_at timestamptz,
  unique (course_id, event_date, title)
);

-- Rows written outside apply_import are manual edits.
create function public.mark_manual_edit()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if coalesce(current_setting('app.importing', true), '') <> 'on' then
    new.edited_by := (select auth.uid());
    new.edited_at := now();
  end if;
  return new;
end;
$$;

create trigger lesson_mark_manual_edit
before insert or update on public.lesson
for each row execute function public.mark_manual_edit();

create trigger calendar_event_mark_manual_edit
before insert or update on public.calendar_event
for each row execute function public.mark_manual_edit();

create view public.module_progress with (security_invoker = on) as
select
  m.id as module_id,
  m.course_id,
  m.name,
  m.area,
  m.planned_hours,
  coalesce(sum(l.hours), 0) as scheduled_hours,
  coalesce(sum(l.hours) filter (where l.lesson_date < current_date), 0) as done_hours,
  min(l.lesson_date) as first_lesson,
  max(l.lesson_date) as last_lesson,
  min(l.lesson_date) filter (where l.assessment = 'final_test') as final_test_date
from public.module m
left join public.lesson l on l.module_id = m.id
group by m.id;

create function public.create_import_batch(p_course_id bigint, p_file jsonb, p_rows jsonb)
returns bigint
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_id bigint;
begin
  if not public.is_admin() then
    raise exception 'not allowed' using errcode = '42501';
  end if;

  insert into public.import_batch (course_id, file_name, storage_path, sha256, period_start, period_end, declared_hours, report)
  values (
    p_course_id,
    p_file ->> 'file_name',
    p_file ->> 'storage_path',
    p_file ->> 'sha256',
    (p_file ->> 'period_start')::date,
    (p_file ->> 'period_end')::date,
    (p_file ->> 'declared_hours')::numeric,
    coalesce(p_file -> 'report', '{}')
  )
  returning id into v_id;

  insert into public.import_row (
    batch_id, kind, row_date, start_time, end_time, raw_module, raw_teacher, module_key, teacher_key,
    module_id, teacher_id, assessment, event_kind, title, note, issues, page, row_no
  )
  select
    v_id, r.kind, r.row_date, r.start_time, r.end_time, r.raw_module, r.raw_teacher, r.module_key, r.teacher_key,
    ma.module_id, ta.teacher_id, r.assessment, r.event_kind, r.title, r.note, coalesce(r.issues, '[]'), r.page, r.row_no
  from jsonb_to_recordset(p_rows) as r (
    kind public.import_row_kind, row_date date, start_time time, end_time time,
    raw_module text, raw_teacher text, module_key text, teacher_key text,
    assessment public.assessment_kind, event_kind public.calendar_event_kind,
    title text, note text, issues jsonb, page smallint, row_no smallint
  )
  left join public.module_alias ma on ma.alias = r.module_key
  left join public.teacher_alias ta on ta.alias = r.teacher_key;

  return v_id;
end;
$$;

create function public.apply_import(p_batch_id bigint)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  b public.import_batch;
begin
  if not public.is_admin() then
    raise exception 'not allowed' using errcode = '42501';
  end if;

  select * into b from public.import_batch where id = p_batch_id and status = 'draft' for update;
  if not found then
    raise exception 'batch % is not a draft', p_batch_id;
  end if;

  if exists (
    select 1 from public.import_row r
    where r.batch_id = p_batch_id
      and (
        r.row_date is null
        or r.row_date not between b.period_start and b.period_end
        or (r.kind = 'lesson' and (r.module_id is null or r.start_time is null or r.end_time is null))
        or (r.kind = 'event' and (r.event_kind is null or r.title is null))
      )
  ) then
    raise exception 'batch % has unresolved rows', p_batch_id;
  end if;

  perform set_config('app.importing', 'on', true);

  delete from public.lesson
  where course_id = b.course_id and lesson_date between b.period_start and b.period_end;
  delete from public.calendar_event
  where course_id = b.course_id and event_date between b.period_start and b.period_end;

  insert into public.lesson (course_id, module_id, teacher_id, lesson_date, start_time, end_time, assessment, note, import_batch_id)
  select b.course_id, r.module_id, r.teacher_id, r.row_date, r.start_time, r.end_time, r.assessment, r.note, b.id
  from public.import_row r
  where r.batch_id = p_batch_id and r.kind = 'lesson';

  insert into public.calendar_event (course_id, event_date, kind, title, import_batch_id)
  select b.course_id, r.row_date, r.event_kind, r.title, b.id
  from public.import_row r
  where r.batch_id = p_batch_id and r.kind = 'event';

  insert into public.module_alias (alias, module_id)
  select distinct r.module_key, r.module_id
  from public.import_row r
  where r.batch_id = p_batch_id and r.module_key is not null and r.module_id is not null
  on conflict (alias) do nothing;

  insert into public.teacher_alias (alias, teacher_id)
  select distinct r.teacher_key, r.teacher_id
  from public.import_row r
  where r.batch_id = p_batch_id and r.teacher_key is not null and r.teacher_id is not null
  on conflict (alias) do nothing;

  update public.import_batch
  set status = 'superseded'
  where course_id = b.course_id
    and status = 'applied'
    and daterange(period_start, period_end, '[]') && daterange(b.period_start, b.period_end, '[]');

  update public.import_batch set status = 'applied', applied_at = now() where id = p_batch_id;

  perform set_config('app.importing', 'off', true);
end;
$$;

revoke execute on function public.is_admin() from public, anon;
revoke execute on function public.create_import_batch(bigint, jsonb, jsonb) from public, anon;
revoke execute on function public.apply_import(bigint) from public, anon;
grant execute on function public.is_admin() to authenticated;
grant execute on function public.create_import_batch(bigint, jsonb, jsonb) to authenticated;
grant execute on function public.apply_import(bigint) to authenticated;

alter table public.course enable row level security;
alter table public.module enable row level security;
alter table public.module_alias enable row level security;
alter table public.teacher enable row level security;
alter table public.teacher_alias enable row level security;
alter table public.app_admin enable row level security;
alter table public.import_batch enable row level security;
alter table public.import_row enable row level security;
alter table public.lesson enable row level security;
alter table public.calendar_event enable row level security;

grant select on public.course, public.module, public.teacher, public.lesson, public.calendar_event to authenticated;
grant select on public.module_progress to authenticated;
grant insert, update, delete on public.module, public.teacher to authenticated;
grant select, insert, update, delete on public.module_alias, public.teacher_alias to authenticated;
grant select, update, delete on public.import_batch, public.import_row to authenticated;
grant select on public.app_admin to authenticated;
grant insert, update, delete on public.lesson, public.calendar_event to authenticated;

create policy "Calendar is readable" on public.course for select to authenticated using (true);
create policy "Calendar is readable" on public.module for select to authenticated using (true);
create policy "Calendar is readable" on public.teacher for select to authenticated using (true);
create policy "Calendar is readable" on public.lesson for select to authenticated using (true);
create policy "Calendar is readable" on public.calendar_event for select to authenticated using (true);

create policy "Admins insert modules" on public.module for insert to authenticated with check ((select public.is_admin()));
create policy "Admins update modules" on public.module for update to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));
create policy "Admins delete modules" on public.module for delete to authenticated using ((select public.is_admin()));
create policy "Admins insert teachers" on public.teacher for insert to authenticated with check ((select public.is_admin()));
create policy "Admins update teachers" on public.teacher for update to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));
create policy "Admins delete teachers" on public.teacher for delete to authenticated using ((select public.is_admin()));
create policy "Admins manage module aliases" on public.module_alias for all to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));
create policy "Admins manage teacher aliases" on public.teacher_alias for all to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));
create policy "Admins manage import batches" on public.import_batch for all to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));
create policy "Admins manage import rows" on public.import_row for all to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));
create policy "Admins insert lessons" on public.lesson for insert to authenticated with check ((select public.is_admin()));
create policy "Admins update lessons" on public.lesson for update to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));
create policy "Admins delete lessons" on public.lesson for delete to authenticated using ((select public.is_admin()));
create policy "Admins insert events" on public.calendar_event for insert to authenticated with check ((select public.is_admin()));
create policy "Admins update events" on public.calendar_event for update to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));
create policy "Admins delete events" on public.calendar_event for delete to authenticated using ((select public.is_admin()));
create policy "Admins see admins" on public.app_admin for select to authenticated using ((select public.is_admin()));

insert into storage.buckets (id, name, public) values ('calendar-sources', 'calendar-sources', false);

create policy "Admins manage calendar sources" on storage.objects for all to authenticated
  using (bucket_id = 'calendar-sources' and (select public.is_admin()))
  with check (bucket_id = 'calendar-sources' and (select public.is_admin()));

revoke all on all tables in schema public from anon;
revoke all on all sequences in schema public from anon;
revoke execute on all functions in schema public from anon;
