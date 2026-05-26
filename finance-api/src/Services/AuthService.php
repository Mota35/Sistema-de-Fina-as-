<?php

namespace App\Services;

use App\Repositories\UserRepository;
use App\Helpers\JWT;
use App\Helpers\Mailer;
use App\Helpers\Logger;
use App\Exceptions\UnauthorizedException;
use App\Exceptions\ValidationException;
use App\Exceptions\NotFoundException;

class AuthService
{
    public function __construct(
        private UserRepository $userRepo = new UserRepository(),
        private Mailer         $mailer   = new Mailer(),
        private Logger         $logger   = new Logger()
    ) {}

    // ─── Register ────────────────────────────────────────────────────────────
    public function register(array $data): array
    {
        if ($this->userRepo->emailExists($data['email'])) {
            throw new ValidationException(['email' => ['Este email já está em uso.']]);
        }

        $userId = $this->userRepo->create([
            'role_id'  => 2, // default: user
            'name'     => sanitize($data['name']),
            'email'    => strtolower(trim($data['email'])),
            'password' => password_hash($data['password'], PASSWORD_BCRYPT, ['cost' => 12]),
            'language' => $data['language'] ?? 'pt',
            'currency' => $data['currency'] ?? 'AOA',
            'theme'    => $data['theme']    ?? 'light',
        ]);

        $user = $this->userRepo->findWithRole($userId);
        $this->mailer->sendWelcome($user['email'], $user['name']);

        $this->logger->info("New user registered: {$user['email']}");

        return $this->buildTokenResponse($user);
    }

    // ─── Login ───────────────────────────────────────────────────────────────
    public function login(string $email, string $password): array
    {
        $user = $this->userRepo->findByEmail(strtolower(trim($email)));

        if (!$user || !password_verify($password, $user['password'])) {
            $this->logger->warning("Failed login attempt for: $email");
            throw new UnauthorizedException('Credenciais inválidas.');
        }

        if ($user['status'] === 'blocked') {
            throw new UnauthorizedException('Conta bloqueada. Contacte o suporte.');
        }

        $this->logger->info("User logged in: {$user['email']}");
        return $this->buildTokenResponse($user);
    }

    // ─── Refresh Token ───────────────────────────────────────────────────────
    public function refresh(string $refreshToken): array
    {
        $payload = JWT::decode($refreshToken);

        if (($payload['type'] ?? '') !== 'refresh') {
            throw new UnauthorizedException('Token de refresh inválido.');
        }

        $user = $this->userRepo->findWithRole($payload['sub']);
        if (!$user) {
            throw new UnauthorizedException('Utilizador não encontrado.');
        }

        return $this->buildTokenResponse($user);
    }

    // ─── Forgot Password ─────────────────────────────────────────────────────
    public function forgotPassword(string $email): void
    {
        $user = $this->userRepo->findByEmail(strtolower(trim($email)));
        if (!$user) return; // Silence: don't reveal if email exists

        $code      = (string) rand(100000, 999999);
        $expiresAt = date('Y-m-d H:i:s', time() + 3600); // 1 hour

        $this->userRepo->storeResetToken($user['id'], $code, $expiresAt);
        $this->mailer->sendPasswordReset($user['email'], $user['name'], $code);

        $this->logger->info("Password reset code generated for: {$user['email']}");
    }

    // ─── Reset Password ──────────────────────────────────────────────────────
    public function resetPassword(string $code, string $newPassword): void
    {
        $user = $this->userRepo->findByResetToken($code);

        if (!$user) {
            throw new ValidationException(['code' => ['Código inválido ou expirado.']]);
        }

        $this->userRepo->update($user['id'], [
            'password' => password_hash($newPassword, PASSWORD_BCRYPT, ['cost' => 12]),
        ]);

        $this->userRepo->clearResetToken($user['id']);
        $this->logger->info("Password reset completed with code for user ID: {$user['id']}");
    }

    // ─── Change Password ─────────────────────────────────────────────────────
    public function changePassword(int $userId, string $currentPassword, string $newPassword): void
    {
        $user = $this->userRepo->findById($userId);

        if (!password_verify($currentPassword, $user['password'])) {
            throw new ValidationException(['current_password' => ['Senha atual incorreta.']]);
        }

        $this->userRepo->update($userId, [
            'password' => password_hash($newPassword, PASSWORD_BCRYPT, ['cost' => 12]),
        ]);
    }

    // ─── Me ──────────────────────────────────────────────────────────────────
    public function me(int $userId): array
    {
        $user = $this->userRepo->findWithRole($userId);
        if (!$user) throw new NotFoundException('Utilizador não encontrado.');
        return $this->sanitizeUser($user);
    }

    // ─── Build token response ─────────────────────────────────────────────────
    private function buildTokenResponse(array $user): array
    {
        $payload = [
            'sub'   => $user['id'],
            'name'  => $user['name'],
            'email' => $user['email'],
            'role'  => $user['role_name'],
        ];

        $tokens = JWT::generateTokenPair($payload);
        $tokens['user'] = $this->sanitizeUser($user);
        return $tokens;
    }

    private function sanitizeUser(array $user): array
    {
        unset($user['password'], $user['reset_token'], $user['reset_token_expires']);
        return $user;
    }
}
