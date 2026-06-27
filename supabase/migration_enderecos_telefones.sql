-- Execute no SQL Editor do Supabase após o schema.sql principal

CREATE TABLE IF NOT EXISTS medico_telefones (
  id         UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  medico_id  UUID REFERENCES medicos (id) ON DELETE CASCADE NOT NULL,
  numero     TEXT NOT NULL,
  tipo       TEXT DEFAULT 'Consultório',
  criado_em  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS telefones_medico_idx ON medico_telefones (medico_id);

CREATE TABLE IF NOT EXISTS medico_enderecos (
  id           UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  medico_id    UUID REFERENCES medicos (id) ON DELETE CASCADE NOT NULL,
  logradouro   TEXT NOT NULL,
  numero       TEXT,
  complemento  TEXT,
  bairro       TEXT,
  cidade       TEXT,
  estado       TEXT,
  cep          TEXT,
  criado_em    TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS enderecos_medico_idx ON medico_enderecos (medico_id);

-- RLS
ALTER TABLE medico_telefones ENABLE ROW LEVEL SECURITY;
ALTER TABLE medico_enderecos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "telefones_select" ON medico_telefones FOR SELECT USING (true);
CREATE POLICY "telefones_insert" ON medico_telefones FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "telefones_update" ON medico_telefones FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "telefones_delete" ON medico_telefones FOR DELETE USING (auth.role() = 'authenticated');

CREATE POLICY "enderecos_select" ON medico_enderecos FOR SELECT USING (true);
CREATE POLICY "enderecos_insert" ON medico_enderecos FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "enderecos_update" ON medico_enderecos FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "enderecos_delete" ON medico_enderecos FOR DELETE USING (auth.role() = 'authenticated');
