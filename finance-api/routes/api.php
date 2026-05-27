<?php

use App\Router;
use App\Controllers\AuthController;
use App\Controllers\AccountController;
use App\Controllers\CategoryController;
use App\Controllers\TransactionController;
use App\Controllers\GoalController;
use App\Controllers\UserController;
use App\Controllers\DashboardController;
use App\Controllers\FinanceController;
use App\Controllers\BudgetController;
use App\Controllers\TransferController;

$router = new Router();

// ─────────────────────────────────────────────────────────────────────────────
// Health check
// ─────────────────────────────────────────────────────────────────────────────
$router->get('/api/health', function () {
    jsonResponse([
        'status'   => 'ok',
        'version'  => env('APP_VERSION', '1.0.0'),
        'time'     => now(),
        'php'      => PHP_VERSION,
        'curl'     => function_exists('curl_init') ? 'available' : 'NOT AVAILABLE',
        'pdo_mysql'=> in_array('mysql', PDO::getAvailableDrivers()) ? 'available' : 'NOT AVAILABLE',
    ]);
});

// Limpar cache das APIs externas
$router->get('/api/debug/clear-cache', function () {
    if (env('APP_ENV') !== 'development') {
        errorResponse('Not available in production.', 403);
    }
    $svc     = new \App\Services\ExternalApiService();
    $deleted = $svc->clearCache();
    jsonResponse(['deleted_files' => $deleted, 'message' => "Cache limpo: $deleted ficheiros removidos."]);
});
$router->get('/api/debug/external', function () {
    if (env('APP_ENV') !== 'development') {
        errorResponse('Not available in production.', 403);
    }

    $fmpKey      = env('FMP_API_KEY', '');
    $exchangeKey = env('EXCHANGE_RATE_API_KEY', '');

    $results = [
        'env' => [
            'FMP_API_KEY'           => $fmpKey      ? substr($fmpKey, 0, 6) . '...' : '❌ NOT SET',
            'EXCHANGE_RATE_API_KEY' => $exchangeKey ? substr($exchangeKey, 0, 6) . '...' : '❌ NOT SET',
        ],
        'curl_available' => function_exists('curl_init'),
        'tests' => [],
    ];

    // Test ExchangeRate
    if ($exchangeKey && function_exists('curl_init')) {
        $url = "https://v6.exchangerate-api.com/v6/{$exchangeKey}/latest/USD";
        $ch  = curl_init();
        curl_setopt_array($ch, [
            CURLOPT_URL => $url, CURLOPT_RETURNTRANSFER => true,
            CURLOPT_TIMEOUT => 10, CURLOPT_SSL_VERIFYPEER => true,
        ]);
        $resp = curl_exec($ch);
        $code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $err  = curl_error($ch);
        curl_close($ch);
        $data = json_decode($resp, true);
        $results['tests']['exchange_rate'] = [
            'http_code' => $code,
            'curl_error'=> $err ?: null,
            'result'    => $data['result'] ?? 'unknown',
            'status'    => ($data['result'] ?? '') === 'success' ? '✅ OK' : '❌ FAILED',
        ];
    }

    // Test FMP
    if ($fmpKey && function_exists('curl_init')) {
        $url = "https://financialmodelingprep.com/api/v3/quote/AAPL?apikey={$fmpKey}";
        $ch  = curl_init();
        curl_setopt_array($ch, [
            CURLOPT_URL => $url, CURLOPT_RETURNTRANSFER => true,
            CURLOPT_TIMEOUT => 10, CURLOPT_SSL_VERIFYPEER => true,
        ]);
        $resp = curl_exec($ch);
        $code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $err  = curl_error($ch);
        curl_close($ch);
        $data = json_decode($resp, true);
        $results['tests']['fmp'] = [
            'http_code'  => $code,
            'curl_error' => $err ?: null,
            'got_data'   => is_array($data) && !empty($data),
            'raw_preview'=> substr($resp ?? '', 0, 200),
            'status'     => (is_array($data) && !empty($data) && isset($data[0]['price'])) ? '✅ OK' : '❌ FAILED',
        ];
    }

    jsonResponse($results);
});

