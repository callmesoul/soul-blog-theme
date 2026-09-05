import { useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'

export default function LoginPage() {
  const navigate = useNavigate()
  const loginRef = useRef<HTMLElement>(null)

  useEffect(() => {
    const remembered = localStorage.getItem('auth:remembered-username')
    if (remembered && loginRef.current) {
      loginRef.current.setAttribute('remembered-username', remembered)
    }
  }, [])

  useEffect(() => {
    const el = loginRef.current
    if (!el) return
    const handler = () => setTimeout(() => navigate('/'), 600)
    el.addEventListener('login-submit', handler)
    return () => el.removeEventListener('login-submit', handler)
  }, [navigate])

  return (
    <div className="flex flex-1 items-center justify-center">
      <login-panel ref={loginRef}></login-panel>
    </div>
  )
}