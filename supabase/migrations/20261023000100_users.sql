do $$
begin
  if to_regclass('public.users') is null and to_regclass('public.profiles') is not null then
    alter table public.profiles rename to users;
  end if;
end;
$$;

drop index if exists public.profiles_student_id_unique;

create table if not exists public.users (
  id uuid primary key references auth.users (id) on delete cascade,
  first_name text not null,
  last_name text not null,
  student_id text not null,
  role text not null default 'student' check (role in ('student', 'admin')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint users_first_name_not_blank check (length(trim(first_name)) > 0),
  constraint users_last_name_not_blank check (length(trim(last_name)) > 0),
  constraint users_student_id_not_blank check (length(trim(student_id)) > 0)
);

create unique index if not exists users_student_id_unique
  on public.users (lower(student_id));

alter table public.users enable row level security;

revoke all on public.users from anon;
grant select on public.users to authenticated;

drop policy if exists "Users can read their own profile" on public.users;
drop policy if exists "Users can read their own record" on public.users;
create policy "Users can read their own record"
  on public.users
  for select
  to authenticated
  using ((select auth.uid()) = id);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.users (id, first_name, last_name, student_id)
  values (
    new.id,
    trim(coalesce(new.raw_user_meta_data ->> 'first_name', '')),
    trim(coalesce(new.raw_user_meta_data ->> 'last_name', '')),
    trim(coalesce(new.raw_user_meta_data ->> 'student_id', ''))
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

insert into public.users (id, first_name, last_name, student_id)
select
  id,
  trim(raw_user_meta_data ->> 'first_name'),
  trim(raw_user_meta_data ->> 'last_name'),
  trim(raw_user_meta_data ->> 'student_id')
from auth.users
where length(trim(coalesce(raw_user_meta_data ->> 'first_name', ''))) > 0
  and length(trim(coalesce(raw_user_meta_data ->> 'last_name', ''))) > 0
  and length(trim(coalesce(raw_user_meta_data ->> 'student_id', ''))) > 0
on conflict do nothing;
