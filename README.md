# FinStruct Wealth — Gestão Patrimonial Inteligente

FinStruct é uma plataforma de gestão financeira sofisticada, desenhada para investidores que procuram uma interface moderna e funcionalidades avançadas para o controlo de património, transações e metas financeiras.

## 🚀 Tecnologias

O projeto está dividido numa arquitetura de cliente-servidor:

- **Frontend**: Angular 17+ com TailwindCSS e Signals para gestão de estado.
- **Backend**: PHP 8.1+ (Pure PHP/OOP) com arquitetura Service-Repository.
- **Base de Dados**: MySQL / MariaDB.
- **Autenticação**: JWT (JSON Web Tokens).
- **E-mail**: PHPMailer para recuperação de senha e boas-vindas.

---

## 📁 Organização do Projeto

O repositório está estruturado da seguinte forma:

```text
Projecto2.2/
├── finance-api/            # Backend (API REST em PHP)
│   ├── bootstrap/          # Inicialização da aplicação
│   ├── config/             # Ficheiros de configuração (DB, etc)
│   ├── database/           # Scripts SQL de setup e migrações
│   ├── public/             # Ponto de entrada (index.php) e .htaccess
│   ├── src/                # Lógica de negócio
│   │   ├── Controllers/    # Manipuladores de rotas
│   │   ├── Models/         # Entidades de dados
│   │   ├── Services/       # Regras de negócio e casos de uso
│   │   ├── Repositories/   # Abstração de acesso à base de dados
│   │   ├── Helpers/        # Utilitários (JWT, Mailer, Logger)
│   │   └── Middleware/     # Filtros de requisição (Auth, CORS)
│   ├── storage/            # Logs e uploads (avatars)
│   └── vendor/             # Dependências Composer
│
├── finstruct-angular/      # Frontend (SPA em Angular)
│   ├── src/
│   │   ├── app/
│   │   │   ├── core/       # Serviços globais, guards, interceptors e modelos
│   │   │   ├── features/   # Módulos por funcionalidade (Dashboard, Transações, etc)
│   │   │   ├── layout/     # Componentes de estrutura (Sidebar, Shell)
│   │   │   └── shared/     # Componentes, pipes e diretivas partilhados
│   │   ├── assets/         # Imagens e recursos estáticos
│   │   └── environments/   # Configurações de API (Dev/Prod)
│   ├── tailwind.config.js  # Configuração de estilos
│   └── package.json        # Dependências NPM
└── README.md               # Este ficheiro
```

---

## 🛠️ Como Iniciar

### 1. Requisitos Prévios
- PHP 8.1 ou superior.
- MySQL/MariaDB.
- Node.js & NPM (para o Angular).
- Composer (gestor de pacotes PHP).

### 2. Configuração do Backend (API)
1. Navegue até a pasta `finance-api`.
2. Instale as dependências:
   ```bash
   composer install
   ```
3. Crie o ficheiro `.env` baseado no `.env.example` e configure as suas credenciais:
   - Base de dados (DB_HOST, DB_NAME, DB_USER, DB_PASS).
   - Servidor de E-mail (MAIL_HOST, MAIL_PORT, MAIL_USERNAME, MAIL_PASSWORD).
4. Importe o ficheiro `database/setup.sql` para o seu servidor MySQL para criar as tabelas e dados iniciais.
5. Inicie o servidor local:
   ```bash
   php -S localhost:8000 -t public
   ```

### 3. Configuração do Frontend (Angular)
1. Navegue até a pasta `finstruct-angular`.
2. Instale as dependências:
   ```bash
   npm install
   ```
3. Certifique-se que o ficheiro `src/environments/environment.ts` aponta para o URL correto da API (`http://localhost:8000/api`).
4. Inicie o projeto:
   ```bash
   npm start
   ```
5. Aceda no browser em: `http://localhost:4200`

---

## ✨ Funcionalidades Principais

- **Dashboard Holístico**: Resumo de saldo, evolução patrimonial (gráfico 6 meses) e distribuição por tipo de conta.
- **Mercado Crypto Live**: Cotações em tempo real via API externa (CoinGecko) com gráficos de performance.
- **Gestão de Transações**: Ledger completo com filtros por categoria, tipo (receita/despesa) e busca textual.
- **Sistema Multi-Idioma**: Suporte nativo para **Português, Inglês e Francês**, alterável instantaneamente no perfil.
- **Recuperação de Senha**: Fluxo seguro via e-mail com código de validação de 6 dígitos.
- **Personalização**: Suporte para Modo Escuro (Dark Mode) e Modo Claro.

---

## 🔒 Segurança
- Autenticação baseada em Tokens JWT com expiração configurável.
- Encriptação de senhas usando algoritmo BCrypt (cost 12).
- Proteção contra SQL Injection via prepared statements (PDO).
- Gestão de permissões por roles (Admin/User).

---
© 2026 FinStruct Intelligence. Todos os direitos reservados.
