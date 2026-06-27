import { useState } from 'react'
import { useForm, useFieldArray } from 'react-hook-form'
import { Plus, Trash2 } from 'lucide-react'
import { Modal } from '../Modal/Modal'
import { DoctorCard } from '../DoctorCard/DoctorCard'
import { buscarMedicoSemelhante, cadastrarMedico } from '../../services/medicos'
import { ESPECIALIDADES, UF_LIST } from '../../utils/validators'
import styles from './DoctorForm.module.css'

const TIPOS_TELEFONE = ['Consultório', 'Celular', 'WhatsApp', 'Recepção', 'Emergência']

const ENDERECO_VAZIO = {
  logradouro: '', numero: '', complemento: '', bairro: '', cidade: '', estado: '', cep: '',
}

/** @param {{ open: boolean, onClose: () => void, onCadastrado: (medico: object) => void }} props */
export function DoctorForm({ open, onClose, onCadastrado }) {
  const [semelhantes, setSemelhantes] = useState([])
  const [step, setStep] = useState('form')
  const [loading, setLoading] = useState(false)

  const { register, handleSubmit, getValues, control, formState: { errors } } = useForm({
    defaultValues: {
      nome: '', crm: '', uf_crm: '', especialidade: '', cidade: '', estado: '',
      telefones: [{ numero: '', tipo: 'Consultório' }],
      enderecos: [],
    },
  })

  const {
    fields: telFields,
    append: appendTel,
    remove: removeTel,
  } = useFieldArray({ control, name: 'telefones' })

  const {
    fields: endFields,
    append: appendEnd,
    remove: removeEnd,
  } = useFieldArray({ control, name: 'enderecos' })

  async function onSubmit(data) {
    setLoading(true)
    try {
      const parecidos = await buscarMedicoSemelhante({
        nome: data.nome,
        cidade: data.cidade || '',
        especialidade: data.especialidade,
      })
      if (parecidos.length > 0) {
        setSemelhantes(parecidos)
        setStep('confirm')
      } else {
        const medico = await cadastrarMedico(data)
        onCadastrado(medico)
        handleClose()
      }
    } finally {
      setLoading(false)
    }
  }

  async function confirmarCadastro() {
    setLoading(true)
    try {
      const medico = await cadastrarMedico(getValues())
      onCadastrado(medico)
      handleClose()
    } finally {
      setLoading(false)
    }
  }

  function handleClose() {
    setStep('form')
    setSemelhantes([])
    onClose()
  }

  return (
    <Modal open={open} onClose={handleClose} title="Cadastrar médico" size="lg">
      {step === 'form' && (
        <form onSubmit={handleSubmit(onSubmit)} className={styles.form}>

          {/* Dados principais */}
          <fieldset className={styles.fieldset}>
            <legend className={styles.legend}>Dados do médico</legend>

            <div className="form-group">
              <label htmlFor="nome">Nome completo *</label>
              <input
                id="nome"
                className={`form-control ${errors.nome ? 'error' : ''}`}
                placeholder="Dr. João da Silva"
                {...register('nome', { required: 'Nome obrigatório' })}
              />
              {errors.nome && <span className="error-msg">{errors.nome.message}</span>}
            </div>

            <div className="grid-2">
              <div className="form-group">
                <label htmlFor="crm">CRM</label>
                <input id="crm" className="form-control" placeholder="123456" {...register('crm')} />
              </div>
              <div className="form-group">
                <label htmlFor="uf_crm">UF do CRM</label>
                <select id="uf_crm" className="form-control" {...register('uf_crm')}>
                  <option value="">Selecione</option>
                  {UF_LIST.map(uf => <option key={uf} value={uf}>{uf}</option>)}
                </select>
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="cpf_cnpj">CPF / CNPJ</label>
              <input
                id="cpf_cnpj"
                className="form-control"
                placeholder="000.000.000-00 ou 00.000.000/0001-00"
                {...register('cpf_cnpj')}
              />
            </div>

            <div className="form-group">
              <label htmlFor="especialidade">Especialidade *</label>
              <select
                id="especialidade"
                className={`form-control ${errors.especialidade ? 'error' : ''}`}
                {...register('especialidade', { required: 'Selecione uma especialidade' })}
              >
                <option value="">Selecione a especialidade</option>
                {ESPECIALIDADES.map(e => <option key={e} value={e}>{e}</option>)}
              </select>
              {errors.especialidade && <span className="error-msg">{errors.especialidade.message}</span>}
            </div>
          </fieldset>

          {/* Telefones */}
          <fieldset className={styles.fieldset}>
            <legend className={styles.legend}>Telefones</legend>

            {telFields.map((field, i) => (
              <div key={field.id} className={styles.listRow}>
                <div className={styles.telInputs}>
                  <div className="form-group" style={{ flex: 1 }}>
                    <label htmlFor={`tel-numero-${i}`}>Número</label>
                    <input
                      id={`tel-numero-${i}`}
                      className="form-control"
                      placeholder="(11) 99999-9999"
                      {...register(`telefones.${i}.numero`)}
                    />
                  </div>
                  <div className="form-group" style={{ width: 140 }}>
                    <label htmlFor={`tel-tipo-${i}`}>Tipo</label>
                    <select id={`tel-tipo-${i}`} className="form-control" {...register(`telefones.${i}.tipo`)}>
                      {TIPOS_TELEFONE.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                </div>
                <button
                  type="button"
                  className={styles.removeBtn}
                  onClick={() => removeTel(i)}
                  aria-label="Remover telefone"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            ))}

            <button
              type="button"
              className={`btn btn-outline ${styles.addBtn}`}
              onClick={() => appendTel({ numero: '', tipo: 'Consultório' })}
            >
              <Plus size={15} /> Adicionar telefone
            </button>
          </fieldset>

          {/* Endereços */}
          <fieldset className={styles.fieldset}>
            <legend className={styles.legend}>Endereços</legend>

            {endFields.map((field, i) => (
              <div key={field.id} className={styles.endBlock}>
                <div className={styles.endHeader}>
                  <span className={styles.endLabel}>Endereço {i + 1}</span>
                  <button
                    type="button"
                    className={styles.removeBtn}
                    onClick={() => removeEnd(i)}
                    aria-label="Remover endereço"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>

                <div className="grid-2">
                  <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                    <label htmlFor={`end-logradouro-${i}`}>Logradouro *</label>
                    <input
                      id={`end-logradouro-${i}`}
                      className={`form-control ${errors.enderecos?.[i]?.logradouro ? 'error' : ''}`}
                      placeholder="Rua, Avenida, Alameda..."
                      {...register(`enderecos.${i}.logradouro`, { required: 'Logradouro obrigatório' })}
                    />
                    {errors.enderecos?.[i]?.logradouro && (
                      <span className="error-msg">{errors.enderecos[i].logradouro.message}</span>
                    )}
                  </div>

                  <div className="form-group">
                    <label htmlFor={`end-numero-${i}`}>Número</label>
                    <input id={`end-numero-${i}`} className="form-control" placeholder="123" {...register(`enderecos.${i}.numero`)} />
                  </div>
                  <div className="form-group">
                    <label htmlFor={`end-complemento-${i}`}>Complemento</label>
                    <input id={`end-complemento-${i}`} className="form-control" placeholder="Sala 4, Andar 2..." {...register(`enderecos.${i}.complemento`)} />
                  </div>

                  <div className="form-group">
                    <label htmlFor={`end-bairro-${i}`}>Bairro</label>
                    <input id={`end-bairro-${i}`} className="form-control" placeholder="Centro" {...register(`enderecos.${i}.bairro`)} />
                  </div>
                  <div className="form-group">
                    <label htmlFor={`end-cep-${i}`}>CEP</label>
                    <input id={`end-cep-${i}`} className="form-control" placeholder="00000-000" {...register(`enderecos.${i}.cep`)} />
                  </div>

                  <div className="form-group">
                    <label htmlFor={`end-cidade-${i}`}>Cidade</label>
                    <input id={`end-cidade-${i}`} className="form-control" placeholder="São Paulo" {...register(`enderecos.${i}.cidade`)} />
                  </div>
                  <div className="form-group">
                    <label htmlFor={`end-estado-${i}`}>Estado</label>
                    <select id={`end-estado-${i}`} className="form-control" {...register(`enderecos.${i}.estado`)}>
                      <option value="">Selecione</option>
                      {UF_LIST.map(uf => <option key={uf} value={uf}>{uf}</option>)}
                    </select>
                  </div>
                </div>
              </div>
            ))}

            <button
              type="button"
              className={`btn btn-outline ${styles.addBtn}`}
              onClick={() => appendEnd({ ...ENDERECO_VAZIO })}
            >
              <Plus size={15} /> Adicionar endereço
            </button>
          </fieldset>

          <div className={styles.footer}>
            <button type="button" className="btn btn-outline" onClick={handleClose}>Cancelar</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Verificando...' : 'Continuar'}
            </button>
          </div>
        </form>
      )}

      {step === 'confirm' && (
        <div className={styles.confirm}>
          <p className={styles.warning}>
            Encontramos médicos semelhantes. Deseja usar um dos cadastros abaixo ou continuar com o novo?
          </p>
          <div className={styles.list}>
            {semelhantes.map(m => (
              <button
                key={m.id}
                type="button"
                className={styles.similar}
                onClick={() => { onCadastrado(m); handleClose() }}
              >
                <DoctorCard medico={m} />
              </button>
            ))}
          </div>
          <div className={styles.footer}>
            <button type="button" className="btn btn-outline" onClick={() => setStep('form')}>Voltar</button>
            <button type="button" className="btn btn-primary" onClick={confirmarCadastro} disabled={loading}>
              {loading ? 'Salvando...' : 'Cadastrar novo mesmo assim'}
            </button>
          </div>
        </div>
      )}
    </Modal>
  )
}
