<?php

namespace App\Controllers;

use App\Middleware\AuthMiddleware;
use App\Validators\Validator;
use App\Exceptions\AppException;
use App\Exceptions\ValidationException;
use App\Helpers\Logger;

abstract class BaseController
{
    protected AuthMiddleware $auth;
    protected Logger $logger;

    public function __construct()
    {
        $this->auth   = new AuthMiddleware();
        $this->logger = new Logger();
    }

    protected function validate(array $data, array $rules): void
    {
        Validator::make($data, $rules);
    }

    protected function body(): array
    {
        return requestBody();
    }

    protected function queryParam(string $key, mixed $default = null): mixed
    {
        return getRequestParam($key, $default);
    }

    protected function paginationParams(): array
    {
        $page    = max(1, (int) $this->queryParam('page', 1));
        $perPage = min(100, max(5, (int) $this->queryParam('per_page', 15)));
        return [$page, $perPage];
    }

    protected function handleException(\Throwable $e): void
    {
        if ($e instanceof ValidationException) {
            http_response_code(422);
            header('Content-Type: application/json; charset=UTF-8');
            echo json_encode([
                'success' => false,
                'message' => $e->getMessage(),
                'code'    => 422,
                'errors'  => $e->getErrors(),
                'data'    => null,
            ], JSON_UNESCAPED_UNICODE);
            exit;
        }

        if ($e instanceof AppException) {
            errorResponse($e->getMessage(), $e->getCode());
        }

        $this->logger->error($e->getMessage(), ['trace' => $e->getTraceAsString()]);
        errorResponse('Internal Server Error', 500);
    }
}
