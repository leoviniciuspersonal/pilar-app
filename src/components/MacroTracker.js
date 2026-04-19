create table macro_entries (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references profiles(id) on delete cascade not null,
  date date not null,
  alimento_id integer references taco_alimentos(id),
  alimento_nome text not null,
  quantidade_g numeric not null,
  energia_kcal numeric not null,
  proteina_g numeric not null,
  carboidrato_g numeric not null,
  gordura_g numeric not null,
  created_at timestamp with time zone default now()
);

alter table macro_entries enable row level security;

create policy "usuario ve proprios macros" on macro_entries
  for all using (auth.uid() = user_id);
