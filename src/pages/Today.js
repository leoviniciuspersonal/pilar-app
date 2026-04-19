import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { PILLARS, getDayScore, getScoreBadge } from '../lib/pillars'
import CheckinModal from '../components/CheckinModal'
import WaterTracker from '../components/WaterTracker'

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
  const firstName = profile?.name?.split(' ')[0] || 'voce'

  const pillarsData = {}
  Object.entries(checkins).forEach(([k, v]) => { pillarsData[k] = v.data })
  const dayScore = getDayScore(pillarsData)
  const badge = getScoreBadge(dayScore)

  const metas = [
    { label: 'Calorias', value: profile?.target_cals, unit: 'kcal', color: '#D85A30' },
    { label: 'Proteina', value: profile?.target_protein, unit: 'g', color: '#1D9E75' },
    { label: 'Carbo', value: profile?.target_carbs, unit: 'g', color: '#BA7517' },
    { label: 'Gordura', value: profile?.target_fat, unit: 'g', color: '#7F77DD' },
  ].filter(m => m.value)

  const PILLARS_SEM_AGUA = PILLARS.filter(p => p.id !== 'hidratacao')

  if (loading) return (
    <div style={{ padding: '2rem', color: '#666', textAlign: 'center' }}>Carregando...</div>
  )

  return (
    <div>
      <p className="greeting"><strong>{greet}, {firstName}.</strong> Como foi hoje?</p>

      {metas.length > 0 && (
        <div style={{ marginBottom: '1.5rem' }}>
          <div style={{ fontSize: 12, color: '#666', marginBottom: 10, fontWeight: 500 }}>
            METAS DO DIA
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: 8 }}>
            {metas.map(m => (
              <div key={m.label} style={{ background: 'var(--card,#fff)', border: '0.5px solid rgba(0,0,0,0.1)', borderRadius: 10, padding: '0.75rem' }}>
                <div style={{ fontSize: 11, color: '#666', marginBottom: 4 }}>{m.label}</div>
                <div style={{ fontSize: 18, fontWeight: 500, color: m.color }}>{m.value}</div>
                <div style={{ fontSize: 11, color: '#666' }}>{m.unit}/dia</div>
              </div>
            ))}
          </div>
        </div>
      )}

      <WaterTracker user={user} meta={profile?.target_water || 2} />

      <div className="day-score-card card" style={{ marginBottom: '1rem' }}>
        <div>
          <div style={{ fontSize: 12, color: '#666' }}>pontuac
