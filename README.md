# DenuncIA

**Plataforma de Categorização e Encaminhamento de Denúncias de Corrupção com recurso a Modelos de Linguagem de Grande Escala (LLMs)**

Dev.: **Belarmino Simão, Jr.**

Protótipo desenvolvido no âmbito de um trabalho de monografia. Demonstra o fluxo completo de uma
denúncia de corrupção — da submissão pelo cidadão à validação e encaminhamento por um técnico do
GCCC (Gabinete Central de Combate à Corrupção) — com apoio de um LLM local (Qwen3:4B-Instruct via
Ollama) na categorização preliminar.

> ⚠️ **Protótipo académico.** Não deve ser utilizado em produção sem mecanismos adicionais de
> segurança, proteção de dados e validação jurídica.

---

## 1. Objetivo do sistema

Apoiar o GCCC na receção, categorização preliminar, validação e encaminhamento de denúncias de
corrupção, permitindo que qualquer cidadão denuncie — com ou sem identificação — sem precisar de
saber em que categoria legal o caso se enquadra. Um LLM local sugere categoria, prioridade e um
resumo a partir do relato; um técnico humano confirma ou corrige essa sugestão antes de qualquer
encaminhamento. **O LLM nunca decide**: é apenas um mecanismo de apoio à decisão.

## 2. Arquitetura

```text
CIDADÃO
   │  submete denúncia (com ou sem evidências)
   ▼
NEXT.JS (frontend público + área de gestão)
   │  REST / JSON, multipart para anexos
   ▼
FASTAPI (backend)
   │
   ├──────────────► PostgreSQL (denúncias, utilizadores, anexos, auditoria)
   │
   ▼
OLLAMA → QWEN3:4B-INSTRUCT (classificação preliminar, JSON estruturado)
   │
   ▼
PENDENTE_VALIDACAO
   │
   ▼
TÉCNICO GCCC (autenticado via JWT)
   ├── abre o processo (transita para EM_ANALISE)
   ├── valida / corrige categoria e prioridade
   ├── encaminha, rejeita ou arquiva
   ▼
GESTÃO DA DENÚNCIA + AUDITORIA
```

Duas áreas na aplicação:

- **Área pública** (`/`, `/denunciar`, `/consultar`, `/chat`): submissão de denúncias, consulta de
  protocolo, assistente informativo. Sem autenticação.
- **Área do GCCC** (`/admin/*`): dashboard, lista e validação de denúncias. Protegida por JWT.

## 3. Tecnologias

| Camada         | Tecnologia                                   |
| -------------- | --------------------------------------------- |
| Frontend       | Next.js 16 (App Router), TypeScript, Tailwind CSS v4, Recharts, Lucide Icons |
| Backend        | Python 3.11, FastAPI, SQLAlchemy 2, Pydantic v2 |
| Base de dados  | PostgreSQL (SQLite suportado para dev local sem Docker) |
| LLM local      | Qwen3:4B-Instruct                             |
| Servidor LLM   | Ollama                                        |
| Autenticação   | JWT (python-jose) + bcrypt (passlib)          |
| Contentorização| Docker / docker-compose                        |

## 4. Pré-requisitos

