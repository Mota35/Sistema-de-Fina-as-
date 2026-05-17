# Finance Manager API — Documentação Completa

**Base URL:** `http://localhost:8000`  
**Version:** 1.0.0  
**Auth:** Bearer JWT Token  

---

## 📁 Estrutura de Pastas

```
finance-api/
├── bootstrap/
│   └── app.php              ← Autoloader + env loader + error handler
├── config/
│   └── database.php         ← Configurações PDO
├── database/
│   └── setup.sql            ← Migrations + Seeds + Trigger
├── public/
│   ├── index.php            ← Entry point
│   └── .htaccess
├── routes/
│   └── api.php              ← Todas as rotas registadas
├── src/
│   ├── Config/
│   │   └── Database.php     ← Singleton PDO
│   ├── Controllers/
│   │   ├── BaseController.php
│   │   ├── AuthController.php
│   │   ├── AccountController.php
│   │   ├── CategoryController.php
│   │   ├── TransactionController.php
│   │   ├── GoalController.php
│   │   ├── UserController.php
│   │   ├── DashboardController.php
│   │   └── FinanceController.php
│   ├── Exceptions/
│   │   └── AppException.php ← UnauthorizedException, ForbiddenException, etc.
│   ├── Helpers/
│   │   ├── functions.php    ← jsonResponse, sanitize, env, etc.
│   │   ├── JWT.php          ← JWT nativo (sem dependências)
│   │   ├── FileUpload.php   ← Upload seguro de avatars
│   │   ├── Logger.php       ← File logger por dia
│   │   └── Mailer.php       ← Envio de emails
│   ├── Middleware/
│   │   ├── AuthMiddleware.php  ← JWT decode + role check
│   │   └── CorsMiddleware.php  ← CORS headers
│   ├── Repositories/
│   │   ├── BaseRepository.php
│   │   ├── UserRepository.php
│   │   ├── AccountRepository.php
│   │   ├── CategoryRepository.php
│   │   ├── TransactionRepository.php
│   │   └── GoalRepository.php
│   ├── Services/
│   │   ├── AuthService.php
│   │   ├── AccountService.php
│   │   ├── CategoryService.php
│   │   ├── TransactionService.php
│   │   ├── GoalService.php
│   │   ├── UserService.php
│   │   ├── DashboardService.php
│   │   └── ExternalApiService.php  ← ExchangeRate-API + FMP + Forecast
│   ├── Validators/
│   │   └── Validator.php
│   └── Router.php
├── storage/
│   ├── logs/                ← Logs diários (YYYY-MM-DD.log)
│   └── uploads/avatars/     ← Avatars carregados
├── .env                     ← Variáveis de ambiente
└── nginx.conf
```

---

## 🔐 Autenticação

Todos os endpoints protegidos requerem:
```
Authorization: Bearer <access_token>
```

---

## 📌 Formato Padrão de Resposta

### Sucesso
```json
{
  "success": true,
  "message": "OK",
  "code": 200,
  "data": { ... }
}
```

### Paginada
```json
{
  "success": true,
  "message": "OK",
  "code": 200,
  "data": [ ... ],
  "meta": {
    "total": 100,
    "per_page": 15,
    "current_page": 1,
    "last_page": 7,
    "from": 1,
    "to": 15
  }
}
```

### Erro
```json
{
  "success": false,
  "message": "Mensagem de erro",
  "code": 400,
  "data": null
}
```

### Validação (422)
```json
{
  "success": false,
  "message": "Validation failed.",
  "code": 422,
  "errors": {
    "email": ["O campo 'email' deve ser um email válido."],
    "password": ["O campo 'password' deve ter pelo menos 8 caracteres."]
  },
  "data": null
}
```

---

## 🩺 Health Check

### `GET /api/health`
```json
{
  "success": true,
  "data": {
    "status": "ok",
    "version": "1.0.0",
    "time": "2024-05-10 12:00:00"
  }
}
```

---

## 🔑 AUTH