// ─────────────────────────────────────────────────────────────────────────────
// AUTH  (public)
// POST   /api/auth/register
// POST   /api/auth/login
// POST   /api/auth/logout
// POST   /api/auth/refresh
// POST   /api/auth/forgot-password
// POST   /api/auth/reset-password
// POST   /api/auth/change-password   ← protected
// GET    /api/auth/me                ← protected
// ─────────────────────────────────────────────────────────────────────────────
$router->post('/api/auth/register',        [AuthController::class, 'register']);
$router->post('/api/auth/login',           [AuthController::class, 'login']);
$router->post('/api/auth/logout',          [AuthController::class, 'logout']);
$router->post('/api/auth/refresh',         [AuthController::class, 'refresh']);
$router->post('/api/auth/forgot-password', [AuthController::class, 'forgotPassword']);
$router->post('/api/auth/reset-password',  [AuthController::class, 'resetPassword']);
$router->post('/api/auth/change-password', [AuthController::class, 'changePassword']);
$router->get( '/api/auth/me',              [AuthController::class, 'me']);

// ─────────────────────────────────────────────────────────────────────────────
// PROFILE  (protected)
// GET    /api/profile
// PUT    /api/profile
// POST   /api/profile/avatar
// ─────────────────────────────────────────────────────────────────────────────
$router->get( '/api/profile',        [UserController::class, 'profile']);
$router->put( '/api/profile',        [UserController::class, 'updateProfile']);
$router->post('/api/profile/avatar', [UserController::class, 'uploadAvatar']);

// ─────────────────────────────────────────────────────────────────────────────
// DASHBOARD  (protected)
// GET    /api/dashboard
// GET    /api/dashboard/summary       ← alias mensal para o Angular
// GET    /api/dashboard/by-category   ← despesas/receitas por categoria
// GET    /api/dashboard/evolution     ← evolução mensal
// GET    /api/dashboard/forecast
// ─────────────────────────────────────────────────────────────────────────────
$router->get('/api/dashboard/summary',     [DashboardController::class, 'summary']);
$router->get('/api/dashboard/by-category', [DashboardController::class, 'byCategory']);
$router->get('/api/dashboard/evolution',   [DashboardController::class, 'evolution']);
$router->get('/api/dashboard/forecast',    [DashboardController::class, 'forecast']);
$router->get('/api/dashboard',             [DashboardController::class, 'index']);

// ─────────────────────────────────────────────────────────────────────────────
// ACCOUNTS  (protected)
// GET    /api/accounts
// GET    /api/accounts/summary
// GET    /api/accounts/{id}
// POST   /api/accounts
// PUT    /api/accounts/{id}
// DELETE /api/accounts/{id}
// ─────────────────────────────────────────────────────────────────────────────
$router->get(   '/api/accounts/summary', [AccountController::class, 'summary']);
$router->get(   '/api/accounts',         [AccountController::class, 'index']);
$router->get(   '/api/accounts/{id}',    [AccountController::class, 'show']);
$router->post(  '/api/accounts',         [AccountController::class, 'store']);
$router->put(   '/api/accounts/{id}',         [AccountController::class, 'update']);
$router->patch( '/api/accounts/{id}/default', [AccountController::class, 'setDefaultReceiving']);
$router->delete('/api/accounts/{id}',         [AccountController::class, 'destroy']);
$router->get(   '/api/accounts/{id}/history', [TransferController::class, 'history']);

// ─────────────────────────────────────────────────────────────────────────────
// TRANSFERS  (protected)
// POST   /api/transfers
// ─────────────────────────────────────────────────────────────────────────────
$router->post('/api/transfers', [TransferController::class, 'store']);

// ─────────────────────────────────────────────────────────────────────────────
// CATEGORIES  (protected)
// GET    /api/categories?type=income|expense
// GET    /api/categories/{id}
// POST   /api/categories
// PUT    /api/categories/{id}
// DELETE /api/categories/{id}
// ─────────────────────────────────────────────────────────────────────────────
$router->get(   '/api/categories',      [CategoryController::class, 'index']);
$router->get(   '/api/categories/{id}', [CategoryController::class, 'show']);
$router->post(  '/api/categories',      [CategoryController::class, 'store']);
$router->put(   '/api/categories/{id}', [CategoryController::class, 'update']);
$router->delete('/api/categories/{id}', [CategoryController::class, 'destroy']);

