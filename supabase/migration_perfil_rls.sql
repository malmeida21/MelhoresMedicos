-- Políticas para permitir que o usuário salve e atualize seu próprio perfil
DROP POLICY IF EXISTS "Usuário pode inserir perfil" ON perfis;
CREATE POLICY "Usuário pode inserir perfil"
  ON perfis FOR INSERT WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Usuário pode atualizar perfil" ON perfis;
CREATE POLICY "Usuário pode atualizar perfil"
  ON perfis FOR UPDATE USING (auth.uid() = id);