- Node.js 20+
- Python 3.11+
- Docker e Docker Compose (opcional, mas recomendado para o setup completo)
- [Ollama](https://ollama.com) instalado localmente (se não usar Docker para o Ollama)

## 5. Instalação

```bash
git clone <repositorio>
cd denuncIA
```

O projeto tem duas pastas principais: `backend/` (FastAPI) e `frontend/` (Next.js).

## 6. Configuração do `.env` (backend)

```bash
cd backend
cp .env.example .env
```

Variáveis principais:

| Variável | Descrição |
| --- | --- |
| `DATABASE_URL` | Connection string. Produção/Docker: `postgresql://gccc:gccc@postgres:5432/denuncia`. Dev local sem Postgres: `sqlite:///./dev.db` |
| `SECRET_KEY` | Segredo usado para assinar os JWT — **alterar em produção** |
| `LLM_MODE` | `mock` (respostas simuladas, não requer Ollama) ou `ollama` (usa o Qwen3:4B-Instruct real) |
| `OLLAMA_BASE_URL` | URL do servidor Ollama (`http://localhost:11434` local, `http://ollama:11434` em Docker) |
| `OLLAMA_MODEL` | Nome do modelo (`qwen3:4b-instruct`) |
| `UPLOAD_DIR` | Pasta local para guardar anexos |

O frontend usa `frontend/.env.local` (copiar de `.env.local.example`) com `NEXT_PUBLIC_API_URL`
apontando para o backend (`http://localhost:8000` por omissão).

## 7. Configuração do PostgreSQL

**Com Docker** (recomendado): o `docker-compose.yml` já sobe um serviço `postgres` com utilizador
`gccc`, password `gccc` e base de dados `denuncia`.

**Sem Docker**: instale o PostgreSQL localmente e crie a base de dados:

```sql
CREATE USER gccc WITH PASSWORD 'gccc';
CREATE DATABASE denuncia OWNER gccc;
```

e ajuste `DATABASE_URL` em `backend/.env` em conformidade.

**Sem PostgreSQL disponível** (ex.: apenas para testar o frontend/fluxo rapidamente): defina
`DATABASE_URL=sqlite:///./dev.db` — o SQLAlchemy trata o resto. Não recomendado para a entrega
final do protótipo, apenas para desenvolvimento.

## 8. Instalação do Ollama

```bash
# instalar a partir de https://ollama.com/download
ollama serve   # normalmente já corre como serviço após a instalação
```

## 9. Instalação do Qwen3:4B-Instruct

```bash
ollama pull qwen3:4b-instruct
```

Com Docker: `docker compose exec ollama ollama pull qwen3:4b-instruct`.

> O Qwen3 é um modelo "híbrido" com modo de raciocínio interno ("thinking"). O `llm_service.py`
> desativa esse modo (`"think": false`) nas chamadas ao Ollama — sem isso, cada classificação pode
> demorar mais de um minuto num CPU comum. Com o modo desativado, uma classificação típica demora
> entre 5 e 30 segundos, dependendo do hardware.

## 10. Como iniciar o backend

```bash
cd backend
python -m venv .venv
source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -r requirements.txt
python scripts/init_db.py     # cria as tabelas + utilizador técnico de demonstração
python scripts/seed_db.py     # popula denúncias fictícias para o dashboard
uvicorn app.main:app --reload --port 8000
```

API disponível em `http://localhost:8000` (documentação automática em `/docs`).

## 11. Como iniciar o frontend

```bash
cd frontend
npm install
cp .env.local.example .env.local
npm run dev
```

Aplicação disponível em `http://localhost:3000`.

## 12. Como executar as "migrations"

Por se tratar de um protótipo académico, as tabelas são criadas automaticamente através do
SQLAlchemy (`Base.metadata.create_all`), tanto no arranque da API (`app/main.py`) como no script
`scripts/init_db.py`. Não há um passo de migração manual a correr. Para um projeto em produção,
recomenda-se substituir esta abordagem por uma ferramenta de migrações versionadas (ex.: Alembic).

## 13. Como inserir dados de demonstração

```bash
cd backend
python scripts/seed_db.py
```

Cria 13 denúncias fictícias com categorias, prioridades e estados variados (para o dashboard,
filtros e fluxo de validação) — apenas se a base de dados ainda não tiver denúncias.

## 14. Credenciais de demonstração

```text
Email:    tecnico@gccc.gov.mz
Password: Admin123!
```

Criadas automaticamente por `scripts/init_db.py`. **Apenas para desenvolvimento/demonstração do
protótipo.**

## 15. Endpoints principais

| Método | Rota | Descrição |
| --- | --- | --- |
| POST | `/api/auth/login` | Autenticação de técnico, devolve JWT |
| POST | `/api/denuncias` | Submissão pública de denúncia (multipart, com anexos) |
| GET | `/api/denuncias/protocolo/{protocolo}` | Consulta pública do estado de uma denúncia |
| POST | `/api/chatbot` | Assistente informativo do denunciante |
| GET | `/api/admin/denuncias` | Lista de denúncias (filtros, pesquisa, paginação) — autenticado |
| GET | `/api/admin/denuncias/{id}` | Detalhe de uma denúncia — autenticado |
| PUT | `/api/admin/denuncias/{id}` | Atualiza classificação/observações sem mudar de estado |
| POST | `/api/admin/denuncias/{id}/validar` | Valida a denúncia (categoria + prioridade finais) |
| POST | `/api/admin/denuncias/{id}/encaminhar` | Aceita a denúncia validada no sistema de gestão do GCCC |
| POST | `/api/admin/denuncias/{id}/investigar` | Marca a denúncia encaminhada como em investigação ativa |
| POST | `/api/admin/denuncias/{id}/rejeitar` | Rejeita a denúncia |
| POST | `/api/admin/denuncias/{id}/arquivar` | Arquiva a denúncia (conclui o processo) |
| GET | `/api/admin/denuncias/{id}/anexos/{anexo_id}` | Download de um anexo — autenticado |
| GET | `/api/admin/dashboard/stats` \| `/categories` \| `/status` \| `/priority` \| `/monthly` | Indicadores do dashboard |
| GET | `/api/admin/auditoria` \| `/api/admin/auditoria/export` | Registo global de auditoria, com filtros, e exportação CSV |
| GET/POST | `/api/admin/utilizadores` | Lista e criação de contas de técnicos |

Documentação interativa completa (OpenAPI/Swagger) em `http://localhost:8000/docs`.

## 16. Fluxo da denúncia

1. Cidadão preenche o formulário em 4 etapas (`/denunciar`): Ocorrência → Descrição → Evidências → Revisão.
2. Ao submeter, o backend cria o registo (`RECEBIDA`), gera um protocolo único (`GCCC-AAAA-NNNNNN`)
   e envia a descrição ao LLM.
3. O LLM devolve categoria, confiança, prioridade, resumo, justificação e indicadores — guardados
   separadamente da validação humana. Estado passa a `PENDENTE_VALIDACAO`.
4. O cidadão recebe o protocolo e pode acompanhar o estado em `/consultar`.
5. Um técnico autentica-se em `/admin/login` e abre a denúncia (`/admin/denuncias/{id}`) — o estado
   transita automaticamente para `EM_ANALISE`.
6. O técnico confirma ou corrige a categoria/prioridade sugeridas, regista observações e **valida**
   a denúncia (`VALIDADA`).
7. O técnico **encaminha** a denúncia — isto é, aceita-a formalmente no sistema de gestão do GCCC
   para tratamento (`ENCAMINHADA`). Não se trata de um reenvio a uma entidade externa: essa
   aceitação é o que o título do projeto designa por "encaminhamento".
8. A partir daí, o técnico pode marcar a denúncia como **em investigação** (`EM_INVESTIGACAO`) e,
   por fim, **arquivá-la** para concluir o processo (`ARQUIVADA`), ou **rejeitá-la** em qualquer
   ponto anterior ao arquivamento (`REJEITADA`).
9. Cada transição fica registada em `audit_logs`, visível no histórico da denúncia e (de forma
   filtrada, sem dados internos) na consulta pública por protocolo — que também resume o estado em
   três categorias simples para o cidadão: **em tratamento**, **sob investigação** ou **finalizada**.

## 17. Arquitetura do LLM

- `backend/app/services/llm_service.py`: classificação preliminar da denúncia. Prompt de sistema
  define papel, categorias possíveis e formato JSON de saída; o texto do denunciante é delimitado
  por `<DENUNCIA>...</DENUNCIA>` e tratado sempre como dado, nunca como instrução — incluindo
  instruções explícitas ao modelo para ignorar qualquer tentativa de "prompt injection" dentro
  desse texto. A resposta é validada (`app/schemas/llm.py`) e, se inválida ou o Ollama estiver
  indisponível, a denúncia segue para validação manual sem bloquear o fluxo (`llm_erro` fica
  registado).
- `backend/app/services/chatbot_service.py`: assistente **conversacional** do denunciante — não é
  um FAQ estático nem está limitado a perguntas predefinidas. O prompt de sistema convida o modelo
  a dialogar livremente sobre a situação do cidadão (ajudar a perceber se algo é corrupção, que
  informação reunir, exemplos), mantendo sempre as mesmas regras estritas (não investiga, não
  acusa, não presta aconselhamento jurídico definitivo, não garante resultados). A conversa é
  acessível diretamente na página inicial (secção "Fale com o assistente", embutida na página, não
  apenas um link) e, a partir de qualquer página pública, através de um widget flutuante — ambos
  partilham o mesmo estado de conversa.
- Ambos os serviços suportam `LLM_MODE=mock` (heurísticas simples por palavras-chave, sem depender
  do Ollama — útil para desenvolver o frontend) e `LLM_MODE=ollama` (chamada real ao
  Qwen3:4B-Instruct via `POST /api/chat` do Ollama, com `"think": false` para respostas rápidas e
  `"format": "json"` na classificação). O chatbot usa `"num_predict": 300` e temperatura 0.6 para
  equilibrar profundidade da conversa com latência num Qwen3 a correr em CPU; ajuste
  `OLLAMA_TIMEOUT_SECONDS` (120s por omissão) se o hardware for mais lento.
- A categoria e prioridade sugeridas pelo LLM (`categoria_llm`, `prioridade_llm`, ...) são sempre
  guardadas separadamente da validação humana (`categoria_validada`, `prioridade_validada`, ...) —
  nunca são fundidas ou promovidas automaticamente ao estado "validado".

## 18. Limitações do protótipo

- Sem migrações versionadas (Alembic) — tabelas criadas via `create_all`.
- Uploads guardados em disco local, sem antivírus nem verificação de conteúdo além de
  extensão/MIME/tamanho.
- Existem quatro perfis de utilizador (`ADMIN`, `COORDENADOR`, `TECNICO`, `CONSULTA`) e a página
  "Utilizadores" documenta as permissões pretendidas por perfil, mas essa tabela é informativa: o
  protótipo não aplica restrições de autorização por perfil — qualquer conta autenticada pode
  validar, encaminhar, investigar ou arquivar qualquer denúncia.
- Classificação do LLM não é determinística nem infalível — é sempre apresentada como sugestão não
  vinculativa, sujeita a validação humana.
- Sem envio de notificações (email/SMS) ao denunciante sobre mudanças de estado.
- Sem testes automatizados de interface (apenas verificação manual e testes de fluxo do backend).
- CORS, secrets e configuração de produção exigem revisão antes de qualquer utilização real.

## 19. Docker

```bash
docker compose up --build
docker compose exec ollama ollama pull qwen3:4b-instruct   # apenas na primeira vez
```

Serviços: `frontend` (porta 3000), `backend` (porta 8000), `postgres` (porta 5432), `ollama`
(porta 11434). Por omissão o backend arranca com `LLM_MODE=mock`; defina `LLM_MODE=ollama` no
ambiente antes de subir os contentores para usar o Qwen3 real.

## 20. Estrutura do repositório

```text
denuncIA/
├── backend/            # API FastAPI
│   ├── app/
│   │   ├── models/     # SQLAlchemy (User, Denuncia, Attachment, AuditLog)
│   │   ├── schemas/    # Pydantic (validação de entrada/saída, incl. schema do LLM)
│   │   ├── routers/    # auth, denuncias (público), admin_denuncias, dashboard, chatbot
│   │   ├── services/   # llm_service, chatbot_service, denuncia_service, audit_service
│   │   └── utils/      # segurança (JWT/bcrypt), validação de uploads, protocolo
│   └── scripts/        # init_db.py, seed_db.py
├── frontend/           # Next.js (App Router)
│   └── src/
│       ├── app/        # páginas públicas + /admin (protegido por layout com AuthGuard)
│       ├── components/ # SiteHeader/Footer, wizard de denúncia, chatbot, UI
│       └── lib/        # cliente API, auth (localStorage), tipos, formatação
└── docker-compose.yml
```
