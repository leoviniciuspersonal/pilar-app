import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { getScoreBadge } from '../lib/pillars'

const todayKey = () => new Date().toISOString().slice(0, 10)

export default function Trainer({ user }) {
  const [clients, setClients] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')

  useEffect(() => { load() }, [])

  async function load() {
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, name, created_at')
      .neq('id', user.id)

    if (!profiles || profiles.length === 0) { setLoading(false); return }

    const ids = profiles.map(p => p.id)

    const { data: checkins } = await supabase
      .from('checkins')
      .select('user_id, date, score')
      .in('user_id', ids)
      .order('date', { ascending: false })

    const today = todayKey()
    const clientMap = {}

    profiles.forEach(p => {
      clientMap[p.id] = {
        ...p,
        checkedToday: false,
        todayScore: null,
        avg7: null,
        avg30: null,
        trend: 0,
        streak: 0,
        lastDate: null,
      }
    })

    if (checkins) {
      const byUser = {}
      checkins.forEach(c => {
        if (!byUser[c.user_id]) byUser[c.user_id] = []
        byUser[c.user_id].push(c)
      })

      Object.keys(byUser).forEach(uid => {
        const entries = byUser[uid]
        const dayMap = {}
        entries.forEach(e => {
          if (!dayMap[e.date]) dayMap[e.date] = []
          dayMap[e.date].push(e.score)
        })

        const days = Object.keys(dayMap).sort().reverse()
        const dayAvgs = days.map(d => ({
          date: d,
          avg: Math.round(dayMap[d].reduce((a, b) => a + b, 0) / dayMap[d].length)
        }))

        const checkedToday = days[0] === today
        const todayScore = checkedToday ? dayAvgs[0].avg : null
        const lastDate = days[0] || null

        const last7 = dayAvgs.slice(0, 7)
        const last30 = dayAvgs.slice(0, 30)
        const avg7 = last7.length > 0 ? Math.round(last7.reduce((a, b) => a + b.avg, 0) / last7.length) : null
        const avg30 = last30.length > 0 ? Math.round(last30.reduce((a, b) => a + b.avg, 0) / last30.length) : null

        const first7 = dayAvgs.slice(Math.max(0, dayAvgs.length - 7))
        const avgFirst7 = first7.length > 0 ? Math.round(first7.reduce((a, b) => a + b.avg, 0) / first7.length) : null
        const trend = avg7 !== null && avgFirst7 !== null ? avg7 - avgFirst7 : 0

        let streak = 0, cur = 0
        for (let i = 0; i < dayAvgs.length; i++) {
          if (dayAvgs[i].avg > 0) { cur++; if (i === 0) streak = cur } else break
        }

        if (clientMap[uid]) {
          clientMap[uid] = { ...clientMap[uid], checkedToday, todayScore, avg7, avg30, trend, streak, lastDate }
        }
      })
    }

    const result = Object.values(clientMap).sort((a, b) => {
      if (a.checkedToday !== b.checkedToday) return b.checkedToday ? 1 : -1
      return (b.avg7 || 0) - (a.avg7 || 0)
    })

    setClients(result)
    setLoading(false)
  }

  const filtered = clients.filter(c => {
    if (filter === 'today') return c.checkedToday
    if (filter === 'missing') return !c.checkedToday
    return true
  })

  const checkedCount = clients.filter(c => c.checkedToday).length

  if (loading) return <div style={{ padding: '2rem', color: '#666', textAlign: 'center' }}>Carregando...</div>

  if (clients.length === 0) return (
    <div style={{ textAlign: 'center', padding: '3rem 1rem', color: '#999', fontSize: 14 }}>
      Nenhum cliente cadastrado ainda.
      <div style={{ fontSize: 12, marginTop: 8 }}>Quando seus clientes criarem conta, aparecem aqui.</div>
    </div>
  )

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginBottom: '1.5rem' }}>
        <div className="stat-card">
          <div className="stat-num">{clients.length}</div>
          <div className="stat-lbl">clientes</div>
        </div>
        <div className="stat-card">
          <div className="stat-num" style={{ color: '#1D9E75' }}>{checkedCount}</div>
          <div className="stat-lbl">check-in hoje</div>
        </div>
        <div className="stat-card">
          <div className="stat-num" style={{ color: checkedCount < clients.length ? '#e24b4a' : '#1D9E75' }}>
            {clients.length - checkedCount}
          </div>
          <div className="stat-lbl">sem check-in</div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 6, marginBottom: '1rem' }}>
        {[{ id: 'all', label: 'Todos' }, { id: 'today', label: 'Fizeram hoje' }, { id: 'missing', label: 'Sem check-in' }].map(f => (
          <button
            key={f.id}
            onClick={() => setFilter(f.id)}
            style={{
              padding: '5px 12px', fontSize: 12, borderRadius: 8, cursor: 'pointer',
              border: filter === f.id ? '2px solid #378ADD' : '0.5px solid rgba(0,0,0,0.15)',
              background: filter === f.id ? '#e6f1fb' : 'transparent',
              color: filter === f.id ? '#185FA5' : '#666',
            }}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {filtered.map(c => {
          const badge = c.avg7 !== null ? getScoreBadge(c.avg7) : null
          const trendColor = c.trend > 5 ? '#1D9E75' : c.trend < -5 ? '#e24b4a' : '#888'
          const trendSymbol = c.trend > 5 ? '+' + c.trend + '%' : c.trend < -5 ? c.trend + '%' : '='
          const lastLabel = c.lastDate
            ? new Date(c.lastDate + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })
            : 'nunca'

          return (
            <div key={c.id} className="card" style={{ borderLeft: c.checkedToday ? '3px solid #1D9E75' : '3px solid rgba(0,0,0,0.08)', borderRadius: 10 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div style={{ fontWeight: 500, fontSize: 14, marginBottom: 2 }}>{c.name || 'Sem nome'}</div>
                  <div style={{ fontSize: 11, color: '#888' }}>
                    {c.checkedToday ? 'check-in hoje' : 'ultimo: ' + lastLabel}
                    {c.streak > 1 ? ' · ' + c.streak + ' dias seguidos' : ''}
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  {c.todayScore !== null && (
                    <div style={{ fontSize: 18, fontWeight: 500, color: '#378ADD' }}>{c.todayScore}%</div>
                  )}
                  {badge && <span className={'badge badge-' + badge.type} style={{ fontSize: 10 }}>{badge.label}</span>}
                </div>
              </div>

              {c.avg7 !== null && (
                <div style={{ display: 'flex', gap: 12, marginTop: 10, paddingTop: 8, borderTop: '0.5px solid rgba(0,0,0,0.06)', fontSize: 11, color: '#888' }}>
                  <span>media 7d: <strong style={{ color: '#333' }}>{c.avg7}%</strong></span>
                  <span>media 30d: <strong style={{ color: '#333' }}>{c.avg30 || '--'}%</strong></span>
                  <span>tendencia: <strong style={{ color: trendColor }}>{trendSymbol}</strong></span>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
