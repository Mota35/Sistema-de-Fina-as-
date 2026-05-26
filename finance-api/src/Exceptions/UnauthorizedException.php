<?php
namespace App\Exceptions;

class UnauthorizedException extends AppException
{
    public function __construct(string $message = 'Unauthorized.', ?\Throwable $previous = null)
    {
        parent::__construct($message, 401, $previous);
    }
}
