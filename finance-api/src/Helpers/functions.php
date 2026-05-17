<?php

if (!function_exists('env')) {
    function env(string $key, mixed $default = null): mixed
    {
        $value = $_ENV[$key] ?? getenv($key);
        if ($value === false || $value === '') {
            return $default;
        }
        return match (strtolower($value)) {
            'true'  => true,
            'false' => false,
            'null'  => null,
            default => $value,
        };
    }
}

if (!function_exists('jsonResponse')) {
    function jsonResponse(mixed $data, int $status = 200, string $message = 'OK'): void
    {
        http_response_code($status);
        header('Content-Type: application/json; charset=UTF-8');
        echo json_encode([
            'success' => $status >= 200 && $status < 300,
            'message' => $message,
            'code'    => $status,
            'data'    => $data,
        ], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
        exit;
    }
}

if (!function_exists('errorResponse')) {
    function errorResponse(string $message, int $status = 400, mixed $errors = null): void
    {
        http_response_code($status);
        header('Content-Type: application/json; charset=UTF-8');
        $body = [
            'success' => false,
            'message' => $message,
            'code'    => $status,
            'data'    => null,
        ];
        if ($errors !== null) {
            $body['errors'] = $errors;
        }
        echo json_encode($body, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
        exit;
    }
}

if (!function_exists('paginatedResponse')) {
    function paginatedResponse(array $items, int $total, int $page, int $perPage, int $status = 200): void
    {
        http_response_code($status);
        header('Content-Type: application/json; charset=UTF-8');
        echo json_encode([
            'success' => true,
            'message' => 'OK',
            'code'    => $status,
            'data'    => $items,
            'meta'    => [
                'total'        => $total,
                'per_page'     => $perPage,
                'current_page' => $page,
                'last_page'    => (int) ceil($total / $perPage),
                'from'         => ($page - 1) * $perPage + 1,
                'to'           => min($page * $perPage, $total),
            ],
        ], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
        exit;
    }
}

if (!function_exists('sanitize')) {
    function sanitize(mixed $value): mixed
    {
        if (is_string($value)) {
            return htmlspecialchars(strip_tags(trim($value)), ENT_QUOTES, 'UTF-8');
        }
        if (is_array($value)) {
            return array_map('sanitize', $value);
        }
        return $value;
    }
}

if (!function_exists('requestBody')) {
    function requestBody(): array
    {
        $raw = file_get_contents('php://input');
        if (empty($raw)) {
            return $_POST ?? [];
        }
        $decoded = json_decode($raw, true);
        return is_array($decoded) ? $decoded : [];
    }
}

if (!function_exists('getRequestParam')) {
    function getRequestParam(string $key, mixed $default = null): mixed
    {
        return $_GET[$key] ?? $default;
    }
}

if (!function_exists('generateToken')) {
    function generateToken(int $length = 64): string
    {
        return bin2hex(random_bytes($length / 2));
    }
}

if (!function_exists('slug')) {
    function slug(string $text): string
    {
        $text = mb_strtolower($text, 'UTF-8');
        $text = preg_replace('/[^a-z0-9\s-]/', '', $text);
        $text = preg_replace('/[\s-]+/', '-', trim($text));
        return $text;
    }
}

if (!function_exists('formatCurrency')) {
    function formatCurrency(float $amount, string $currency = 'AOA'): string
    {
        return number_format($amount, 2, ',', '.') . ' ' . $currency;
    }
}

if (!function_exists('now')) {
    function now(): string
    {
        return date('Y-m-d H:i:s');
    }
}