### `POST /api/auth/register`
**Body:**
```json
{
  "name": "João Silva",
  "email": "joao@email.com",
  "password": "MinhaS3nha!",
  "password_confirmation": "MinhaS3nha!",
  "language": "pt",
  "currency": "AOA"
}
```
**Response 201:**
```json
{
  "success": true,
  "data": {
    "access_token": "eyJ0eXAiOiJKV1...",
    "refresh_token": "eyJ0eXAiOiJKV1...",
    "token_type": "Bearer",
    "expires_in": 86400,
    "user": {
      "id": 2,
      "name": "João Silva",
      "email": "joao@email.com",
      "role_name": "user",
      "language": "pt",
      "theme": "light",
      "currency": "AOA",
      "status": "active",
      "avatar": null,
      "created_at": "2024-05-10 12:00:00"
    }
  }
}
```

### `POST /api/auth/login`
```json
{ "email": "joao@email.com", "password": "MinhaS3nha!" }
```

### `POST /api/auth/logout`
*(sem body — cliente descarta os tokens)*

### `POST /api/auth/refresh`
```json
{ "refresh_token": "eyJ0eXAiOiJKV1..." }
```

### `POST /api/auth/forgot-password`
```json
{ "email": "joao@email.com" }
```

### `POST /api/auth/reset-password`
```json
{
  "token": "abc123...",
  "password": "NovaSenha!",
  "password_confirmation": "NovaSenha!"
}
```

### `POST /api/auth/change-password` 🔒
```json
{
  "current_password": "Atual!",
  "password": "Nova!123",
  "password_confirmation": "Nova!123"
}
```

### `GET /api/auth/me` 🔒

---

## 👤 PERFIL

### `GET /api/profile` 🔒
### `PUT /api/profile` 🔒
```json
{
  "name": "João Atualizado",
  "language": "en",
  "theme": "dark",
  "currency": "USD"
}
```

### `POST /api/profile/avatar` 🔒
`Content-Type: multipart/form-data`  
Campo: `avatar` (jpg/png/gif/webp, máx 5MB)

---

## 📊 DASHBOARD

### `GET /api/dashboard` 🔒
```json
{
  "data": {
    "total_balance": 125000.00,
    "current_month": {
      "year": 2024, "month": 5,
      "income": 80000.00,
      "expense": 45000.00,
      "balance": 35000.00
    },
    "last_month": { ... },
    "comparison": {
      "income_change_pct": 12.5,
      "expense_change_pct": -3.2,
      "income_trend": "up",
      "expense_trend": "down"
    },
    "recent_transactions": [ ... ],
    "goals": [ ... ],
    "balance_by_type": [
      { "type": "bank", "total": 100000.00 },
      { "type": "wallet", "total": 25000.00 }
    ],
    "evolution": [
      { "month": "2024-04", "income": 70000, "expense": 48000, "balance": 22000 },
      { "month": "2024-05", "income": 80000, "expense": 45000, "balance": 35000 }
    ]
  }
}
```

### `GET /api/dashboard/forecast?months=3` 🔒
```json
{
  "data": {
    "forecast": [
      { "month": "2024-06", "projected_income": 82000, "projected_expense": 44000, "projected_balance": 38000, "trend_income": "up", "trend_expense": "down" }
    ],
    "avg_income": 78000,
    "avg_expense": 46500,
    "avg_balance": 31500
  }
}
```

---

## 🏦 ACCOUNTS

### `GET /api/accounts?page=1&per_page=15` 🔒
### `GET /api/accounts/summary` 🔒
```json
{
  "data": {
    "total_balance": 125000.00,
    "balance_by_type": [
      { "type": "bank", "total": 100000.00 }
    ]
  }
}
```

### `GET /api/accounts/{id}` 🔒
### `POST /api/accounts` 🔒
```json
{
  "name": "Conta BFA",
  "type": "bank",
  "balance": 50000.00
}
```
*Tipos válidos:* `wallet`, `bank`, `savings`, `credit_card`, `investment`

### `PUT /api/accounts/{id}` 🔒
### `DELETE /api/accounts/{id}` 🔒

---

## 🏷️ CATEGORIES

### `GET /api/categories?type=expense` 🔒
Retorna categorias globais + as do utilizador

### `POST /api/categories` 🔒
```json
{
  "name": "Combustível",
  "type": "expense",
  "color": "#f97316",
  "icon": "fuel"
}
```
### `PUT /api/categories/{id}` 🔒
### `DELETE /api/categories/{id}` 🔒
*(só categorias próprias)*

---

## 💸 TRANSACTIONS

### `GET /api/transactions` 🔒
**Query params:**
- `page`, `per_page`
- `account_id`, `category_id`
- `type` → `income` | `expense`
- `date_from`, `date_to` → `YYYY-MM-DD`
- `search` → pesquisa na descrição

