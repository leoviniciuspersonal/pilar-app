# Pilar App

Rastreador de saúde e hábitos com 6 pilares: Treino, Refeição, Sono, Hidratação, Mental e Suplementação.

## Stack
- React 18
- Supabase (banco + auth)
- Vercel (hospedagem)

## Deploy no Vercel

1. Faça upload deste projeto no GitHub
2. Acesse vercel.com e importe o repositório
3. Configure as variáveis de ambiente:
   - `REACT_APP_SUPABASE_URL`
   - `REACT_APP_SUPABASE_ANON_KEY`
4. Clique em Deploy

## Variáveis de ambiente necessárias

Copie o arquivo `.env.example` para `.env` e preencha com suas chaves do Supabase.

## Para virar treinador

Execute no SQL Editor do Supabase:
```sql
update profiles set role = 'trainer' where id = 'SEU_USER_ID';
```

Seu user_id aparece em Authentication > Users no painel do Supabase.
