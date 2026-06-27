import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { Modal } from '../Modal/Modal'
import { salvarAvaliacao } from '../../services/avaliacoes'
import { validarNota } from '../../utils/validators'
import styles from './RatingForm.module.css'

export function RatingForm({ open, onClose, medico, usuarioId, avaliacaoExistente, onSaved }) {
  const { register, handleSubmit, reset, watch, formState: { errors, isSubmitting } } = useForm({
    defaultValues: {
      nota: '',
      pontos_positivos: '',
      pontos_negativos: '',
      recomendaria: '',
    }
  })

  useEffect(() => {
    if (avaliacaoExistente) {
      reset({
        nota: avaliacaoExistente.nota,
        pontos_positivos: avaliacaoExistente.pontos_positivos ?? '',
        pontos_negativos: avaliacaoExistente.pontos_negativos ?? '',
        recomendaria: avaliacaoExistente.recomendaria === true ? 'sim' : avaliacaoExistente.recomendaria === false ? 'nao' : '',
      })
    } else {
      reset({ nota: '', pontos_positivos: '', pontos_negativos: '', recomendaria: '' })
    }
  }, [avaliacaoExistente, open, reset])

  async function onSubmit(data) {
    await salvarAvaliacao({
      medicoId: medico.id,
      usuarioId,
      nota: Number(data.nota),
      pontosPositivos: data.pontos_positivos,
      pontosNegativos: data.pontos_negativos,
      recomendaria: data.recomendaria === 'sim' ? true : data.recomendaria === 'nao' ? false : null,
    })
    onSaved?.()
    onClose()
  }

  const nota = watch('nota')
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
            {nota !== '' && !isNaN(notaNum) && (
              <span
                className={styles.notaPreview}
                style={{ background: `hsl(${notaNum * 12}, 70%, 88%)` }}
              >
                {notaNum.toFixed(1)}
              </span>
            )}
          </div>
          {errors.nota && <span className="error-msg">{errors.nota.message}</span>}
        </div>

        <div className="form-group">
          <label htmlFor="rec">Você recomendaria este médico?</label>
          <div className={styles.radioGroup}>
            <label className={styles.radio}>
              <input type="radio" value="sim" {...register('recomendaria')} />
              Sim
            </label>
            <label className={styles.radio}>
              <input type="radio" value="nao" {...register('recomendaria')} />
              Não
            </label>
          </div>
        </div>

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
          <button type="button" className="btn btn-outline" onClick={onClose}>
            Cancelar
          </button>
          <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
            {isSubmitting ? 'Salvando...' : 'Salvar avaliação'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