### `GET /api/transactions/summary?year=2024&month=5` 🔒
### `GET /api/transactions/by-category?type=expense&date_from=2024-01-01&date_to=2024-05-31` 🔒
### `GET /api/transactions/evolution?months=12` 🔒

### `POST /api/transactions` 🔒
```json
{
  "account_id": 1,
  "category_id": 6,
  "type": "expense",
  "amount": 5000.00,
  "description": "Supermercado Continente",
  "transaction_date": "2024-05-10",
  "recurring": false
}
```
> ⚠️ O saldo da conta é atualizado automaticamente pelo trigger MySQL.

### `PUT /api/transactions/{id}` 🔒
### `DELETE /api/transactions/{id}` 🔒

---

## 🎯 GOALS

### `GET /api/goals` 🔒
```json
{
  "data": [
    {
      "id": 1,
      "title": "Fundo de Emergência",
      "target_amount": 500000.00,
      "current_amount": 125000.00,
      "progress_pct": 25.00,
      "deadline": "2024-12-31"
    }
  ]
}
```

### `POST /api/goals` 🔒
```json
{
  "title": "Fundo de Emergência",
  "target_amount": 500000.00,
  "current_amount": 0,
  "deadline": "2024-12-31"
}
```

### `POST /api/goals/{id}/deposit` 🔒
```json
{ "amount": 25000.00 }
```

### `PUT /api/goals/{id}` 🔒
### `DELETE /api/goals/{id}` 🔒

---

## 💱 EXCHANGE RATES

### `GET /api/exchange/rates?base=AOA` 🔒
```json
{
  "data": {
    "base": "AOA",
    "date": "2024-05-10 12:00:00",
    "rates": { "USD": 0.0011, "EUR": 0.0010, "GBP": 0.00087 }
  }
}
```

### `GET /api/exchange/convert?from=USD&to=AOA&amount=100` 🔒
```json
{
  "data": {
    "from": "USD",
    "to": "AOA",
    "amount": 100,
    "rate": 900.45,
    "converted": 90045.00,
    "formatted": "90.045,00 AOA"
  }
}
```

---

## 📈 FINANCE MARKET

### `GET /api/finance/quotes?symbols=AAPL,MSFT` 🔒
### `GET /api/finance/market` 🔒
### `GET /api/finance/crypto?symbols=BTC,ETH` 🔒

---

## 👑 ADMIN

### `GET /api/admin/users?page=1&search=joao` 🔒🔴
### `GET /api/admin/users/{id}` 🔒🔴
### `PATCH /api/admin/users/{id}` 🔒🔴
```json
{ "status": "blocked" }
```
### `DELETE /api/admin/users/{id}` 🔒🔴

---

## ⚙️ Setup Rápido

```bash
# 1. Clone e configure
cp .env.example .env
# Edite .env com as credenciais da BD e chaves API

# 2. Configure a base de dados
mysql -u root -p < database/setup.sql

# 3. Inicie o servidor de desenvolvimento
php -S localhost:8000 -t public

# 4. Teste
curl http://localhost:8000/api/health
```

## 🔑 Variáveis de Ambiente Principais

| Variável | Descrição |
|---|---|
| `JWT_SECRET` | Chave secreta JWT (mín. 32 chars) |
| `EXCHANGE_RATE_API_KEY` | Chave da ExchangeRate-API (exchangerate-api.com) |
| `FMP_API_KEY` | Chave da Financial Modeling Prep |
| `DB_*` | Credenciais MySQL |
| `MAIL_*` | Configurações SMTP |

## 🛡️ Segurança Implementada

- ✅ JWT stateless com expiração configurável
- ✅ Passwords com `bcrypt` (cost 12)
- ✅ Prepared statements PDO (anti SQL Injection)
- ✅ `htmlspecialchars` + `strip_tags` em todos os inputs (anti XSS)
- ✅ Validação rigorosa de MIME types em uploads
- ✅ Rate limiting via cache de respostas externas
- ✅ CORS configurável por domínio
- ✅ Security headers (X-Frame-Options, XSS-Protection, etc.)
- ✅ Logs de todas as requests e erros
- ✅ Isolamento de dados por `user_id` em todas as queries
- ✅ Sistema de roles (admin/user)
