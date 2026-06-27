export const ESPECIALIDADES = [
  'Acupuntura', 'Alergia e Imunologia', 'Anestesiologia', 'Angiologia',
  'Cardiologia', 'Cirurgia Cardiovascular', 'Cirurgia da Mão',
  'Cirurgia de Cabeça e Pescoço', 'Cirurgia do Aparelho Digestivo',
  'Cirurgia Geral', 'Cirurgia Pediátrica', 'Cirurgia Plástica',
  'Cirurgia Torácica', 'Cirurgia Vascular', 'Clínica Médica',
  'Coloproctologia', 'Dermatologia', 'Endocrinologia e Metabologia',
  'Endoscopia', 'Gastroenterologia', 'Genética Médica', 'Geriatria',
  'Ginecologia e Obstetrícia', 'Hematologia e Hemoterapia', 'Homeopatia',
  'Infectologia', 'Mastologia', 'Medicina de Emergência',
  'Medicina de Família e Comunidade', 'Medicina do Esporte',
  'Medicina do Trabalho', 'Medicina Física e Reabilitação',
  'Medicina Intensiva', 'Medicina Legal e Perícia Médica',
  'Medicina Nuclear', 'Medicina Preventiva e Social',
  'Nefrologia', 'Neurocirurgia', 'Neurologia', 'Nutrologia',
  'Oftalmologia', 'Oncologia Clínica', 'Ortopedia e Traumatologia',
  'Otorrinolaringologia', 'Patologia', 'Patologia Clínica / Medicina Laboratorial',
  'Pediatria', 'Pneumologia', 'Psiquiatria', 'Radiologia e Diagnóstico por Imagem',
  'Radioterapia', 'Reumatologia', 'Urologia',
]

export const UF_LIST = [
  'AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS',
  'MG','PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO',
]

export function validarNota(valor) {
  const n = Number(valor)
  if (isNaN(n)) return 'Informe um número'
  if (n < 0 || n > 10) return 'A nota deve ser entre 0 e 10'
  return true
}
