<?php

namespace App\Middleware;

use App\Helpers\JWT;
use App\Helpers\Logger;
use App\Exceptions\UnauthorizedException;
use App\Exceptions\ForbiddenException;

class AuthMiddleware
{
    private Logger $logger;

    public function __construct()
    {
        $this->logger = new Logger();
    }

    /**
     * Authenticate and return the decoded payload.
     * Throws UnauthorizedException if invalid.
     */
    public function authenticate(): array
    {
        $token = JWT::fromHeader();

        if (!$token) {
            throw new UnauthorizedException('Access token is required.');
        }

        try {
            $payload = JWT::decode($token);
        } catch (UnauthorizedException $e) {
            $this->logger->warning('Auth failed: ' . $e->getMessage(), [
                'ip' => $_SERVER['REMOTE_ADDR'] ?? 'unknown',
            ]);
            throw $e;
        }

        if (($payload['type'] ?? '') !== 'access') {
            throw new UnauthorizedException('Invalid token type.');
        }

        return $payload;
    }

    /**
     * Authenticate and require a specific role.
     */
    public function requireRole(string ...$roles): array
    {
        $payload = $this->authenticate();

        if (!in_array($payload['role'] ?? '', $roles, true)) {
            throw new ForbiddenException('You do not have permission to perform this action.');
        }

        return $payload;
    }

    /**
     * Require admin role.
     */
    public function requireAdmin(): array
    {
        return $this->requireRole('admin');
    }
}
