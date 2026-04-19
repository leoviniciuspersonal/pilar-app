import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { PILLARS, getDayScore, getScoreBadge } from '../lib/pillars'
import CheckinModal from '../components/CheckinModal'

const todayKey = () => new Date().toISOString().slice(0, 10)

export default function Today({ user, profile }) {
  const [checkins, setCheckins] = useState({})
  const [openPillar, setOpenPillar] = useState(null)
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({ streak: 0, best: 0, total: 0 })

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
      .order('date', { ascending: false })
    if (!data) return
    const dayMap = {}
    data.forEach(r => {
      if (!dayMap[r.date]) dayMap[r.date] = []
      dayMap[r.date].push(r.score)
    })
    const days = Object.keys(dayMap).sort().reverse()
    let streak = 0, best = 0, cur = 0
    for (let i = 0; i < days.length; i++) {
      const avg = Math.round(dayMap[days[i]].reduce((a, b) => a + b, 0) / dayMap[days[i]].length)
      if (avg > 0) {
        cur++
        if (cur > best) best = cur
        if (i === 0) streak = cur
      } else { if (cur > best) best = cur; cur = 0 }
    }
    setStats({ streak, best, total: days.length })
  }

  function dateDiff(a, b) {
    return Math.abs((new Date(b) - new Date(a)) / (1000 * 60 * 60 * 24))
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
  const firstName = profile?.name?.split(' ')[0] || 'você'

  const pillarsData = {}
  Object.entries(checkins).forEach(([k, v]) => { pillarsData[k] = v.data })
  const dayScore = getDayScore(pillarsData)
  const badge = getScoreBadge(dayScore)

  const metas = [
    { label: 'Calorias', value: profile?.target_cals, unit: 'kcal', color: '#D85A30' },
    { label: 'Proteína', value: profile?.target_protein, unit: 'g', color: '#1D9E75' },
    { label: 'Carbo', value: profile?.target_carbs, unit: 'g', color: '#BA7517' },
    { label: 'Gordura', value: profile?.target_fat, unit: 'g', color: '#7F77DD' },
    { label: 'Água', value: profile?.target_water, unit: 'L', color: '#378ADD' },
  ].filter(m => m.value)

  if (loading) return <div style={{ padding: '2rem', color: 'var(--text-muted, #666)', textAlign: 'center' }}>Carregando...</div>

  return (
    <div>
      <p className="greeting"><strong>{greet}, {firstName}.</strong> Como foi hoje?</p>

      {metas.length > 0 && (
        <div style={{ marginBottom: '1.5rem' }}>
          <div style={{ fontSize: 12, color: 'var(--text-muted,#666)', marginBottom: 10, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Metas do dia
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: 8 }}>
            {metas.map(m => (
              <div key={m.label} style={{ background: 'var(--card,#fff)', border: '0.5px solid var(--border,rgba(0,0,0,0.1))', borderRadius: 10, padding: '0.75rem' }}>
                <div style={{ fontSize: 11, color: 'var(--text-muted,#666)', marginBottom: 4 }}>{m.label}</div>
                <div style={{ fontSize: 18, fontWeight: 500, color: m.color }}>{m.value}</div>
                <div style={{ fontSize: 11, color: 'var(--text-muted,#666)', marginBottom: 8 }}>{m.unit}/dia</div>
                <div style={{ height: 3, background: 'rgba(0,0,0,0.08)', borderRadius: 2 }}>
                  <div style={{ height: '100%', width: '0%', background: m.color, borderRadius: 2 }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="day-score-card card" style={{ marginBottom: '1rem' }}>
        <div>
          <div style={{ fontSize: 12, color: 'var(--text-muted,#666)' }}>pontuação do dia</div>
          <div className="day-score-num">{dayScore !== null ? dayScore + '%' : '—'}</div>
        </div>
        {badge && <span className={`badge badge-${badge.type}`}>{badge.label}</span>}
      </div>

      <div className="stat-row">
        <div className="stat-card"><div className="stat-num">{stats.streak}</div><div className="stat-lbl">dias seguidos</div></div>
        <div className="stat-card"><div className="stat-num">{stats.best}</div><div className="stat-lbl">melhor sequência</div></div>
        <div className="stat-card"><div className="stat-num">{stats.total}</div><div className="stat-lbl">dias registrados</div></div>
      </div>

      <div className="pillars-grid">
        {PILLARS.map(p => {
          const c = checkins[p.id]
          const done = !!c
          return (
            <div key={p.id} className={`pillar-card ${done ? 'done' : ''}`} onClick={() => setOpenPillar(p.id)}>
              <div className="pillar-header">
                <div className="pillar-icon" style={{ background: p.color + '22' }}>{p.icon}</div>
                <div className="pillar-check">{done ? '✓' : ''}</div>
              </div>
              <div className="pillar-name">{p.name}</div>
              <div className="pillar-score">{done ? c.score + '%' : '—'}</div>
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
        const existing = checkins[openPillar]?.data
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