// ─────────────────────────────────────────────────────────────────────────────
// TRANSACTIONS  (protected)
// GET    /api/transactions
// GET    /api/transactions/summary
// GET    /api/transactions/by-category
// GET    /api/transactions/evolution
// GET    /api/transactions/{id}
// POST   /api/transactions
// PUT    /api/transactions/{id}
// DELETE /api/transactions/{id}
// ─────────────────────────────────────────────────────────────────────────────
$router->get(   '/api/transactions/summary',     [TransactionController::class, 'summary']);
$router->get(   '/api/transactions/by-category', [TransactionController::class, 'byCategory']);
$router->get(   '/api/transactions/evolution',   [TransactionController::class, 'evolution']);
$router->get(   '/api/transactions',             [TransactionController::class, 'index']);
$router->get(   '/api/transactions/{id}',        [TransactionController::class, 'show']);
$router->post(  '/api/transactions',             [TransactionController::class, 'store']);
$router->put(   '/api/transactions/{id}',        [TransactionController::class, 'update']);
$router->delete('/api/transactions/{id}',        [TransactionController::class, 'destroy']);

// ─────────────────────────────────────────────────────────────────────────────
// GOALS  (protected)
// GET    /api/goals
// GET    /api/goals/{id}
// POST   /api/goals
// PUT    /api/goals/{id}
// POST   /api/goals/{id}/deposit
// DELETE /api/goals/{id}
// ─────────────────────────────────────────────────────────────────────────────
$router->get(   '/api/goals',              [GoalController::class, 'index']);
$router->get(   '/api/goals/{id}',         [GoalController::class, 'show']);
$router->post(  '/api/goals',              [GoalController::class, 'store']);
$router->put(   '/api/goals/{id}',         [GoalController::class, 'update']);
$router->post(  '/api/goals/{id}/deposit', [GoalController::class, 'deposit']);
$router->delete('/api/goals/{id}',         [GoalController::class, 'destroy']);

// ─────────────────────────────────────────────────────────────────────────────
// EXCHANGE & FINANCE  (protected — external APIs)
// GET    /api/exchange/rates?base=AOA
// GET    /api/exchange/convert?from=USD&to=AOA&amount=100
// GET    /api/finance/quotes?symbols=AAPL,MSFT
// GET    /api/finance/market
// GET    /api/finance/crypto?symbols=BTC,ETH
// ─────────────────────────────────────────────────────────────────────────────
$router->get('/api/exchange/rates',   [FinanceController::class, 'exchangeRates']);
$router->get('/api/exchange/convert', [FinanceController::class, 'convertCurrency']);
$router->get('/api/finance/quotes',   [FinanceController::class, 'stockQuotes']);
$router->get('/api/finance/market',   [FinanceController::class, 'marketSummary']);
$router->get('/api/finance/crypto',   [FinanceController::class, 'cryptoPrices']);

// ─────────────────────────────────────────────────────────────────────────────
// BUDGETS / ORÇAMENTOS  (protected)
// GET    /api/budgets?month=2026-05
// GET    /api/budgets/{id}
// POST   /api/budgets
// PUT    /api/budgets/{id}
// DELETE /api/budgets/{id}
// ─────────────────────────────────────────────────────────────────────────────
$router->get(   '/api/budgets',      [BudgetController::class, 'index']);
$router->get(   '/api/budgets/{id}', [BudgetController::class, 'show']);
$router->post(  '/api/budgets',      [BudgetController::class, 'store']);
$router->put(   '/api/budgets/{id}', [BudgetController::class, 'update']);
$router->delete('/api/budgets/{id}', [BudgetController::class, 'destroy']);

// ─────────────────────────────────────────────────────────────────────────────
// ADMIN  (admin role required)
// GET    /api/admin/users
// GET    /api/admin/users/{id}
// PATCH  /api/admin/users/{id}
// DELETE /api/admin/users/{id}
// ─────────────────────────────────────────────────────────────────────────────
$router->get(   '/api/admin/users',      [UserController::class, 'adminIndex']);
$router->get(   '/api/admin/users/{id}', [UserController::class, 'adminShow']);
$router->patch( '/api/admin/users/{id}', [UserController::class, 'adminUpdate']);
$router->delete('/api/admin/users/{id}', [UserController::class, 'adminDestroy']);

return $router;
