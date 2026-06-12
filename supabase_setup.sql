-- BabyTrack: configuración de la base de datos
-- Pega TODO este archivo en Supabase > SQL Editor > New query, y presiona RUN.

-- Tabla donde vive el historial de la familia (una fila por código de familia)
create table if not exists public.familias (
  id text primary key,          -- el "código de familia" que inventan ustedes
  data jsonb,                   -- todo el historial de la app
  device text,                  -- qué teléfono hizo el último cambio
  updated_at timestamptz default now()
);

-- Permitir que la app (con la llave pública "anon") lea y escriba.
-- Nota: la privacidad depende de que su código de familia sea secreto y difícil de adivinar.
alter table public.familias enable row level security;

create policy "lectura_anon" on public.familias
  for select using (true);

create policy "insercion_anon" on public.familias
  for insert with check (true);

create policy "actualizacion_anon" on public.familias
  for update using (true) with check (true);

-- Activar las actualizaciones en tiempo real (para que el cambio de un teléfono
-- aparezca en el otro sin recargar)
alter publication supabase_realtime add table public.familias;
