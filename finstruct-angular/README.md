# FinStruct Angular — Frontend

## Estrutura de Pastas

```
src/app/
├── core/
│   ├── guards/         auth.guard.ts
│   ├── interceptors/   auth.interceptor.ts  (JWT automático)
│   ├── services/       auth.service.ts, api.service.ts, theme.service.ts
│   └── models.ts       (todas as interfaces TypeScript)
├── features/
│   ├── auth/           login, register, forgot-password, reset-password
│   ├── dashboard/      dashboard com gráfico SVG dinâmico
│   ├── transactions/   extrato completo com drawer lateral
│   ├── accounts/       gestão de contas com modal
│   ├── budgets/        orçamentos com alertas e barras de progresso
│   ├── goals/          metas com depósito e progress bar
│   ├── reports/        relatórios analíticos + exportação CSV
│   └── settings/       perfil, senha, avatar, tema
├── layout/             shell.component.ts (sidebar + topbar)
└── shared/pipes/       money.pipe.ts (formatação de moeda)
```

## Instalação

```bash
# 1. Instalar dependências
npm install

# 2. Configurar environment.ts
# src/environments/environment.ts → apiUrl: 'http://localhost:8000/api'

# 3. Iniciar o servidor Angular
ng serve

# Acede em: http://localhost:4200
```

## Funcionalidades

- ✅ Dark mode (preto #000 + amarelo âmbar) / Light mode (branco + azul)
- ✅ Login, Registo, Forgot Password, Reset Password
- ✅ JWT automático em todos os pedidos via interceptor
- ✅ Dashboard com gráfico SVG dinâmico (dados reais da API)
- ✅ Transações com filtros, paginação e drawer lateral
- ✅ Contas com CRUD completo
- ✅ Orçamentos com alertas automáticos a 85% e 100%
- ✅ Metas com depósito e progresso
- ✅ Relatórios com exportação CSV
- ✅ Configurações: perfil, senha, avatar upload, tema, moeda
- ✅ Responsivo (mobile-first)
- ✅ Lazy loading de todas as rotas
- ✅ Guards para rotas protegidas e de convidado
