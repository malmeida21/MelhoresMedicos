-- Execute no SQL Editor do Supabase

CREATE TABLE IF NOT EXISTS perfis (
  id        UUID REFERENCES auth.users (id) ON DELETE CASCADE PRIMARY KEY,
  is_admin  BOOLEAN DEFAULT FALSE,
  criado_em TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE perfis ENABLE ROW LEVEL SECURITY;

-- Qualquer usuário lê o próprio perfil
CREATE POLICY "perfis_select_own" ON perfis
  FOR SELECT USING (auth.uid() = id);

-- Apenas a service role (Supabase Studio / script) atualiza
CREATE POLICY "perfis_update_service" ON perfis
  FOR ALL USING (auth.role() = 'service_role');

-- Cria perfil automaticamente ao cadastrar um usuário
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO perfis (id) VALUES (NEW.id) ON CONFLICT DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ============================================================
-- Para tornar um usuário admin, execute no SQL Editor:
--
--   INSERT INTO perfis (id, is_admin)
--   VALUES ('UUID-DO-USUARIO-AQUI', true)
--   ON CONFLICT (id) DO UPDATE SET is_admin = true;
--
-- Para descobrir o UUID do usuário:
--   SELECT id, email FROM auth.users WHERE email = 'email@exemplo.com';
-- ============================================================
