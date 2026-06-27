-- AvaliaMed - Schema SQL
-- Execute no SQL Editor do Supabase

-- ============================================================
-- TABELAS
-- ============================================================

CREATE TABLE IF NOT EXISTS medicos (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nome        TEXT NOT NULL,
  crm         TEXT,
  uf_crm      TEXT,
  especialidade TEXT NOT NULL,
  cidade      TEXT,
  estado      TEXT,
  criado_em   TIMESTAMPTZ DEFAULT NOW()
);

-- CRM + UF únicos quando CRM informado
CREATE UNIQUE INDEX IF NOT EXISTS medicos_crm_uf_unique
  ON medicos (crm, uf_crm)
  WHERE crm IS NOT NULL AND crm <> '';

-- Índices de busca
CREATE INDEX IF NOT EXISTS medicos_nome_idx       ON medicos USING gin (to_tsvector('portuguese', nome));
CREATE INDEX IF NOT EXISTS medicos_especialidade_idx ON medicos (especialidade);
CREATE INDEX IF NOT EXISTS medicos_cidade_idx     ON medicos (cidade);

-- -------------------------------------------------------

CREATE TABLE IF NOT EXISTS avaliacoes (
  id               UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  medico_id        UUID REFERENCES medicos (id) ON DELETE CASCADE NOT NULL,
  usuario_id       UUID REFERENCES auth.users (id) ON DELETE CASCADE NOT NULL,
  nota             NUMERIC(4,1) NOT NULL CHECK (nota >= 0 AND nota <= 10),
  pontos_positivos TEXT,
  pontos_negativos TEXT,
  recomendaria     BOOLEAN,
  curtidas         INTEGER DEFAULT 0,
  criado_em        TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (medico_id, usuario_id)
);

CREATE INDEX IF NOT EXISTS avaliacoes_medico_idx  ON avaliacoes (medico_id);
CREATE INDEX IF NOT EXISTS avaliacoes_usuario_idx ON avaliacoes (usuario_id);

-- -------------------------------------------------------

CREATE TABLE IF NOT EXISTS favoritos (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  usuario_id  UUID REFERENCES auth.users (id) ON DELETE CASCADE NOT NULL,
  medico_id   UUID REFERENCES medicos (id) ON DELETE CASCADE NOT NULL,
  criado_em   TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (usuario_id, medico_id)
);

-- -------------------------------------------------------

CREATE TABLE IF NOT EXISTS curtidas_avaliacoes (
  id           UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  usuario_id   UUID REFERENCES auth.users (id) ON DELETE CASCADE NOT NULL,
  avaliacao_id UUID REFERENCES avaliacoes (id) ON DELETE CASCADE NOT NULL,
  criado_em    TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (usuario_id, avaliacao_id)
);

-- -------------------------------------------------------

CREATE TABLE IF NOT EXISTS denuncias (
  id           UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  usuario_id   UUID REFERENCES auth.users (id) ON DELETE CASCADE NOT NULL,
  avaliacao_id UUID REFERENCES avaliacoes (id) ON DELETE CASCADE NOT NULL,
  motivo       TEXT,
  criado_em    TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (usuario_id, avaliacao_id)
);

-- ============================================================
-- VIEWS
-- ============================================================

-- Médicos com estatísticas calculadas
CREATE OR REPLACE VIEW medicos_com_stats AS
SELECT
  m.*,
  COALESCE(ROUND(AVG(a.nota)::NUMERIC, 1), 0) AS nota_media,
  COUNT(a.id)                                  AS total_avaliacoes,
  COUNT(CASE WHEN a.recomendaria THEN 1 END)   AS total_recomendam
FROM medicos m
LEFT JOIN avaliacoes a ON a.medico_id = m.id
GROUP BY m.id;

-- ============================================================
-- FUNÇÕES
-- ============================================================

-- Incrementa curtidas na avaliação e registra a curtida do usuário
CREATE OR REPLACE FUNCTION curtir_avaliacao(p_avaliacao_id UUID, p_usuario_id UUID)
RETURNS VOID AS $$
BEGIN
  INSERT INTO curtidas_avaliacoes (usuario_id, avaliacao_id)
  VALUES (p_usuario_id, p_avaliacao_id);

  UPDATE avaliacoes SET curtidas = curtidas + 1
  WHERE id = p_avaliacao_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Descurtir
CREATE OR REPLACE FUNCTION descurtir_avaliacao(p_avaliacao_id UUID, p_usuario_id UUID)
RETURNS VOID AS $$
BEGIN
  DELETE FROM curtidas_avaliacoes
  WHERE usuario_id = p_usuario_id AND avaliacao_id = p_avaliacao_id;

  UPDATE avaliacoes SET curtidas = GREATEST(curtidas - 1, 0)
  WHERE id = p_avaliacao_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

ALTER TABLE medicos              ENABLE ROW LEVEL SECURITY;
ALTER TABLE avaliacoes           ENABLE ROW LEVEL SECURITY;
ALTER TABLE favoritos            ENABLE ROW LEVEL SECURITY;
ALTER TABLE curtidas_avaliacoes  ENABLE ROW LEVEL SECURITY;
ALTER TABLE denuncias            ENABLE ROW LEVEL SECURITY;

-- medicos: leitura pública, escrita autenticada
CREATE POLICY "medicos_select"  ON medicos FOR SELECT USING (true);
CREATE POLICY "medicos_insert"  ON medicos FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "medicos_update"  ON medicos FOR UPDATE USING (auth.role() = 'authenticated');

-- avaliacoes: leitura pública
CREATE POLICY "avaliacoes_select" ON avaliacoes FOR SELECT USING (true);
-- apenas autenticados criam
CREATE POLICY "avaliacoes_insert" ON avaliacoes FOR INSERT
  WITH CHECK (auth.uid() = usuario_id);
-- apenas o próprio usuário edita
CREATE POLICY "avaliacoes_update" ON avaliacoes FOR UPDATE
  USING (auth.uid() = usuario_id);
-- ninguém deleta (nem o próprio usuário)
-- (ausência de policy DELETE = bloqueado)

-- favoritos: crud do próprio usuário
CREATE POLICY "favoritos_select" ON favoritos FOR SELECT
  USING (auth.uid() = usuario_id);
CREATE POLICY "favoritos_insert" ON favoritos FOR INSERT
  WITH CHECK (auth.uid() = usuario_id);
CREATE POLICY "favoritos_delete" ON favoritos FOR DELETE
  USING (auth.uid() = usuario_id);

-- curtidas: crud do próprio usuário
CREATE POLICY "curtidas_select" ON curtidas_avaliacoes FOR SELECT USING (true);
CREATE POLICY "curtidas_insert" ON curtidas_avaliacoes FOR INSERT
  WITH CHECK (auth.uid() = usuario_id);
CREATE POLICY "curtidas_delete" ON curtidas_avaliacoes FOR DELETE
  USING (auth.uid() = usuario_id);

-- denuncias: autenticado cria, ninguém deleta
CREATE POLICY "denuncias_insert" ON denuncias FOR INSERT
  WITH CHECK (auth.uid() = usuario_id);
CREATE POLICY "denuncias_select" ON denuncias FOR SELECT
  USING (auth.uid() = usuario_id);
