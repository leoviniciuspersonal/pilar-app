import { useState, useEffect } from 'react'
import { supabase } from './lib/supabase'
import Auth from './components/Auth'
import Today from './pages/Today'
import History from './pages/History'
import Trainer from './pages/Trainer'
import './index.css'

export default function App() {
  const [session, setSession] = useState(null)
  const [profile, setProfile] = useState(null)
  const [tab, setTab] = useState('today')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      if (session) loadProfile(session.user.id)
      else setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      if (session) loadProfile(session.user.id)
      else { setProfile(null); setLoading(false) }
    })

    return () => subscription.unsubscribe()
  }, [])

  async function loadProfile(userId) {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()
    setProfile(data)
    setLoading(false)
  }

  async function signOut() {
    await supabase.auth.signOut()
  }

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
      Carregando...
    </div>
  )

  if (!session) return <Auth />

  const isTrainer = profile?.role === 'trainer'

  return (
    <div className="app">
      <div className="topbar">
        <div className="topbar-title">⚡ Pilar</div>
        <div className="topbar-user">
          <span>{profile?.name || session.user.email}</span>
          <button onClick={signOut} style={{ fontSize: 12, padding: '4px 10px' }}>Sair</button>
        </div>
      </div>

      <div className="nav">
        <button
          className={`nav-btn ${tab === 'today' ? 'active' : ''}`}
          onClick={() => setTab('today')}
        >
          Hoje
        </button>
        <button
          className={`nav-btn ${tab === 'history' ? 'active' : ''}`}
          onClick={() => setTab('history')}
        >
          Histórico
        </button>
        {isTrainer && (
          <button
            className={`nav-btn ${tab === 'trainer' ? 'active' : ''}`}
            onClick={() => setTab('trainer')}
          >
            Clientes
          </button>
        )}
      </div>

      {tab === 'today' && <Today user={session.user} profile={profile} />}
      {tab === 'history' && <History user={session.user} />}
      {tab === 'trainer' && isTrainer && <Trainer user={session.user} />}
    </div>
  )
}
