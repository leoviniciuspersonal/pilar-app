import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
 
const todayKey = () => new Date().toISOString().slice(0, 10)
 
export default function MacroTracker({ user, profile }) {
  const [search, setSearch] = useState('')
  const [results, setResults] = useState([])
  const [selected, setSelected] = useState(null)
  const [quantity, setQuantity] = useState(100)
  const [entries, setEntries] = useState([])
  const [loading, setLoading] = useState(false)
 
  const meta = {
    cals: profile?.target_cals || 0,
    protein: profile?.target_protein || 0,
    carbs: profile?.target_carbs || 0,
    fat: profile?.target_fat || 0,
  }
 
  useEffect(() => { loadEntries() }, [])
 
  async function loadEntries() {
    const { data } = await supabase
      .from('macro_entries')
      .select('*')
      .eq('user_id', user.id)
      .eq('date', todayKey())
      .order('created_at', { ascending: true })
    if (data) setEntries(data)
  }
 
  async function doSearch(q) {
    setSearch(q)
    if (q.length < 2) { setResults([]); return }
    setLoading(true)
    const { data } = await supabase
      .from('taco_alimentos')
      .select('*')
      .ilike('nome', '%' + q + '%')
      .limit(8)
    setResults(data || [])
    setLoading(false)
  }
 
  async function addEntry() {
    if (!selected) return
    const factor = quantity / 100
    const entry = {
      user_id: user.id,
      date: todayKey(),
      alimento_id: selected.id,
      alimento_nome: selected.nome,
      quantidade_g: quantity,
      energia_kcal: Math.round(selected.energia_kcal * factor),
      proteina_g: parseFloat((selected.proteina_g * factor).toFixed(1)),
      carboidrato_g: parseFloat((selected.carboidrato_g * factor).toFixed(1)),
      gordura_g: parseFloat((selected.gordura_g * factor).toFixed(1)),
    }
    const { data } = await supabase.from('macro_entries').insert(entry).select().single()
    if (data) setEntries(prev => [...prev, data])
    setSelected(null)
    setSearch('')
    setResults([])
    setQuantity(100)
  }
 
  async function removeEntry(id) {
    await supabase.from('macro_entries').delete().eq('id', id)
    setEntries(prev => prev.filter(e => e.id !== id))
  }
 
  const totals = entries.reduce((acc, e) => ({
    cals: acc.cals + e.energia_kcal,
    protein: acc.protein + e.proteina_g,
    carbs: acc.carbs + e.carboidrato_g,
    fat: acc.fat + e.gordura_g,
  }), { cals: 0, protein: 0, carbs: 0, fat: 0 })
 
  const pct = (val, total) => total > 0 ? Math.min(100, Math.round((val / total) * 100)) : 0
 
  const bars = [
    { label: 'Calorias', val: Math.round(totals.cals), meta: meta.cals, unit: 'kcal', color: '#D85A30' },
    { label: 'Proteina', val: Math.round(totals.protein * 10) / 10, meta: meta.protein, unit: 'g', color: '#1D9E75' },
    { label: 'Carbo', val: Math.round(totals.carbs * 10) / 10, meta: meta.carbs, unit: 'g', color: '#BA7517' },
    { label: 'Gordura', val: Math.round(totals.fat * 10) / 10, meta: meta.fat, unit: 'g', color: '#7F77DD' },
  ]
 
  return (
    <div style={{ background: 'var(--card,#fff)', border: '0.5px solid rgba(0,0,0,0.1)', borderRadius: 12, padding: '1rem', marginBottom: '1.5rem' }}>
      <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 12 }}>Nutricao do dia</div>
 
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 14 }}>
        {bars.map(b => (
          <div key={b.label}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#666', marginBottom: 3 }}>
              <span>{b.label}</span>
              <span style={{ color: b.color, fontWeight: 500 }}>{b.val}/{b.meta}{b.unit}</span>
            </div>
            <div style={{ height: 4, background: 'rgba(0,0,0,0.06)', borderRadius: 2, overflow: 'hidden' }}>
              <div style={{ height: '100%', width: pct(b.val, b.meta) + '%', background: b.color, borderRadius: 2, transition: 'width 0.3s' }} />
            </div>
          </div>
        ))}
      </div>
 
      <div style={{ position: 'relative', marginBottom: 8 }}>
        <input
          type="text"
          placeholder="Buscar alimento..."
          value={search}
          onChange={e => doSearch(e.target.value)}
          style={{ width: '100%', fontSize: 13 }}
        />
        {results.length > 0 && (
          <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: 'var(--card,#fff)', border: '0.5px solid rgba(0,0,0,0.15)', borderRadius: 8, zIndex: 10, maxHeight: 200, overflowY: 'auto', marginTop: 2 }}>
            {results.map(r => (
              <div
                key={r.id}
                onClick={() => { setSelected(r); setResults([]); setSearch(r.nome) }}
                style={{ padding: '8px 12px', cursor: 'pointer', fontSize: 13, borderBottom: '0.5px solid rgba(0,0,0,0.05)' }}
              >
                <div style={{ fontWeight: 500 }}>{r.nome}</div>
                <div style={{ fontSize: 11, color: '#888' }}>{r.energia_kcal}kcal | P:{r.proteina_g}g C:{r.carboidrato_g}g G:{r.gordura_g}g (por 100g)</div>
              </div>
            ))}
          </div>
        )}
      </div>
 
      {selected && (
        <div style={{ display: 'flex', gap: 8, marginBottom: 8, alignItems: 'center' }}>
          <div style={{ fontSize: 12, color: '#666', whiteSpace: 'nowrap' }}>Quantidade (g):</div>
          <input
            type="number"
            value={quantity}
            onChange={e => setQuantity(parseInt(e.target.value) || 0)}
            style={{ width: 80, fontSize: 13 }}
            min={1}
          />
          <button
            onClick={addEntry}
            style={{ flex: 1, padding: '6px 12px', fontSize: 12, borderRadius: 8, border: '0.5px solid #1D9E75', color: '#1D9E75', background: 'transparent', cursor: 'pointer' }}
          >
            Adicionar
          </button>
        </div>
      )}
 
      {entries.length > 0 && (
        <div style={{ borderTop: '0.5px solid rgba(0,0,0,0.06)', paddingTop: 10 }}>
          {entries.map(e => (
            <div key={e.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 12, color: '#666', paddingBottom: 4 }}>
              <div>
                <span style={{ color: 'inherit', fontWeight: 500 }}>{e.alimento_nome}</span>
                <span style={{ marginLeft: 6 }}>{e.quantidade_g}g</span>
                <span style={{ marginLeft: 6, color: '#D85A30' }}>{e.energia_kcal}kcal</span>
              </div>
              <button onClick={() => removeEntry(e.id)} style={{ border: 'none', background: 'transparent', color: '#e24b4a', cursor: 'pointer', fontSize: 14, padding: '0 4px' }}>x</button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
 
