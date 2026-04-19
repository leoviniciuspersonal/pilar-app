import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

const todayKey = () => new Date().toISOString().slice(0, 10)
const QUICK_ADD = [150, 200, 300, 500]

export default function WaterTracker({ user, meta }) {
  const [total, setTotal] = useState(0)
  const [entries, setEntries] = useState([])
  const [custom, setCustom] = useState('')
  const [showCustom, setShowCustom] = useState(false)
  const [saving, setSaving] = useState(false)

  const metaMl = (meta || 2) * 1000

  useEffect(() => { load() }, [])

  async function load() {
    const { data } = await supabase
      .from('water_entries')
      .select('id, amount_ml, created_at')
      .eq('user_id', user.id)
      .eq('date', todayKey())
      .order('created_at', { ascending: true })
    if (data) {
      setEntries(data)
      setTotal(data.reduce((s, e) => s + e.amount_ml, 0))
    }
  }

  async function add(ml) {
    if (saving) return
    setSaving(true)
    const { data } = await supabase
      .from('water_entries')
      .insert({ user_id: user.id, date: todayKey(), amount_ml: ml })
      .select()
      .single()
    if (data) {
      setEntries(prev => [...prev, data])
      setTotal(prev => prev + ml)
    }
    setSaving(false)
    setCustom('')
    setShowCustom(false)
  }

  async function remove(id, ml) {
    await supabase.from('water_entries').delete().eq('id', id)
    setEntries(prev => prev.filter(e => e.id !== id))
    setTotal(prev => Math.max(0, prev - ml))
  }

  const pct = Math.min(100, Math.round((total / metaMl) * 100))
  const litros = (total / 1000).toFixed(2)
  const falta = Math.max(0, metaMl - total)
  const bateu = total >= metaMl

  return (
    <div style={{ background: 'var(--card,#fff)', border: bateu ? '0.5px solid #1D9E75' : '0.5px solid var(--border,rgba(0,0,0,0.1))', borderRadius: 12, padding: '1rem', marginBottom: '1.5rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 20 }}>💧</span>
          <div>
            <div style={{ fontSize: 13, fontWeight: 500 }}>Hidratação</div>
            <div style={{ fontSize: 11, color: 'var(--text-muted,#666)' }}>
              {bateu ? 'Meta atingida!' : `faltam ${(falta / 1000).toFixed(2)}L`}
            </div>
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 20, fontWeight: 500, color: '#378ADD' }}>{litros}L</div>
          <div style={{ fontSize: 11, color: 'var(--text-muted,#666)' }}>de {meta || 2}L</div>
        </div>
      </div>

      <div style={{ height: 8, background: 'rgba(0,0,0,0.06)', borderRadius: 4, marginBottom: 14, overflow: 'hidden' }}>
        <div style={{ height: '100%', width: pct + '%', background: bateu ? '#1D9E75' : '#378ADD', borderRadius: 4, transition: 'width 0.4s' }} />
      </div>

      <div style={{ display: 'flex', gap: 6, marginBottom: 10, flexWrap: 'wrap' }}>
        {QUICK_ADD.map(ml => (
          <button key={ml} onClick={() => add(ml)} disabled={saving} style={{ padding: '5px 12px', fontSize: 12, borderRadius: 8, border: '0.5px solid #378ADD', color: '#378ADD', background: 'transparent', cursor: 'pointer' }}>
            +{ml}ml
          </button>
        ))}
        <button onClick={() => setShowCustom(s => !s)} style={{ padding: '5px 12px', fontSize: 12, borderRadius: 8, border: '0.5px solid rgba(0,0,0,0.15)', color: 'var(--text-muted,#666)', background: 'transparent', cursor: 'pointer' }}>
          outro
        </button>
      </div>

      {showCustom && (
        <div style={{ display: 'flex', gap: 6, marginBottom: 10 }}>
          <input
            type="number"
            placeholder="quantidade em ml"
            value={custom}
            onChange={e => setCustom(e.target.value)}
            style={{ flex: 1, fontSize: 13 }}
          />
          <button onClick={() => { if (custom > 0) add(parseInt(custom)) }} style={{ padding: '6px 14px', fontSize: 13, borderRadius: 8, border: '0.5px solid #378ADD', color: '#378ADD', background: 'transparent', cursor: 'pointer' }}>
            Adicionar
          </button>
        </div>
      )}

      {entries.length > 0 && (
        <div style={{ borderTop: '0.5px solid rgba(0,0,0,0.06)', paddingTop: 10, display: 'flex', flexDirection: 'column', gap: 4 }}>
          {entries.map(e => (
            <div key={e.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 12, color: 'var(--text-muted,#666)' }}>
              <span>{new Date(e.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })} — {e.amount_ml}ml</span>
              <button onClick={() => remove(e.id, e.amount_ml)} style={{ border: 'none', background: 'transparent', color: '#e24b4a', cursor: 'pointer', fontSize: 12, padding: '2px 6px' }}>×</button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
