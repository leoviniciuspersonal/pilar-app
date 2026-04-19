import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { PILLARS, getScoreBadge } from '../lib/pillars'

function nDaysAgo(n) {
  const d = new Date()
  d.setDate(d.getDate() - n)
  return d.toISOString().slice(0, 10)
}

export default function History({ user }) {
  const [days, setDays] = useState([])
  const [consistency, setConsistency] = useState({ avg7: null, avg30: null, trend: 0, best: 0 })
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

    const last7 = result.slice(0, 7)
    const last30 = result.slice(0, 30)
    const avg7 = last7.length > 0 ? Math.round(last7.reduce((a, b) => a + b.avg, 0) / last7.length) : null
    const avg30 = last30.length > 0 ? Math.round(last30.reduce((a, b) => a + b.avg, 0) / last30.length) : null

    const first7 = result.slice(Math.max(0, result.length - 7))
    const avgFirst7 = first7.length > 0 ? Math.round(first7.reduce((a, b) => a + b.avg, 0) / first7.length) : null
    const trend = avg7 !== null && avgFirst7 !== null ? avg7 - avgFirst7 : 0

    let best = 0, cur = 0
    for (let i = 0; i < result.length; i++) {
      if (result[i].avg > 0) { cur++; if (cur > best) best = cur } else cur = 0
    }

    setConsistency({ avg7, avg30, trend, best })
    setLoading(false)
  }

  if (loading) return <div style={{ padding: '2rem', color: '#666', textAlign: 'center' }}>Carregando...</div>

  if (days.length === 0) return (
    <div style={{ textAlign: 'center', padding: '3rem 1rem', color: '#999', fontSize: 14 }}>
      Nenhum dia registrado ainda. Comece hoje!
    </div>
  )

  const trendColor = consistency.trend > 5 ? '#1D9E75' : consistency.trend < -5 ? '#e24b4a' : '#888'
  const trendLabel = consistency.trend > 5 ? 'subindo' : consistency.trend < -5 ? 'caindo' : 'estavel'

  return (
    <div>
      <div style={{ marginBottom: '1.5rem' }}>
        <div style={{ fontSize: 12, color: '#666', marginBottom: 10, fontWeight: 500 }}>CONSISTENCIA</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: 8 }}>
          <div className="stat-card">
            <div className="stat-num">{consistency.avg7 !== null ? consistency.avg7 + '%' : '--'}</div>
            <div className="stat-lbl">media 7 dias</div>
          </div>
          <div className="stat-card">
            <div className="stat-num">{consistency.avg30 !== null ? consistency.avg30 + '%' : '--'}</div>
            <div className="stat-lbl">media 30 dias</div>
          </div>
          <div className="stat-card">
            <div className="stat-num" style={{ color: trendColor }}>
              {consistency.trend > 5 ? '+' + consistency.trend : consistency.trend < -5 ? consistency.trend : '='}{consistency.trend !== 0 ? '%' : ''}
            </div>
            <div className="stat-lbl">tendencia ({trendLabel})</div>
          </div>
          <div className="stat-card">
            <div className="stat-num">{consistency.best}</div>
            <div className="stat-lbl">melhor sequencia</div>
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {days.map(day => {
          const badge = getScoreBadge(day.avg)
          const dateLabel = new Date(day.date + 'T12:00:00').toLocaleDateString('pt-BR', {
            weekday: 'short', day: '2-digit', month: 'short'
          })
          return (
            <div className="card" key={day.date}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <div style={{ fontSize: 13, fontWeight: 500 }}>{dateLabel}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 14, fontWeight: 500 }}>{day.avg}%</span>
                  <span className={'badge badge-' + badge.type}>{badge.label}</span>
                </div>
              </div>
              <div className="hist-bars">
                {PILLARS.map(p => {
                  const score = day.pillars[p.id] || 0
                  return (
                    <div className="hist-bar-wrap" key={p.id}>
                      <div className="hist-bar-bg">
                        <div className="hist-bar-fill" style={{ height: score + '%', background: p.color + '88' }} />
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
    </div>
  )
}
