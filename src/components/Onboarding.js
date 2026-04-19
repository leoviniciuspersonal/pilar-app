import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { ACTIVITY_LEVELS, OBJECTIVES, calcAll } from '../lib/calculations'

const STEPS = ['unidade', 'corpo', 'atividade', 'objetivo', 'resumo']

export default function Onboarding({ user, onComplete }) {
  const [step, setStep] = useState(0)
  const [saving, setSaving] = useState(false)
  const [data, setData] = useState({
    unit: 'metric', weight: '', height: '', age: '', sex: '', activityId: '', objectiveId: '',
  })

  function setVal(key, val) { setData(d => ({ ...d, [key]: val })) }
  function next() { setStep(s => Math.min(s + 1, STEPS.length - 1)) }
  function back() { setStep(s => Math.max(s - 1, 0)) }

  const getResults = () => calcAll({
    weight: parseFloat(data.weight), height: parseFloat(data.height),
    age: parseInt(data.age), sex: data.sex, unit: data.unit,
    activityId: data.activityId, objectiveId: data.objectiveId,
  })

  async function save() {
    setSaving(true)
    const r = getResults()
    await supabase.from('profiles').update({
      weight: parseFloat(data.weight), height: parseFloat(data.height),
      age: parseInt(data.age), sex: data.sex, unit: data.unit,
      activity_id: data.activityId, objective_id: data.objectiveId,
      target_cals: r ? r.targetCals : null,
      target_protein: r ? r.protein : null,
      target_carbs: r ? r.carbs : null,
      target_fat: r ? r.fat : null,
      target_water: r ? r.water : null,
      onboarding_done: true,
    }).eq('id', user.id)
    setSaving(false)
    onComplete()
  }

  const canNext = () => {
    if (step === 0) return !!data.unit
    if (step === 1) return data.weight && data.height && data.age && data.sex
    if (step === 2) return !!data.activityId
    if (step === 3) return !!data.objectiveId
    return true
  }

  const wLabel = data.unit === 'metric' ? 'kg' : 'lbs'
  const hLabel = data.unit === 'metric' ? 'cm' : 'polegadas'

  const cardStyle = (active) => ({
    padding: '0.875rem 1rem', borderRadius: 10, cursor: 'pointer',
    border: active ? '2px solid #378ADD' : '0.5px solid rgba(0,0,0,0.15)',
    background: active ? '#e6f1fb' : 'transparent',
    transition: 'all 0.15s', marginBottom: 0,
  })

  const titleColor = (active) => ({ fontWeight: 500, fontSize: 14, color: active ? '#185FA5' : 'inherit' })
  const subColor = (active) => ({ fontSize: 12, color: active ? '#185FA5' : '#888', marginTop: 2 })

  const results = step === 4 ? getResults() : null

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
      <div style={{ width: '100%', maxWidth: 420 }}>
        <div style={{ marginBottom: '2rem' }}>
          <div style={{ display: 'flex', gap: 6, marginBottom: 8 }}>
            {STEPS.map((_, i) => (
              <div key={i} style={{ flex: 1, height: 3, borderRadius: 2, background: i <= step ? '#378ADD' : 'rgba(0,0,0,0.1)', transition: 'background 0.3s' }} />
            ))}
          </div>
          <div style={{ fontSize: 12, color: '#999' }}>{step + 1} de {STEPS.length}</div>
        </div>

        {step === 0 && (
          <div>
            <div style={{ fontSize: 22, fontWeight: 500, marginBottom: 8 }}>Bem-vindo ao Pilar</div>
            <div style={{ fontSize: 15, color: '#666', marginBottom: '2rem' }}>Vamos configurar seu perfil para calcular suas metas automaticamente.</div>
            <div style={{ fontSize: 13, color: '#666', marginBottom: 10 }}>Unidade de medida</div>
            <div style={{ display: 'flex', gap: 10 }}>
              {[{ id: 'metric', label: 'Métrico', sub: 'kg / cm' }, { id: 'imperial', label: 'Imperial', sub: 'lbs / pol' }].map(u => (
                <div key={u.id} onClick={() => setVal('unit', u.id)} style={{ ...cardStyle(data.unit === u.id), flex: 1 }}>
                  <div style={titleColor(data.unit === u.id)}>{u.label}</div>
                  <div style={subColor(data.unit === u.id)}>{u.sub}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {step === 1 && (
          <div>
            <div style={{ fontSize: 22, fontWeight: 500, marginBottom: 8 }}>Dados corporais</div>
            <div style={{ fontSize: 15, color: '#666', marginBottom: '2rem' }}>Usados para calcular sua TMB, calorias e metas de água.</div>
            <div style={{ display: 'flex', gap: 10, marginBottom: 12 }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 12, color: '#666', marginBottom: 6 }}>Peso ({wLabel})</div>
                <input type="number" placeholder={data.unit === 'metric' ? '75' : '165'} value={data.weight} onChange={e => setVal('weight', e.target.value)} style={{ width: '100%' }} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 12, color: '#666', marginBottom: 6 }}>Altura ({hLabel})</div>
                <input type="number" placeholder={data.unit === 'metric' ? '175' : '69'} value={data.height} onChange={e => setVal('height', e.target.value)} style={{ width: '100%' }} />
              </div>
            </div>
            <div style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 12, color: '#666', marginBottom: 6 }}>Idade</div>
              <input type="number" placeholder="30" value={data.age} onChange={e => setVal('age', e.target.value)} style={{ width: '100%' }} />
            </div>
            <div>
              <div style={{ fontSize: 12, color: '#666', marginBottom: 8 }}>Sexo biológico</div>
              <div style={{ display: 'flex', gap: 10 }}>
                {[{ id: 'male', label: 'Masculino' }, { id: 'female', label: 'Feminino' }].map(s => (
                  <div key={s.id} onClick={() => setVal('sex', s.id)} style={{ ...cardStyle(data.sex === s.id), flex: 1, textAlign: 'center' }}>
                    <div style={titleColor(data.sex === s.id)}>{s.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {step === 2 && (
          <div>
            <div style={{ fontSize: 22, fontWeight: 500, marginBottom: 8 }}>Nível de atividade</div>
            <div style={{ fontSize: 15, color: '#666', marginBottom: '1.5rem' }}>Considera sua rotina geral, não só treinos.</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {ACTIVITY_LEVELS.map(a => (
                <div key={a.id} onClick={() => setVal('activityId', a.id)} style={cardStyle(data.activityId === a.id)}>
                  <div style={titleColor(data.activityId === a.id)}>{a.label}</div>
                  <div style={subColor(data.activityId === a.id)}>{a.desc}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {step === 3 && (
          <div>
            <div style={{ fontSize: 22, fontWeight: 500, marginBottom: 8 }}>Objetivo</div>
            <div style={{ fontSize: 15, color: '#666', marginBottom: '1.5rem' }}>Define o ajuste calórico e distribuição de macros.</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {OBJECTIVES.map(o => (
                <div key={o.id} onClick={() => setVal('objectiveId', o.id)} style={cardStyle(data.objectiveId === o.id)}>
                  <div style={titleColor(data.objectiveId === o.id)}>{o.label}</div>
                  <div style={subColor(data.objectiveId === o.id)}>{o.desc}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {step === 4 && results && (
          <div>
            <div style={{ fontSize: 22, fontWeight: 500, marginBottom: 8 }}>Suas metas diárias</div>
            <div style={{ fontSize: 15, color: '#666', marginBottom: '1.5rem' }}>Calculadas com base no seu perfil.</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 16 }}>
              {[
                { label: 'Calorias', value: results.targetCals, unit: 'kcal', color: '#D85A30' },
                { label: 'Água', value: results.water, unit: 'litros', color: '#378ADD' },
                { label: 'Proteína', value: results.protein, unit: 'g', color: '#1D9E75' },
                { label: 'Carboidratos', value: results.carbs, unit: 'g', color: '#BA7517' },
                { label: 'Gordura', value: results.fat, unit: 'g', color: '#7F77DD' },
                { label: 'TMB', value: results.tmb, unit: 'kcal', color: '#888' },
              ].map(m => (
                <div key={m.label} style={{ border: '0.5px solid rgba(0,0,0,0.1)', borderRadius: 10, padding: '0.875rem' }}>
                  <div style={{ fontSize: 11, color: '#888', marginBottom: 4 }}>{m.label}</div>
                  <div style={{ fontSize: 20, fontWeight: 500, color: m.color }}>{m.value}</div>
                  <div style={{ fontSize: 11, color: '#888' }}>{m.unit}</div>
                </div>
              ))}
            </div>
            <div style={{ fontSize: 12, color: '#888', padding: '0.75rem', background: 'rgba(0,0,0,0.03)', borderRadius: 8, marginBottom: '1.5rem' }}>
              TMB {results.tmb} kcal → TDEE {results.tdee} kcal → Meta {results.targetCals} kcal/dia
            </div>
          </div>
        )}

        <div style={{ display: 'flex', gap: 10, marginTop: '2rem' }}>
          {step > 0 && <button onClick={back} style={{ flex: 1 }}>Voltar</button>}
          {step < STEPS.length - 1
            ? <button onClick={next} disabled={!canNext()} className="primary" style={{ flex: 2, opacity: canNext() ? 1 : 0.4 }}>Continuar</button>
            : <button onClick={save} disabled={saving} className="primary" style={{ flex: 2 }}>{saving ? 'Salvando...' : 'Começar'}</button>
          }
        </div>
      </div>
    </div>
  )
}
