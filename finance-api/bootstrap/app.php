<?php

/**
 * Finance Manager API - Bootstrap
 * Custom PSR-4 Autoloader (no Composer required)
 */

define('ROOT_PATH', dirname(__DIR__));
define('SRC_PATH', ROOT_PATH . '/src');
define('CONFIG_PATH', ROOT_PATH . '/config');
define('STORAGE_PATH', ROOT_PATH . '/storage');

// ─── Autoloader ─────────────────────────────────────────────────────────────
spl_autoload_register(function (string $class): void {
    $prefix = 'App\\';
    $baseDir = SRC_PATH . '/';

    if (!str_starts_with($class, $prefix)) {
        return;
    }

    $relativeClass = substr($class, strlen($prefix));
    $file = $baseDir . str_replace('\\', '/', $relativeClass) . '.php';

    if (file_exists($file)) {
        require $file;
    }
});

// ─── Load environment variables ──────────────────────────────────────────────
$envFile = ROOT_PATH . '/.env';
if (file_exists($envFile)) {
    $lines = file($envFile, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    foreach ($lines as $line) {
        if (str_starts_with(trim($line), '#') || !str_contains($line, '=')) {
            continue;
        }
        [$key, $value] = explode('=', $line, 2);
        $key   = trim($key);
        $value = trim($value, " \t\n\r\0\x0B\"'");
        $_ENV[$key] = $value;
        putenv("$key=$value");
    }
}

// ─── Load helpers ────────────────────────────────────────────────────────────
require_once SRC_PATH . '/Helpers/functions.php';

// ─── Load core exceptions ────────────────────────────────────────────────────
require_once SRC_PATH . '/Exceptions/AppException.php';

// ─── Error handling ──────────────────────────────────────────────────────────
if (env('APP_DEBUG', 'false') === 'true') {
    error_reporting(E_ALL);
    ini_set('display_errors', '0');
} else {
    error_reporting(0);
    ini_set('display_errors', '0');
}

set_exception_handler(function (Throwable $e): void {
    http_response_code(500);
    header('Content-Type: application/json');
    echo json_encode([
        'success' => false,
        'message' => $e->getMessage(),
        'file'    => $e->getFile(),
        'line'    => $e->getLine(),
        'code'    => $e->getCode() ?: 500,
    ], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
});