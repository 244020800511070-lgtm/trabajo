-- Red List: catálogo de productos
-- Ejecuta todo este script en: Supabase → SQL Editor → New query → Run

-- Extensión para gen_random_uuid() (en proyectos nuevos suele estar ya habilitada)
create extension if not exists "pgcrypto";

create table public.products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  detail text not null default '',
  value text not null default '',
  created_at timestamptz not null default now()
);

comment on table public.products is 'Artículos del catálogo Red List';
comment on column public.products.name is 'Nombre del producto';
comment on column public.products.detail is 'Descripción o detalle';
comment on column public.products.value is 'Valor mostrado (texto; ej. moneda o número como string)';

create index products_created_at_idx on public.products (created_at desc);

alter table public.products enable row level security;

-- Políticas pensadas para app sin login (solo clave anon en el navegador).
-- Cualquiera con la URL del proyecto y la anon key puede leer/insertar.
-- Cuando añadas autenticación, sustituye por políticas por usuario (auth.uid()).
create policy "products_select_public"
  on public.products
  for select
  using (true);

create policy "products_insert_public"
  on public.products
  for insert
  with check (true);
