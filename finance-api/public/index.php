<?php

declare(strict_types=1);

ini_set('display_errors', '1');
error_reporting(E_ALL);

register_shutdown_function(function () {
    $error = error_get_last();
    if ($error && in_array($error['type'], [E_ERROR, E_PARSE, E_CORE_ERROR, E_COMPILE_ERROR])) {
        header('Content-Type: application/json');
        echo json_encode([
            'FATAL_ERROR' => $error['message'],
            'file'        => $error['file'],
            'line'        => $error['line'],
        ]);
    }
});

// Bootstrap
require_once dirname(__DIR__) . '/bootstrap/app.php';

// CORS
(new \App\Middleware\CorsMiddleware())->handle();

// Headers
header('Content-Type: application/json; charset=UTF-8');
header('X-Content-Type-Options: nosniff');
header('X-Frame-Options: DENY');
header('X-XSS-Protection: 1; mode=block');
header('Referrer-Policy: strict-origin-when-cross-origin');

// Serve uploaded files
$uri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
if (str_starts_with($uri, '/storage/uploads/')) {
    $filePath = ROOT_PATH . $uri;
    if (file_exists($filePath) && is_file($filePath)) {
        $mime = mime_content_type($filePath);
        header('Content-Type: ' . $mime);
        header('Cache-Control: public, max-age=86400');
        readfile($filePath);
        exit;
    }
    http_response_code(404);
    echo json_encode(['success' => false, 'message' => 'File not found.']);
    exit;
}

// Dispatch
$router = require_once dirname(__DIR__) . '/routes/api.php';
$router->dispatch();