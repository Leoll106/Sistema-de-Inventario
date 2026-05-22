-- ============================================================
-- STOCKFLOW — Schema Supabase
-- Ejecuta este script en: Supabase Dashboard → SQL Editor
-- ============================================================

-- ────────────────────────────────────────────────────────────
-- 1. TABLA: profiles (extiende auth.users con rol y datos extra)
-- ────────────────────────────────────────────────────────────
create table public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  full_name   text not null,
  role        text not null default 'viewer' check (role in ('admin','bodeguero','viewer')),
  active      boolean not null default true,
  created_at  timestamptz default now()
);

-- Trigger: al crear usuario en auth, crea su perfil automáticamente
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (id, full_name, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data->>'role', 'viewer')
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ────────────────────────────────────────────────────────────
-- 2. TABLA: categories
-- ────────────────────────────────────────────────────────────
create table public.categories (
  id          serial primary key,
  name        text not null unique,
  created_at  timestamptz default now()
);

insert into public.categories (name) values
  ('Construcción'), ('Eléctrico'), ('Plomería'),
  ('Herramientas'), ('Pintura'), ('Ferretería'), ('Oficina'), ('Limpieza');

-- ────────────────────────────────────────────────────────────
-- 3. TABLA: products
-- ────────────────────────────────────────────────────────────
create table public.products (
  id          uuid primary key default gen_random_uuid(),
  code        text not null unique,
  name        text not null,
  category_id integer references public.categories(id),
  unit        text not null default 'Unidad',
  location    text not null default 'Sin asignar',
  stock       integer not null default 0 check (stock >= 0),
  min_stock   integer not null default 0 check (min_stock >= 0),
  price       numeric(10,2) not null default 0,
  active      boolean not null default true,
  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
);

-- Trigger: actualiza updated_at automáticamente
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end;
$$;

create trigger products_updated_at
  before update on public.products
  for each row execute procedure public.set_updated_at();

-- Datos de ejemplo
insert into public.products (code, name, category_id, unit, location, stock, min_stock, price) values
  ('PRD-001', 'Cemento Portland 42.5',  1, 'Bolsa',     'A-01', 45,  20, 320),
  ('PRD-002', 'Varilla Corrugada 3/8"', 1, 'Unidad',    'B-02', 180, 50, 85),
  ('PRD-003', 'Cable THW #12',          2, 'Metro',     'C-01', 8,   30, 12),
  ('PRD-004', 'Tubería PVC 4"',         3, 'Metro',     'D-03', 62,  25, 95),
  ('PRD-005', 'Lija #80',               4, 'Pliego',    'E-01', 3,   15, 8),
  ('PRD-006', 'Pintura Látex Blanca',   5, 'Galón',     'F-02', 28,  10, 450),
  ('PRD-007', 'Tornillo Drywall 1"',    6, 'Caja x100', 'G-01', 95,  20, 35),
  ('PRD-008', 'Clavos 2"',              6, 'Kg',        'G-02', 12,  5,  28);

-- ────────────────────────────────────────────────────────────
-- 4. TABLA: movements (historial de entradas/salidas)
-- ────────────────────────────────────────────────────────────
create table public.movements (
  id          uuid primary key default gen_random_uuid(),
  product_id  uuid not null references public.products(id),
  type        text not null check (type in ('ENTRADA','SALIDA','AJUSTE')),
  quantity    integer not null check (quantity > 0),
  reference   text,
  notes       text,
  balance     integer not null,
  user_id     uuid references auth.users(id),
  user_name   text,
  created_at  timestamptz default now()
);

-- ────────────────────────────────────────────────────────────
-- 5. ROW LEVEL SECURITY (RLS)
-- ────────────────────────────────────────────────────────────

-- Habilitar RLS en todas las tablas
alter table public.profiles  enable row level security;
alter table public.products   enable row level security;
alter table public.categories enable row level security;
alter table public.movements  enable row level security;

-- Helper function: obtener rol del usuario actual
create or replace function public.get_user_role()
returns text language sql security definer stable as $$
  select role from public.profiles where id = auth.uid() and active = true;
$$;

create or replace function public.validate_safe_text(
  p_value text,
  p_field text,
  p_max_length integer
) returns text language plpgsql immutable as $$
declare
  v_value text;
begin
  v_value := btrim(coalesce(p_value, ''));

  if v_value = '' then
    raise exception '% es requerido', p_field;
  end if;

  if char_length(v_value) > p_max_length then
    raise exception '% supera el maximo de % caracteres', p_field, p_max_length;
  end if;

  if v_value ~ '[<>{}`]' or v_value ~ '[[:cntrl:]]' then
    raise exception '% contiene caracteres no permitidos', p_field;
  end if;

  return v_value;
end;
$$;

