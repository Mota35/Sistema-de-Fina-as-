<?php

namespace App;

use App\Exceptions\AppException;
use App\Helpers\Logger;

class Router
{
    private array  $routes  = [];
    private Logger $logger;
    private float  $startTime;

    public function __construct()
    {
        $this->logger    = new Logger();
        $this->startTime = microtime(true);
    }

    public function get(string $path, callable|array $handler): void
    {
        $this->addRoute('GET', $path, $handler);
    }

    public function post(string $path, callable|array $handler): void
    {
        $this->addRoute('POST', $path, $handler);
    }

    public function put(string $path, callable|array $handler): void
    {
        $this->addRoute('PUT', $path, $handler);
    }

    public function patch(string $path, callable|array $handler): void
    {
        $this->addRoute('PATCH', $path, $handler);
    }

    public function delete(string $path, callable|array $handler): void
    {
        $this->addRoute('DELETE', $path, $handler);
    }

    private function addRoute(string $method, string $path, callable|array $handler): void
    {
        $this->routes[] = [
            'method'  => $method,
            'path'    => $path,
            'pattern' => $this->pathToPattern($path),
            'handler' => $handler,
        ];
    }

    private function pathToPattern(string $path): string
    {
        // Convert /users/{id} → /users/(\d+)
        // Convert /users/{slug} → /users/([a-zA-Z0-9_-]+)
        $pattern = preg_replace('/\{id\}/', '(\d+)', $path);
        $pattern = preg_replace('/\{[a-zA-Z_]+\}/', '([^/]+)', $pattern);
        return '#^' . $pattern . '$#';
    }

    public function dispatch(): void
    {
        $method = $_SERVER['REQUEST_METHOD'];
        $uri    = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);

        // Remove subfolder prefix quando corre dentro de /finance-api/public/
        $basePath = rtrim(dirname($_SERVER['SCRIPT_NAME']), '/');
        if ($basePath && str_starts_with($uri, $basePath)) {
            $uri = substr($uri, strlen($basePath));
        }

        $uri = rtrim($uri, '/') ?: '/';

        foreach ($this->routes as $route) {
            if ($route['method'] !== $method) continue;

            if (preg_match($route['pattern'], $uri, $matches)) {
                array_shift($matches); // remove full match
                $params = array_values($matches);

                try {
                    $this->invokeHandler($route['handler'], $params);
                } catch (\Throwable $e) {
                    $this->handleGlobalException($e);
                }

                $duration = round((microtime(true) - $this->startTime) * 1000, 2);
                $status   = http_response_code();
                $this->logger->logRequest($method, $uri, $status, $duration);
                return;
            }
        }

        errorResponse('Endpoint not found.', 404);
    }

    private function invokeHandler(callable|array $handler, array $params): void
    {
        if (is_callable($handler)) {
            call_user_func_array($handler, $params);
            return;
        }

        [$controllerClass, $method] = $handler;
        $controller = new $controllerClass();
        call_user_func_array([$controller, $method], $params);
    }

    private function handleGlobalException(\Throwable $e): void
    {
        $this->logger->error($e->getMessage(), ['file' => $e->getFile(), 'line' => $e->getLine()]);

        if ($e instanceof \App\Exceptions\ValidationException) {
            http_response_code(422);
            header('Content-Type: application/json; charset=UTF-8');
            echo json_encode([
                'success' => false,
                'message' => $e->getMessage(),
                'code'    => 422,
                'errors'  => $e->getErrors(),
                'data'    => null,
            ], JSON_UNESCAPED_UNICODE);
            return;
        }

        if ($e instanceof AppException) {
            errorResponse($e->getMessage(), $e->getCode());
            return;
        }

       errorResponse(
            env('APP_DEBUG') === 'true' ? $e->getMessage() : 'Internal Server Error',
            500
        );
    }
}
