import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { ACTIVITY_LEVELS, OBJECTIVES, calcAll } from '../lib/calculations'

export default function Profile({ user, profile, onUpdate }) {
  const [data, setData] = useState({
    name: profile?.name || '',
    unit: profile?.unit || 'metric',
    weight: profile?.weight || '',
    height: profile?.height || '',
    age: profile?.age || '',
    sex: profile?.sex || '',
    activityId: profile?.activity_id || '',
    objectiveId: profile?.objective_id || '',
  })
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  function setVal(key, val) { setData(d => ({ ...d, [key]: val })) }

  const results = calcAll({
    weight: parseFloat(data.weight),
    height: parseFloat(data.height),
    age: parseInt(data.age),
    sex: data.sex,
    unit: data.unit,
    activityId: data.activityId,
    objectiveId: data.objectiveId,
  })

  async function save() {
    setSaving(true)
    await supabase.from('profiles').update({
      name: data.name,
      weight: parseFloat(data.weight),
      height: parseFloat(data.height),
      age: parseInt(data.age),
      sex: data.sex,
      unit: data.unit,
      activity_id: data.activityId,
      objective_id: data.objectiveId,
      target_cals: results?.targetCals,
      target_protein: results?.protein,
      target_carbs: results?.carbs,
      target_fat: results?.fat,
      target_water: results?.water,
    }).eq('id', user.id)
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
    if (onUpdate) onUpdate()
  }

  const wLabel = data.unit === 'metric' ? 'kg' : 'lbs'
  const hLabel = data.unit === 'metric' ? 'cm' : 'pol'

  const cardSel = (active) => ({
    padding: '0.75rem 1rem', borderRadius: 10, cursor: 'pointer',
    border: active ? '2px solid #378ADD' : '0.5px solid rgba(0,0,0,0.15)',
    background: active ? '#e6f1fb' : 'transparent',
    transition: 'all 0.15s', marginBottom: 0,
  })

  return (
    <div style={{ maxWidth: 480, margin: '0 auto' }}>
      <div style={{ fontSize: 16, fontWeight: 500, marginBottom: '1.5rem' }}>Meu perfil</div>

      <div style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 12, color: '#666', marginBottom: 6 }}>Nome</div>
        <input type="text" value={data.name} onChange={e => setVal('name', e.target.value)} style={{ width: '100%' }} />
      </div>

      <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 10, color: '#666' }}>Unidade de medida</div>
      <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
        {[{ id: 'metric', label: 'Metrico', sub: 'kg / cm' }, { id: 'imperial', label: 'Imperial', sub: 'lbs / pol' }].map(u => (
          <div key={u.id} onClick={() => setVal('unit', u.id)} style={{ ...cardSel(data.unit === u.id), flex: 1 }}>
            <div style={{ fontWeight: 500, fontSize: 14, color: data.unit === u.id ? '#185FA5' : 'inherit' }}>{u.label}</div>
            <div style={{ fontSize: 12, color: data.unit === u.id ? '#185FA5' : '#888', marginTop: 2 }}>{u.sub}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 10, marginBottom: 12 }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 12, color: '#666', marginBottom: 6 }}>Peso ({wLabel})</div>
          <input type="number" value={data.weight} onChange={e => setVal('weight', e.target.value)} style={{ width: '100%' }} />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 12, color: '#666', marginBottom: 6 }}>Altura ({hLabel})</div>
          <input type="number" value={data.height} onChange={e => setVal('height', e.target.value)} style={{ width: '100%' }} />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 12, color: '#666', marginBottom: 6 }}>Idade</div>
          <input type="number" value={data.age} onChange={e => setVal('age', e.target.value)} style={{ width: '100%' }} />
        </div>
      </div>

      <div style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 12, color: '#666', marginBottom: 8 }}>Sexo biologico</div>
        <div style={{ display: 'flex', gap: 10 }}>
          {[{ id: 'male', label: 'Masculino' }, { id: 'female', label: 'Feminino' }].map(s => (
            <div key={s.id} onClick={() => setVal('sex', s.id)} style={{ ...cardSel(data.sex === s.id), flex: 1, textAlign: 'center' }}>
              <div style={{ fontWeight: 500, fontSize: 14, color: data.sex === s.id ? '#185FA5' : 'inherit' }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 12, color: '#666', marginBottom: 8 }}>Nivel de atividade</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {ACTIVITY_LEVELS.map(a => (
            <div key={a.id} onClick={() => setVal('activityId', a.id)} style={cardSel(data.activityId === a.id)}>
              <div style={{ fontWeight: 500, fontSize: 13, color: data.activityId === a.id ? '#185FA5' : 'inherit' }}>{a.label}</div>
              <div style={{ fontSize: 11, color: data.activityId === a.id ? '#185FA5' : '#888', marginTop: 2 }}>{a.desc}</div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 12, color: '#666', marginBottom: 8 }}>Objetivo</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {OBJECTIVES.map(o => (
            <div key={o.id} onClick={() => setVal('objectiveId', o.id)} style={cardSel(data.objectiveId === o.id)}>
              <div style={{ fontWeight: 500, fontSize: 13, color: data.objectiveId === o.id ? '#185FA5' : 'inherit' }}>{o.label}</div>
              <div style={{ fontSize: 11, color: data.objectiveId === o.id ? '#185FA5' : '#888', marginTop: 2 }}>{o.desc}</div>
            </div>
          ))}
        </div>
      </div>

      {results && (
        <div style={{ background: 'rgba(0,0,0,0.03)', borderRadius: 10, padding: '1rem', marginBottom: 16 }}>
          <div style={{ fontSize: 12, color: '#666', marginBottom: 10, fontWeight: 500 }}>Metas calculadas</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
            {[
              { label: 'Calorias', value: results.targetCals, unit: 'kcal', color: '#D85A30' },
              { label: 'Agua', value: results.water, unit: 'L', color: '#378ADD' },
              { label: 'Proteina', value: results.protein, unit: 'g', color: '#1D9E75' },
              { label: 'Carbo', value: results.carbs, unit: 'g', color: '#BA7517' },
              { label: 'Gordura', value: results.fat, unit: 'g', color: '#7F77DD' },
              { label: 'TMB', value: results.tmb, unit: 'kcal', color: '#888' },
            ].map(m => (
              <div key={m.label} style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 11, color: '#888' }}>{m.label}</div>
                <div style={{ fontSize: 16, fontWeight: 500, color: m.color }}>{m.value}</div>
                <div style={{ fontSize: 10, color: '#888' }}>{m.unit}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      <button
        onClick={save}
        disabled={saving}
        className="primary"
        style={{ width: '100%', padding: '10px', fontSize: 14 }}
      >
        {saving ? 'Salvando...' : saved ? 'Salvo!' : 'Salvar perfil'}
      </button>
    </div>
  )
}
