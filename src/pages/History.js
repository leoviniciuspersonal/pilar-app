import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { PILLARS, getScoreBadge } from '../lib/pillars'

export default function History({ user }) {
  const [days, setDays] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { load() }, [])

  async function load() {
    const { data } = await supabase
      .from('checkins')
      .select('date, pillar, score')
      .eq('user_id', user.id)
      .order('date', { ascending: false })

    if (!data) { setLoading(false); return }

    const dayMap = {}
    data.forEach(r => {
      if (!dayMap[r.date]) dayMap[r.date] = {}
      dayMap[r.date][r.pillar] = r.score
    })

    const result = Object.entries(dayMap).map(([date, pillars]) => {
      const scores = Object.values(pillars)
      const avg = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
      return { date, pillars, avg }
    }).sort((a, b) => b.date.localeCompare(a.date))

    setDays(result)
    setLoading(false)
  }

  if (loading) return <div style={{ padding: '2rem', color: 'var(--text-muted)', textAlign: 'center' }}>Carregando...</div>

  if (days.length === 0) return (
    <div className="empty-state">
      Nenhum dia registrado ainda.<br />Comece hoje!
    </div>
  )

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {days.map(day => {
        const badge = getScoreBadge(day.avg)
        const dateLabel = new Date(day.date + 'T12:00:00').toLocaleDateString('pt-BR', {
          weekday: 'short', day: '2-digit', month: 'short'
        })
        return (
          <div className="card" key={day.date}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 500 }}>{dateLabel}</div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 14, fontWeight: 500 }}>{day.avg}%</span>
                <span className={`badge badge-${badge.type}`}>{badge.label}</span>
              </div>
            </div>
            <div className="hist-bars">
              {PILLARS.map(p => {
                const score = day.pillars[p.id] || 0
                return (
                  <div className="hist-bar-wrap" key={p.id}>
                    <div className="hist-bar-bg">
                      <div
                        className="hist-bar-fill"
                        style={{ height: score + '%', background: p.color + '88' }}
                      />
                    </div>
                    <div className="hist-bar-label">{p.icon}</div>
                  </div>
                )
              })}
            </div>
          </div>
        )
      })}
    </div>
  )
}
