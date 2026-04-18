import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { getScoreBadge } from '../lib/pillars'

export default function Trainer({ user }) {
  const [clients, setClients] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { load() }, [])

  async function load() {
    // Busca todos os perfis exceto o próprio treinador
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, name, created_at')
      .neq('id', user.id)

    if (!profiles || profiles.length === 0) {
      setLoading(false)
      return
    }

    // Busca último check-in de cada cliente
    const ids = profiles.map(p => p.id)
    const { data: checkins } = await supabase
      .from('checkins')
      .select('user_id, date, score')
      .in('user_id', ids)
      .order('date', { ascending: false })

    const lastCheckin = {}
    const avgScore = {}
    if (checkins) {
      checkins.forEach(c => {
        if (!lastCheckin[c.user_id]) lastCheckin[c.user_id] = c.date
        if (!avgScore[c.user_id]) avgScore[c.user_id] = []
        if (avgScore[c.user_id].length < 6) avgScore[c.user_id].push(c.score)
      })
    }

    const result = profiles.map(p => ({
      ...p,
      lastDate: lastCheckin[p.id] || null,
      avg: avgScore[p.id]
        ? Math.round(avgScore[p.id].reduce((a, b) => a + b, 0) / avgScore[p.id].length)
        : null
    }))

    setClients(result)
    setLoading(false)
  }

  if (loading) return <div style={{ padding: '2rem', color: 'var(--text-muted)', textAlign: 'center' }}>Carregando...</div>

  if (clients.length === 0) return (
    <div className="empty-state">
      Nenhum cliente cadastrado ainda.<br />
      <span style={{ fontSize: 12, marginTop: 8, display: 'block' }}>
        Quando seus clientes criarem conta, aparecem aqui.
      </span>
    </div>
  )

  return (
    <div className="card">
      <div style={{ fontSize: 14, fontWeight: 500, marginBottom: 12, color: 'var(--text-muted)' }}>
        {clients.length} {clients.length === 1 ? 'cliente' : 'clientes'}
      </div>
      {clients.map(c => {
        const badge = c.avg !== null ? getScoreBadge(c.avg) : null
        const dateLabel = c.lastDate
          ? new Date(c.lastDate + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })
          : 'sem registro'
        return (
          <div className="client-row" key={c.id}>
            <div>
              <div className="client-name">{c.name || 'Sem nome'}</div>
              <div className="client-date">último check-in: {dateLabel}</div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              {c.avg !== null && <span style={{ fontSize: 14, fontWeight: 500 }}>{c.avg}%</span>}
              {badge && <span className={`badge badge-${badge.type}`}>{badge.label}</span>}
            </div>
          </div>
        )
      })}
    </div>
  )
}