create or replace function public.prevent_profile_privilege_change_by_non_admin()
returns trigger language plpgsql security definer as $$
begin
  if (old.active is distinct from new.active or old.role is distinct from new.role)
     and coalesce(public.get_user_role(), '') <> 'admin' then
    raise exception 'Solo administradores pueden cambiar estado o rol de usuarios';
  end if;

  return new;
end;
$$;

create trigger profiles_privilege_admin_only
  before update of active, role on public.profiles
  for each row execute procedure public.prevent_profile_privilege_change_by_non_admin();

create or replace function public.prevent_product_active_change_by_non_admin()
returns trigger language plpgsql security definer as $$
begin
  if old.active is distinct from new.active and coalesce(public.get_user_role(), '') <> 'admin' then
    raise exception 'Solo administradores pueden activar o desactivar productos';
  end if;

  return new;
end;
$$;

create trigger products_active_admin_only
  before update of active on public.products
  for each row execute procedure public.prevent_product_active_change_by_non_admin();

-- PROFILES: cada usuario ve su propio perfil; admins ven todos
create policy "profiles_select_own" on public.profiles
  for select using (id = auth.uid() or public.get_user_role() = 'admin');

create policy "profiles_update_own" on public.profiles
  for update using (id = auth.uid() or public.get_user_role() = 'admin');

create policy "profiles_insert_admin" on public.profiles
  for insert with check (public.get_user_role() = 'admin');

-- CATEGORIES: todos pueden leer
create policy "categories_select_all" on public.categories
  for select using (true);

create policy "categories_manage_admin" on public.categories
  for all using (public.get_user_role() = 'admin');

-- PRODUCTS: todos los usuarios autenticados leen; bodeguero/admin escriben
create policy "products_select_authenticated" on public.products
  for select using (public.get_user_role() in ('admin','bodeguero','viewer'));

create policy "products_insert_staff" on public.products
  for insert with check (public.get_user_role() in ('admin','bodeguero'));

create policy "products_update_staff" on public.products
  for update using (public.get_user_role() in ('admin','bodeguero'));

create policy "products_delete_admin" on public.products
  for delete using (public.get_user_role() = 'admin');

-- MOVEMENTS: todos leen; bodeguero/admin insertan; nadie borra
create policy "movements_select_authenticated" on public.movements
  for select using (public.get_user_role() in ('admin','bodeguero','viewer'));

create policy "movements_insert_staff" on public.movements
  for insert with check (public.get_user_role() in ('admin','bodeguero'));

-- ────────────────────────────────────────────────────────────
-- 6. FUNCIONES RPC (operaciones atómicas)
-- ────────────────────────────────────────────────────────────

-- Recepción: suma stock y registra movimiento en una transacción
create or replace function public.rpc_recepcion(
  p_product_id uuid,
  p_quantity    integer,
  p_reference   text,
  p_notes       text
) returns void language plpgsql security definer as $$
declare
  v_new_stock integer;
  v_user_name text;
begin
  if coalesce(public.get_user_role(), '') not in ('admin', 'bodeguero') then
    raise exception 'No tienes permisos para registrar recepciones';
  end if;

  p_reference := public.validate_safe_text(p_reference, 'La referencia', 50);
  p_notes := public.validate_safe_text(p_notes, 'Las observaciones', 320);

  select full_name into v_user_name from public.profiles where id = auth.uid();

  update public.products
  set stock = stock + p_quantity
  where id = p_product_id
  returning stock into v_new_stock;

  insert into public.movements (product_id, type, quantity, reference, notes, balance, user_id, user_name)
  values (p_product_id, 'ENTRADA', p_quantity, p_reference, p_notes, v_new_stock, auth.uid(), v_user_name);
end;
$$;

-- Despacho: resta stock con validación y registra movimiento
create or replace function public.rpc_despacho(
  p_product_id uuid,
  p_quantity    integer,
  p_reference   text,
  p_notes       text
) returns void language plpgsql security definer as $$
declare
  v_current_stock integer;
  v_new_stock     integer;
  v_user_name     text;
begin
  if coalesce(public.get_user_role(), '') not in ('admin', 'bodeguero') then
    raise exception 'No tienes permisos para registrar despachos';
  end if;

  p_reference := public.validate_safe_text(p_reference, 'La referencia', 50);
  p_notes := public.validate_safe_text(p_notes, 'Las observaciones', 320);

  select full_name into v_user_name from public.profiles where id = auth.uid();

  select stock into v_current_stock from public.products where id = p_product_id for update;

  if v_current_stock < p_quantity then
    raise exception 'Stock insuficiente. Disponible: %', v_current_stock;
  end if;

  update public.products
  set stock = stock - p_quantity
  where id = p_product_id
  returning stock into v_new_stock;

  insert into public.movements (product_id, type, quantity, reference, notes, balance, user_id, user_name)
  values (p_product_id, 'SALIDA', p_quantity, p_reference, p_notes, v_new_stock, auth.uid(), v_user_name);
end;
$$;
