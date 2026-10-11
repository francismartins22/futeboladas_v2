# Futeboladas

App (PWA) para gerir peladas e equipas de futebol amador: agenda e confirmações, equipas equilibradas, quadro tático, resultados, MVP, liga com convocatórias, treinos, chat, tesouraria e notificações push.

React 19 + Vite, Firebase (Auth, Firestore, Storage, Cloud Functions, Cloud Messaging). Alojada no Vercel a partir do branch `main`.

## Correr localmente

```bash
npm install
npm run dev
```

| Script | O que faz |
|---|---|
| `npm run dev` | servidor de desenvolvimento (usa o projeto Firebase real) |
| `npm run build` | build de produção para `dist/` |
| `npm run lint` | ESLint do frontend |
| `npm test` | testes unitários (`src/**/*.test.js`, ex: estatísticas) |
| `npm run test:rules` | testa `firestore.rules` no emulador (precisa de **Java 21+**; usa um projeto `demo-`, nunca toca nos dados reais) |
| `cd functions && npm test` | testes das Cloud Functions (datas/fuso horário) |

## Estrutura

```
src/
  App.jsx            arranque e raiz
  firebase.js        config do Firebase, push, upload de fotos, joinGroup
  stats.js           estatísticas calculadas a partir dos jogos
  utils.js, styles.js
  components/        UI partilhada (Avatar, Toast, BottomNav, SubTabs, ...)
  screens/           AuthScreen, GroupSelector, GroupDashboard, UserProfile
  tabs/              um ficheiro por separador do grupo
functions/           Cloud Functions (notificações, lembrete 24h, entrar com código)
tests/               testes das regras do Firestore
firestore.rules      quem pode ler/escrever o quê
storage.rules        fotos de perfil
```

Os dados vivem em `artifacts/futeboladas-v3/` no Firestore (`users`, `groups/{id}/players|matches|messages|schedule|leagueGames|trainings|treasury`).

## Publicar

- **App:** push para `main` → o Vercel publica sozinho (os outros branches geram previews).
- **Firebase** (projeto `futeboladas-v2-dev`, ver `.firebaserc`):

```bash
npx firebase-tools login
npx firebase-tools deploy --only functions
npx firebase-tools deploy --only firestore:rules,storage
```

Ao mudar regras e app ao mesmo tempo, publica **primeiro a app** e só depois as regras (a app antiga pode não funcionar com regras novas). No Windows/PowerShell usa `npx.cmd` se o `npx` for bloqueado pela política de scripts.

## Permissões (resumo de `firestore.rules`)

- **Não-membros:** não veem nada. Entrar num grupo só com o código de convite (Cloud Function `joinGroup`).
- **Membros:** RSVP próprio, chat, votar MVP (48h), avaliar jogadores, inscrever-se como fixo, adicionar convidados.
- **Admins** (`group.admins` + dono): resultados, pagamentos, definições, liga, treinos, apagar jogos/jogadores.
- **Dono:** promover admins e apagar o grupo.
