import { useState } from 'react'

export default function CheckinModal({ pillar, existing, onSave, onClose }) {
  const [values, setValues] = useState(() => {
    const defaults = {}
    pillar.fields.forEach(f => {
      if (existing && existing[f.id] !== undefined) {
        defaults[f.id] = existing[f.id]
      } else if (f.type === 'range') {
        defaults[f.id] = f.def
      } else if (f.type === 'multicheck') {
        defaults[f.id] = []
      } else {
        defaults[f.id] = ''
      }
    })
    return defaults
  })

  function setVal(id, val) {
    setValues(v => ({ ...v, [id]: val }))
  }

  function toggleCheck(id, opt) {
    setValues(v => ({ ...v, [id]: v[id] === opt ? '' : opt }))
  }

  function toggleMulti(id, opt) {
    setValues(v => {
      const arr = Array.isArray(v[id]) ? v[id] : []
      return {
        ...v,
        [id]: arr.includes(opt) ? arr.filter(x => x !== opt) : [...arr, opt]
      }
    })
  }

  const score = pillar.score(values)

  return (
    <div className="overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-title">
          <span style={{ fontSize: 20 }}>{pillar.icon}</span>
          {pillar.name}
          <span style={{ marginLeft: 'auto', fontSize: 13, color: '#666' }}>
            {score}%
          </span>
        </div>

        {pillar.fields.map(f => (
          <div className="field" key={f.id}>
            <label>{f.label}</label>

            {f.type === 'range' && (
              <div className="slider-row">
                <input
                  type="range"
                  min={f.min} max={f.max} step={f.step}
                  value={values[f.id]}
                  onChange={e => setVal(f.id, parseFloat(e.target.value))}
                />
                <span className="slider-val">{values[f.id]}</span>
              </div>
            )}

            {f.type === 'check' && (
              <div className="check-group">
                {f.opts.map(opt => (
                  <button
                    key={opt}
                    className={`check-opt ${values[f.id] === opt ? 'sel' : ''}`}
                    onClick={() => toggleCheck(f.id, opt)}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            )}

            {f.type === 'multicheck' && (
              <div className="check-group">
                {f.opts.map(opt => (
                  <button
                    key={opt}
                    className={`check-opt ${(values[f.id] || []).includes(opt) ? 'sel' : ''}`}
                    onClick={() => toggleMulti(f.id, opt)}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            )}

            {f.type === 'text' && (
              <textarea
                rows={2}
                placeholder="opcional..."
                value={values[f.id] || ''}
                onChange={e => setVal(f.id, e.target.value)}
              />
            )}
          </div>
        ))}

        <div className="modal-actions">
          <button onClick={onClose}>Cancelar</button>
          <button className="primary" onClick={() => onSave(values, score)}>
            Salvar
          </button>
        </div>
      </div>
    </div>
  )
}
