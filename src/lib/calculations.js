export const ACTIVITY_LEVELS = [
  { id: 'sedentary', label: 'Sedentário', desc: 'Pouco ou nenhum exercício', factor: 1.2 },
  { id: 'light', label: 'Leve', desc: '1-3 dias de exercício por semana', factor: 1.375 },
  { id: 'moderate', label: 'Moderado', desc: '3-5 dias de exercício por semana', factor: 1.55 },
  { id: 'active', label: 'Ativo', desc: '6-7 dias de exercício por semana', factor: 1.725 },
  { id: 'very_active', label: 'Muito ativo', desc: 'Exercício intenso diário ou 2x por dia', factor: 1.9 },
]

export const OBJECTIVES = [
  { id: 'lose', label: 'Emagrecimento', desc: 'Déficit calórico para perda de gordura', calAdj: -500, proteinFactor: 2.2 },
  { id: 'maintain', label: 'Manutenção', desc: 'Manter peso e composição atual', calAdj: 0, proteinFactor: 1.8 },
  { id: 'gain', label: 'Ganho de massa', desc: 'Superávit calórico para ganho muscular', calAdj: 300, proteinFactor: 2.0 },
  { id: 'recomp', label: 'Recomposição', desc: 'Perder gordura e ganhar músculo', calAdj: -200, proteinFactor: 2.4 },
]

export function calcTMB({ weight, height, age, sex, unit }) {
  let w = weight
  let h = height
  if (unit === 'imperial') {
    w = weight * 0.453592
    h = height * 2.54
  }
  if (sex === 'male') {
    return 10 * w + 6.25 * h - 5 * age + 5
  } else {
    return 10 * w + 6.25 * h - 5 * age - 161
  }
}

export function calcTDEE(tmb, activityId) {
  const act = ACTIVITY_LEVELS.find(a => a.id === activityId)
  return tmb * (act?.factor || 1.55)
}

export function calcTargets({ weight, unit, activityId, objectiveId }) {
  let w = weight
  if (unit === 'imperial') w = weight * 0.453592
  const obj = OBJECTIVES.find(o => o.id === objectiveId)
  return {
    protein: Math.round(w * (obj?.proteinFactor || 2.0)),
    water: parseFloat((w * (activityId === 'sedentary' ? 0.033 : activityId === 'light' ? 0.035 : 0.040)).toFixed(1)),
  }
}

export function calcMacros(calories, proteinG) {
  const proteinCal = proteinG * 4
  const remaining = calories - proteinCal
  return {
    protein: proteinG,
    fat: Math.round((remaining * 0.35) / 9),
    carbs: Math.round((remaining * 0.65) / 4),
  }
}

export function calcAll(profile) {
  const { weight, height, age, sex, unit, activityId, objectiveId } = profile
  if (!weight || !height || !age || !sex || !activityId || !objectiveId) return null
  const tmb = calcTMB({ weight, height, age, sex, unit })
  const tdee = calcTDEE(tmb, activityId)
  const obj = OBJECTIVES.find(o => o.id === objectiveId)
  const targetCals = Math.round(tdee + (obj?.calAdj || 0))
  const targets = calcTargets({ weight, unit, activityId, objectiveId })
  const macros = calcMacros(targetCals, targets.protein)
  return {
    tmb: Math.round(tmb),
    tdee: Math.round(tdee),
    targetCals,
    protein: macros.protein,
    fat: macros.fat,
    carbs: macros.carbs,
    water: targets.water,
  }
}
