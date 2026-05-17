# FinancePro — Frontend Angular

Sistema de Gestão Financeira Pessoal — Frontend em Angular 18 moderno.

---

## 🚀 Início Rápido

```bash
# 1. Instalar dependências
npm install

# 2. Configurar variáveis (editar se necessário)
# src/app/core/constants/api.constants.ts
# API_BASE = 'http://localhost:8000/api'  ← URL do seu backend PHP

# 3. Iniciar servidor de desenvolvimento
npm start
# Aceder em: http://localhost:4200
```

---

## 📁 Estrutura do Projeto

```
src/app/
├── core/
│   ├── constants/        # API_BASE, STORAGE_KEYS
│   ├── guards/           # authGuard, guestGuard, roleGuard
│   ├── interceptors/     # JWT auth, error handling, loading
│   ├── models/           # TypeScript interfaces completas
│   └── services/         # AuthService, ToastService, ThemeService…
│
├── layouts/
│   ├── auth-layout/      # Shell para login/register (split screen)
│   └── main-layout/      # Shell com sidebar + topbar + toast
│
├── auth/
│   ├── login/            # Login com validação
│   ├── register/         # Registo com força de senha
│   ├── forgot-password/  # Pedido de recuperação
│   └── reset-password/   # Redefinição com token
│
├── dashboard/            # KPIs, gráficos, evolução, contas
├── transactions/         # CRUD + filtros + paginação + export CSV
├── accounts/             # CRUD com cards por tipo
├── categories/           # CRUD com picker de ícone e cor
├── budget/               # Orçamentos com progress bars
├── goals/                # Metas com anel SVG radial
├── reports/              # Relatórios com export PDF/CSV
│
└── settings/
    ├── profile/          # Editar perfil + avatar upload
    ├── preferences/      # Tema, idioma, moeda, notificações
    └── security/         # Alterar senha + sessões ativas
```

---

## ✅ Funcionalidades Implementadas

| Módulo | Funcionalidades |
|--------|----------------|
| **Auth** | Login, Registo, Forgot/Reset Password, JWT refresh automático |
| **Dashboard** | KPIs em tempo real, gráfico de barras, breakdown de categorias, últimas transações |
| **Transações** | CRUD completo, filtros multi-campo, paginação, export CSV |
| **Contas** | Cards por tipo com saldo, saldo total consolidado |
| **Categorias** | Ícone e cor personalizados, separação por tipo |
| **Orçamento** | Progress bars, alertas de excesso, resumo global |
| **Metas** | Anel radial SVG, contribuições, prazo com contagem |
| **Relatórios** | Evolução 12 meses, top categorias, tabela comparativa, PDF/CSV |
| **Configurações** | Perfil, avatar, tema dark/light, idioma PT/EN/ES/FR, segurança |
| **UX** | Skeleton loading, toast notifications, sidebar colapsável, dark mode, responsive |

---

## 🔌 Integração com o Backend PHP

O frontend consome a API REST conforme definido em:
```
src/app/core/constants/api.constants.ts
```

### Headers enviados automaticamente (interceptor):
```
Authorization: Bearer <access_token>
Content-Type: application/json
```

### Refresh automático do token:
O `AuthInterceptor` interceta erros 401 e tenta renovar o token automaticamente via `/api/auth/refresh`. Se falhar, faz logout.

---

## 🌙 Dark / Light Mode

Controlado via `ThemeService`. Persiste em `localStorage`. Aplica a classe `data-theme="dark"` no `<html>`.

---

## 🌍 Internacionalização

Ficheiros de tradução em:
```
src/assets/i18n/pt.json   ← Português (padrão)
src/assets/i18n/en.json   ← English
```

Mudar idioma em **Configurações → Preferências**.

---

## 📦 Build para Produção

```bash
npm run build
# Output em: dist/financial-app/
```

---

## 🛠️ Tecnologias

- **Angular 18** — Standalone components, Signals, `@if`/`@for` syntax
- **RxJS** — Observables para chamadas HTTP
- **CSS Custom Properties** — Design system completo sem framework CSS externo
- **ngx-translate** — Internacionalização
- **date-fns** — Manipulação de datas
- **Angular Service Worker** — PWA support

---

## 🔐 Fluxo de Autenticação

```
Login → POST /api/auth/login
     ← { access_token, refresh_token, user }
     → Guardados em localStorage
     → Todas as requests incluem Authorization: Bearer <token>
     → 401 → tenta refresh → sucesso: retry | falha: logout
```
