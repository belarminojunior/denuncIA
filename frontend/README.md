# DenuncIA — Frontend

Frontend Next.js (App Router) da plataforma GCCC de denúncias de corrupção.

Ver o [README principal do projeto](../README.md) para arquitetura completa, instruções de
instalação do backend/Ollama/PostgreSQL e o fluxo de ponta a ponta.

## Desenvolvimento local

```bash
npm install
cp .env.local.example .env.local   # ajustar NEXT_PUBLIC_API_URL se necessário
npm run dev
```

Aplicação em `http://localhost:3000`. Requer o backend a correr em `http://localhost:8000`
(por omissão).
