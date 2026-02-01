import { FormEvent, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { getSession, updatePassword } from '../services/auth'

function ResetPassword() {
  const navigate = useNavigate()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    let isMounted = true

    getSession().then(({ data }) => {
      if (!isMounted) {
        return
      }

      if (!data.session) {
        setError('Sessão inválida. Abra novamente o link de recuperação.')
        return
      }

      setReady(true)
    })

    return () => {
      isMounted = false
    }
  }, [])

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError(null)

    if (password.length < 6) {
      setError('A senha deve ter pelo menos 6 caracteres.')
      return
    }

    if (password !== confirm) {
      setError('As senhas não coincidem.')
      return
    }

    setLoading(true)

    const { error: updateError } = await updatePassword(password)
    setLoading(false)

    if (updateError) {
      setError('Não foi possível atualizar a senha.')
      return
    }

    navigate('/login', { replace: true })
  }

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-white shadow-sm rounded-xl p-8 space-y-4">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">
            Redefinir senha
          </h1>
          <p className="text-slate-500 mt-1">
            Defina uma nova senha para continuar.
          </p>
        </div>

        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-red-600 text-sm">
            {error}
          </div>
        )}

        {!ready ? (
          <div className="text-slate-500">Validando sessão...</div>
        ) : (
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <label className="text-sm font-medium text-slate-700" htmlFor="password">
                Nova senha
              </label>
              <input
                id="password"
                type="password"
                className="mt-2 w-full rounded-md border border-slate-200 px-3 py-2 text-slate-900"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
              />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700" htmlFor="confirm">
                Confirmar senha
              </label>
              <input
                id="confirm"
                type="password"
                className="mt-2 w-full rounded-md border border-slate-200 px-3 py-2 text-slate-900"
                value={confirm}
                onChange={(event) => setConfirm(event.target.value)}
                required
              />
            </div>
            <button
              type="submit"
              className="w-full rounded-md bg-slate-900 text-white py-2 font-medium hover:bg-slate-800 transition disabled:opacity-60"
              disabled={loading}
            >
              {loading ? 'Salvando...' : 'Atualizar senha'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}

export default ResetPassword

