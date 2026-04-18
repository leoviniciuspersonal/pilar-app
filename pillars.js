export const PILLARS = [
  {
    id: 'treino',
    name: 'Treino',
    icon: '💪',
    color: '#378ADD',
    fields: [
      { id: 'feito', label: 'Treinou hoje?', type: 'check', opts: ['Sim', 'Não'] },
      { id: 'tipo', label: 'Tipo de treino', type: 'check', opts: ['Calistenia', 'Cardio', 'Força', 'Mobilidade', 'Descanso ativo'] },
      { id: 'duracao', label: 'Duração (min)', type: 'range', min: 10, max: 120, step: 5, def: 45 },
      { id: 'intensidade', label: 'Intensidade', type: 'range', min: 1, max: 10, step: 1, def: 7 },
      { id: 'nota', label: 'Observação', type: 'text' }
    ],
    score(d) {
      let s = 0
      if (d.feito === 'Sim') s += 40
      if (d.tipo) s += 20
      if (d.duracao >= 30) s += 20; else if (d.duracao >= 15) s += 10
      if (d.intensidade >= 6) s += 20; else if (d.intensidade >= 3) s += 10
      return Math.min(s, 100)
    }
  },
  {
    id: 'refeicao',
    name: 'Refeição',
    icon: '🥗',
    color: '#1D9E75',
    fields: [
      { id: 'refeicoes', label: 'Refeições no dia', type: 'range', min: 1, max: 6, step: 1, def: 3 },
      { id: 'qualidade', label: 'Qualidade geral', type: 'range', min: 1, max: 10, step: 1, def: 7 },
      { id: 'proteina', label: 'Atingiu meta de proteína?', type: 'check', opts: ['Sim', 'Não', 'Parcial'] },
      { id: 'calma', label: 'Comeu com calma?', type: 'check', opts: ['Sim', 'Não'] },
      { id: 'nota', label: 'Observação', type: 'text' }
    ],
    score(d) {
      let s = 0
      if (d.refeicoes >= 3) s += 25; else if (d.refeicoes >= 2) s += 15
      if (d.qualidade >= 7) s += 35; else if (d.qualidade >= 4) s += 20
      if (d.proteina === 'Sim') s += 25; else if (d.proteina === 'Parcial') s += 12
      if (d.calma === 'Sim') s += 15
      return Math.min(s, 100)
    }
  },
  {
    id: 'sono',
    name: 'Sono',
    icon: '🌙',
    color: '#7F77DD',
    fields: [
      { id: 'horas', label: 'Horas dormidas', type: 'range', min: 3, max: 10, step: 0.5, def: 7 },
      { id: 'qualidade', label: 'Qualidade do sono', type: 'range', min: 1, max: 10, step: 1, def: 7 },
      { id: 'acordou', label: 'Acordou bem?', type: 'check', opts: ['Sim', 'Não', 'Mais ou menos'] },
      { id: 'horario', label: 'Dormiu antes da meia-noite?', type: 'check', opts: ['Sim', 'Não'] },
      { id: 'nota', label: 'Observação', type: 'text' }
    ],
    score(d) {
      let s = 0
      if (d.horas >= 7) s += 35; else if (d.horas >= 6) s += 20; else if (d.horas >= 5) s += 10
      if (d.qualidade >= 7) s += 30; else if (d.qualidade >= 4) s += 15
      if (d.acordou === 'Sim') s += 20; else if (d.acordou === 'Mais ou menos') s += 10
      if (d.horario === 'Sim') s += 15
      return Math.min(s, 100)
    }
  },
  {
    id: 'hidratacao',
    name: 'Hidratação',
    icon: '💧',
    color: '#185FA5',
    fields: [
      { id: 'litros', label: 'Litros bebidos', type: 'range', min: 0.5, max: 5, step: 0.25, def: 2 },
      { id: 'meta', label: 'Bateu a meta?', type: 'check', opts: ['Sim', 'Não', 'Parcial'] },
      { id: 'tipo', label: 'O que bebeu', type: 'multicheck', opts: ['Água', 'Água com sal', 'Chá', 'Café', 'Suco natural'] },
      { id: 'nota', label: 'Observação', type: 'text' }
    ],
    score(d) {
      let s = 0
      if (d.litros >= 2.5) s += 50; else if (d.litros >= 2) s += 35; else if (d.litros >= 1.5) s += 20; else s += 10
      if (d.meta === 'Sim') s += 30; else if (d.meta === 'Parcial') s += 15
      if (d.tipo && d.tipo.length > 0) s += 20
      return Math.min(s, 100)
    }
  },
  {
    id: 'mental',
    name: 'Mental',
    icon: '🧠',
    color: '#D4537E',
    fields: [
      { id: 'humor', label: 'Humor geral (1-10)', type: 'range', min: 1, max: 10, step: 1, def: 7 },
      { id: 'estresse', label: 'Nível de estresse (1-10)', type: 'range', min: 1, max: 10, step: 1, def: 4 },
      { id: 'pratica', label: 'Prática mental', type: 'check', opts: ['Meditação', 'Respiração', 'Diário', 'Gratidão', 'Nenhuma'] },
      { id: 'descanso', label: 'Tive momentos de descanso?', type: 'check', opts: ['Sim', 'Não'] },
      { id: 'nota', label: 'Observação', type: 'text' }
    ],
    score(d) {
      let s = 0
      if (d.humor >= 7) s += 30; else if (d.humor >= 4) s += 15
      const est = d.estresse || 5
      if (est <= 3) s += 30; else if (est <= 6) s += 20; else s += 5
      if (d.pratica && d.pratica !== 'Nenhuma') s += 25
      if (d.descanso === 'Sim') s += 15
      return Math.min(s, 100)
    }
  },
  {
    id: 'suplementacao',
    name: 'Suplementação',
    icon: '💊',
    color: '#BA7517',
    fields: [
      { id: 'tomou', label: 'Tomou suplementos hoje?', type: 'check', opts: ['Sim', 'Não', 'Parcial'] },
      { id: 'itens', label: 'O que tomou', type: 'multicheck', opts: ['Creatina', 'Proteína', 'Vitamina D', 'Ômega 3', 'Magnésio', 'Multivitamínico'] },
      { id: 'consistencia', label: 'Consistência esta semana', type: 'range', min: 1, max: 7, step: 1, def: 5 },
      { id: 'nota', label: 'Observação', type: 'text' }
    ],
    score(d) {
      let s = 0
      if (d.tomou === 'Sim') s += 50; else if (d.tomou === 'Parcial') s += 25
      if (d.itens && d.itens.length > 0) s += 30
      if (d.consistencia >= 5) s += 20; else if (d.consistencia >= 3) s += 10
      return Math.min(s, 100)
    }
  }
]

export function getDayScore(pillarsData) {
  if (!pillarsData) return null
  const scores = PILLARS.map(p => {
    const d = pillarsData[p.id]
    return d ? p.score(d) : null
  }).filter(x => x !== null)
  if (scores.length === 0) return null
  return Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
}

export function getScoreBadge(score) {
  if (score === null) return null
  if (score >= 80) return { label: 'Excelente', type: 'success' }
  if (score >= 60) return { label: 'Bom', type: 'info' }
  if (score >= 40) return { label: 'Regular', type: 'warning' }
  return { label: 'Fraco', type: 'danger' }
}
