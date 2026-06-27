import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { Stethoscope } from 'lucide-react'
import { loginComEmail, cadastrarComEmail, loginComGoogle } from '../../services/auth'
import { useAuth } from '../../contexts/AuthContext'
import styles from './Auth.module.css'

export function Auth() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [modo, setModo] = useState('login') // 'login' | 'cadastro'
  const [erro, setErro] = useState('')
  const [info, setInfo] = useState('')

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm()

  if (user) {
    navigate('/')
    return null
  }

  async function onSubmit(data) {
    setErro('')
    setInfo('')
    try {
      if (modo === 'login') {
        await loginComEmail(data.email, data.senha)
        navigate('/')
      } else {
        await cadastrarComEmail(data.email, data.senha)
        setInfo('Verifique seu e-mail para confirmar o cadastro.')
      }
    } catch (e) {
      setErro(e.message)
    }
  }

  async function handleGoogle() {
    setErro('')
    try {
      await loginComGoogle()
    } catch (e) {
      setErro(e.message)
    }
  }

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <div className={styles.logo}>
          <Stethoscope size={28} />
          <span>AvaliaMed</span>
        </div>

        <h1 className={styles.title}>
          {modo === 'login' ? 'Entrar na conta' : 'Criar conta'}
        </h1>

        <button className={styles.googleBtn} onClick={handleGoogle} type="button">
          <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="" width={20} />
          Continuar com Google
        </button>

        <div className={styles.divider}><span>ou</span></div>

        {erro && <p className={styles.erro}>{erro}</p>}
        {info && <p className={styles.info}>{info}</p>}

        <form onSubmit={handleSubmit(onSubmit)} className={styles.form}>
          <div className="form-group">
            <label>E-mail</label>
            <input
              type="email"
              className={`form-control ${errors.email ? 'error' : ''}`}
              placeholder="seu@email.com"
              {...register('email', { required: 'E-mail obrigatório' })}
            />
            {errors.email && <span className="error-msg">{errors.email.message}</span>}
          </div>

          <div className="form-group">
            <label>Senha</label>
            <input
              type="password"
              className={`form-control ${errors.senha ? 'error' : ''}`}
              placeholder="••••••••"
              {...register('senha', {
                required: 'Senha obrigatória',
                minLength: { value: 6, message: 'Mínimo 6 caracteres' }
              })}
            />
            {errors.senha && <span className="error-msg">{errors.senha.message}</span>}
          </div>

          <button type="submit" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', padding: '.65rem' }} disabled={isSubmitting}>
            {isSubmitting ? 'Aguarde...' : modo === 'login' ? 'Entrar' : 'Cadastrar'}
          </button>
        </form>

        <p className={styles.toggle}>
          {modo === 'login' ? 'Não tem conta?' : 'Já tem conta?'}{' '}
          <button onClick={() => { setModo(m => m === 'login' ? 'cadastro' : 'login'); setErro(''); setInfo('') }}>
            {modo === 'login' ? 'Criar conta' : 'Entrar'}
          </button>
        </p>
      </div>
    </div>
  )
}
