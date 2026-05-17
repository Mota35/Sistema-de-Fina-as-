<?php

namespace App\Exceptions;

class AppException extends \RuntimeException
{
    public function __construct(string $message, int $code = 400, ?\Throwable $previous = null)
    {
        parent::__construct($message, $code, $previous);
    }
}

class UnauthorizedException extends AppException
{
    public function __construct(string $message = 'Unauthorized.', ?\Throwable $previous = null)
    {
        parent::__construct($message, 401, $previous);
    }
}

class ForbiddenException extends AppException
{
    public function __construct(string $message = 'Forbidden.', ?\Throwable $previous = null)
    {
        parent::__construct($message, 403, $previous);
    }
}

class NotFoundException extends AppException
{
    public function __construct(string $message = 'Resource not found.', ?\Throwable $previous = null)
    {
        parent::__construct($message, 404, $previous);
    }
}

class ValidationException extends AppException
{
    private array $errors;

    public function __construct(array $errors, string $message = 'Validation failed.')
    {
        parent::__construct($message, 422);
        $this->errors = $errors;
    }

    public function getErrors(): array
    {
        return $this->errors;
    }
}
