import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { Modal } from '../Modal/Modal'
import { salvarAvaliacao } from '../../services/avaliacoes'
import { usePerfil } from '../../contexts/PerfilContext'
import { validarNota } from '../../utils/validators'
import styles from './RatingForm.module.css'

function recomendariaParaValor(recomendaria) {
  if (recomendaria === true)  return 'sim'
  if (recomendaria === false) return 'nao'
  return ''
}

function valorParaRecomendaria(valor) {
  if (valor === 'sim') return true
  if (valor === 'nao') return false
  return null
}

/**
 * @param {{
 *   open: boolean,
 *   onClose: () => void,
 *   medico: { id: string, nome: string },
 *   usuarioId: string,
 *   avaliacaoExistente?: { nota: number, pontos_positivos?: string, pontos_negativos?: string, recomendaria?: boolean },
 *   onSaved?: () => void
 * }} props
 */
export function RatingForm({ open, onClose, medico, usuarioId, avaliacaoExistente, onSaved }) {
  const { nome } = usePerfil()
  const { register, handleSubmit, reset, watch, formState: { errors, isSubmitting } } = useForm({
    defaultValues: { nota: '', pontos_positivos: '', pontos_negativos: '', recomendaria: '' },
  })

  useEffect(() => {
    if (avaliacaoExistente) {
      reset({
        nota:             avaliacaoExistente.nota,
        pontos_positivos: avaliacaoExistente.pontos_positivos ?? '',
        pontos_negativos: avaliacaoExistente.pontos_negativos ?? '',
        recomendaria:     recomendariaParaValor(avaliacaoExistente.recomendaria),
      })
    } else {
      reset({ nota: '', pontos_positivos: '', pontos_negativos: '', recomendaria: '' })
    }
  }, [avaliacaoExistente, open, reset])

  async function onSubmit(data) {
    await salvarAvaliacao({
      medicoId:       medico.id,
      usuarioId,
      nomeAutor:      nome || null,
      nota:           Number(data.nota),
      pontosPositivos: data.pontos_positivos,
      pontosNegativos: data.pontos_negativos,
      recomendaria:   valorParaRecomendaria(data.recomendaria),
    })
    onSaved?.()
    onClose()
  }

  const nota    = watch('nota')
  const notaNum = Number(nota)

  return (
    <Modal open={open} onClose={onClose} title={`Avaliar: ${medico?.nome ?? ''}`}>
      <form onSubmit={handleSubmit(onSubmit)} className={styles.form}>
        <div className="form-group">
          <label htmlFor="nota">
            Nota <span className={styles.hint}>(0 a 10)</span>
          </label>
          <div className={styles.notaWrap}>
            <input
              id="nota"
              type="number"
              min="0"
              max="10"
              step="0.5"
              className={`form-control ${errors.nota ? 'error' : ''}`}
              placeholder="Ex: 8.5"
              {...register('nota', { required: 'Informe uma nota', validate: validarNota })}
            />
            {nota !== '' && !Number.isNaN(notaNum) && (
              <span className={styles.notaPreview} style={{ background: `hsl(${notaNum * 12}, 70%, 88%)` }}>
                {notaNum.toFixed(1)}
              </span>
            )}
          </div>
          {errors.nota && <span className="error-msg">{errors.nota.message}</span>}
        </div>

        <fieldset className="form-group">
          <legend className={styles.legendLabel}>Você recomendaria este médico?</legend>
          <div className={styles.radioGroup}>
            <label className={styles.radio}>
              <input type="radio" value="sim" {...register('recomendaria')} />
              {' '}Sim
            </label>
            <label className={styles.radio}>
              <input type="radio" value="nao" {...register('recomendaria')} />
              {' '}Não
            </label>
          </div>
        </fieldset>

        <div className="form-group">
          <label htmlFor="positivos">Pontos positivos</label>
          <textarea
            id="positivos"
            className="form-control"
            rows={3}
            placeholder="O que você gostou neste médico?"
            {...register('pontos_positivos')}
          />
        </div>

        <div className="form-group">
          <label htmlFor="negativos">Pontos negativos</label>
          <textarea
            id="negativos"
            className="form-control"
            rows={3}
            placeholder="O que poderia melhorar?"
            {...register('pontos_negativos')}
          />
        </div>

        <div className={styles.footer}>
          <button type="button" className="btn btn-outline" onClick={onClose}>Cancelar</button>
          <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
            {isSubmitting ? 'Salvando...' : 'Salvar avaliação'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
