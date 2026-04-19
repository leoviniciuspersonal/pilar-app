import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { PILLARS, getDayScore, getScoreBadge } from '../lib/pillars'
import CheckinModal from '../components/CheckinModal'
import WaterTracker from '../components/WaterTracker'
import MacroTracker from '../components/MacroTracker'

const todayKey = () => new Date().toISOString().slice(0, 10)

function nDaysAgo(n) {
  const d = new Date()
  d.setDate(d.getDate() - n)
  return d.toISOString().slice(0, 10)
}

export default function Today({ user, profile }) {
  const [checkins, setCheckins] = useState({})
  const [openPillar, setOpenPillar] = useState(null)
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({ streak: 0, best: 0, total: 0, avg7: null, avg30: null, trend: 0 })

  useEffect(() => { loadToday(); loadStats() }, [])

  async function loadToday() {
    const { data } = await supabase
      .from('checkins')
      .select('pillar, data, score')
      .eq('user_id', user.id)
      .eq('date', todayKey())
    if (data) {
      const map = {}
      data.forEach(r => { map[r.pillar] = { data: r.data, score: r.score } })
      setCheckins(map)
    }
    setLoading(false)
  }

  async function loadStats() {
    const { data } = await supabase
      .from('checkins')
      .select('date, score')
      .eq('user_id', user.id)
      .gte('date', nDaysAgo(30))
      .order('date', { ascending: false })
    if (!data) return

    const dayMap = {}
    data.forEach(r => {
      if (!dayMap[r.date]) dayMap[r.date] = []
      dayMap[r.date].push(r.score)
    })

    const days = Object.keys(dayMap).sort().reverse()
    const dayAvgs = days.map(d => ({
      date: d,
      avg: Math.round(dayMap[d].reduce((a, b) => a + b, 0) / dayMap[d].length)
    }))

    let streak = 0, best = 0, cur = 0
    for (let i = 0; i < dayAvgs.length; i++) {
      if (dayAvgs[i].avg > 0) {
        cur++
        if (cur > best) best = cur
        if (i === 0) streak = cur
      } else { if (cur > best) best = cur; cur = 0 }
    }

    const last7 = dayAvgs.slice(0, 7)
    const last30 = dayAvgs
    const avg7 = last7.length > 0 ? Math.round(last7.reduce((a, b) => a + b.avg, 0) / last7.length) : null
    const avg30 = last30.length > 0 ? Math.round(last30.reduce((a, b) => a + b.avg, 0) / last30.length) : null

    const first7 = dayAvgs.slice(Math.max(0, dayAvgs.length - 7))
    const avgFirst7 = first7.length > 0 ? Math.round(first7.reduce((a, b) => a + b.avg, 0) / first7.length) : null
    const trend = avg7 !== null && avgFirst7 !== null ? avg7 - avgFirst7 : 0

    setStats({ streak, best, total: days.length, avg7, avg30, trend })
  }

  async function handleSave(pillarId, values, score) {
    await supabase.from('checkins').upsert({
      user_id: user.id, date: todayKey(), pillar: pillarId, data: values, score
    }, { onConflict: 'user_id,date,pillar' })
    setCheckins(prev => ({ ...prev, [pillarId]: { data: values, score } }))
    setOpenPillar(null)
    loadStats()
  }

  const now = new Date()
  const h = now.getHours()
  const greet = h < 12 ? 'Bom dia' : h < 18 ? 'Boa tarde' : 'Boa noite'
  const firstName = (profile && profile.name) ? profile.name.split(' ')[0] : 'voce'

  const pillarsData = {}
  Object.entries(checkins).forEach(([k, v]) => { pillarsData[k] = v.data })
  const dayScore = getDayScore(pillarsData)
  const badge = getScoreBadge(dayScore)

  const PILLARS_SEM_AGUA = PILLARS.filter(p => p.id !== 'hidratacao')

  const trendIcon = stats.trend > 5 ? 'subindo' : stats.trend < -5 ? 'caindo' : 'estavel'
  const trendColor = stats.trend > 5 ? '#1D9E75' : stats.trend < -5 ? '#e24b4a' : '#888'

  if (loading) return <div style={{ padding: '2rem', color: '#666', textAlign: 'center' }}>Carregando...</div>

  return (
    <div>
      <p className="greeting"><strong>{greet}, {firstName}.</strong> Como foi hoje?</p>

      <div className="day-score-card card" style={{ marginBottom: '1rem' }}>
        <div>
          <div style={{ fontSize: 12, color: '#666' }}>pontuacao do dia</div>
          <div className="day-score-num">{dayScore !== null ? dayScore + '%' : '--'}</div>
        </div>
        {badge && <span className={'badge badge-' + badge.type}>{badge.label}</span>}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 8, marginBottom: '1.5rem' }}>
        <div className="stat-card">
          <div className="stat-num">{stats.streak}</div>
          <div className="stat-lbl">dias seguidos</div>
        </div>
        <div className="stat-card">
          <div className="stat-num">{stats.avg7 !== null ? stats.avg7 + '%' : '--'}</div>
          <div className="stat-lbl">media 7 dias</div>
        </div>
        <div className="stat-card">
          <div className="stat-num">{stats.avg30 !== null ? stats.avg30 + '%' : '--'}</div>
          <div className="stat-lbl">media 30 dias</div>
        </div>
        <div className="stat-card">
          <div className="stat-num" style={{ color: trendColor }}>
            {stats.trend > 5 ? '+' + stats.trend : stats.trend < -5 ? stats.trend : '='}{stats.trend !== 0 ? '%' : ''}
          </div>
          <div className="stat-lbl">tendencia ({trendIcon})</div>
        </div>
      </div>

      <WaterTracker user={user} meta={(profile && profile.target_water) || 2} />

      <MacroTracker user={user} profile={profile} />

      <div style={{ display: 'flex', gap: 8, marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        {stats.best > 0 && (
          <div style={{ fontSize: 12, color: '#888', background: 'rgba(0,0,0,0.04)', padding: '4px 10px', borderRadius: 8 }}>
            melhor sequencia: {stats.best} dias
          </div>
        )}
        {stats.total > 0 && (
          <div style={{ fontSize: 12, color: '#888', background: 'rgba(0,0,0,0.04)', padding: '4px 10px', borderRadius: 8 }}>
            {stats.total} dias registrados
          </div>
        )}
      </div>

      <div className="pillars-grid">
        {PILLARS_SEM_AGUA.map(p => {
          const c = checkins[p.id]
          const done = !!c
          return (
            <div key={p.id} className={'pillar-card' + (done ? ' done' : '')} onClick={() => setOpenPillar(p.id)}>
              <div className="pillar-header">
                <div className="pillar-icon" style={{ background: p.color + '22' }}>{p.icon}</div>
                <div className="pillar-check">{done ? 'v' : ''}</div>
              </div>
              <div className="pillar-name">{p.name}</div>
              <div className="pillar-score">{done ? c.score + '%' : '--'}</div>
              <div className="pillar-label">{done ? 'registrado' : 'toque para registrar'}</div>
              <div className="progress-bar">
                <div className="progress-fill" style={{ width: (done ? c.score : 0) + '%', background: p.color }} />
              </div>
            </div>
          )
        })}
      </div>

      {openPillar && (() => {
        const p = PILLARS.find(x => x.id === openPillar)
        const existing = checkins[openPillar] ? checkins[openPillar].data : undefined
        return (
          <CheckinModal
            pillar={p} existing={existing}
            onSave={(vals, score) => handleSave(openPillar, vals, score)}
            onClose={() => setOpenPillar(null)}
          />
        )
      })()}
    </div>
  )
}
