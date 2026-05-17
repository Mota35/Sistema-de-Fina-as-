<?php

namespace App\Controllers;

use App\Services\AuthService;

class AuthController extends BaseController
{
    private AuthService $service;

    public function __construct()
    {
        parent::__construct();
        $this->service = new AuthService();
    }

    // POST /api/auth/register
    public function register(): void
    {
        try {
            $data = $this->body();
            $this->validate($data, [
                'name'                  => 'required|min:2|max:100',
                'email'                 => 'required|email|max:150',
                'password'              => 'required|min:8|max:255|confirmed',
                'password_confirmation' => 'required',
            ]);

            $result = $this->service->register($data);
            jsonResponse($result, 201, 'Conta criada com sucesso.');
        } catch (\Throwable $e) {
            $this->handleException($e);
        }
    }

    // POST /api/auth/login
    public function login(): void
    {
        try {
            $data = $this->body();
            $this->validate($data, [
                'email'    => 'required|email',
                'password' => 'required',
            ]);

            $result = $this->service->login($data['email'], $data['password']);
            jsonResponse($result, 200, 'Login realizado com sucesso.');
        } catch (\Throwable $e) {
            $this->handleException($e);
        }
    }

    // POST /api/auth/logout
    public function logout(): void
    {
        // JWT is stateless — client simply discards token
        jsonResponse(null, 200, 'Sessão terminada com sucesso.');
    }

    // POST /api/auth/refresh
    public function refresh(): void
    {
        try {
            $data  = $this->body();
            $token = $data['refresh_token'] ?? '';
            if (!$token) errorResponse('refresh_token é obrigatório.', 422);

            $result = $this->service->refresh($token);
            jsonResponse($result, 200, 'Token renovado com sucesso.');
        } catch (\Throwable $e) {
            $this->handleException($e);
        }
    }

    // POST /api/auth/forgot-password
    public function forgotPassword(): void
    {
        try {
            $data = $this->body();
            $this->validate($data, ['email' => 'required|email']);

            $this->service->forgotPassword($data['email']);
            // Always return success to avoid user enumeration
            jsonResponse(null, 200, 'Se o email existir, receberá instruções em breve.');
        } catch (\Throwable $e) {
            $this->handleException($e);
        }
    }

    // POST /api/auth/reset-password
    public function resetPassword(): void
    {
        try {
            $data = $this->body();
            $this->validate($data, [
                'token'                 => 'required',
                'password'              => 'required|min:8|confirmed',
                'password_confirmation' => 'required',
            ]);

            $this->service->resetPassword($data['token'], $data['password']);
            jsonResponse(null, 200, 'Senha alterada com sucesso.');
        } catch (\Throwable $e) {
            $this->handleException($e);
        }
    }

    // POST /api/auth/change-password
    public function changePassword(): void
    {
        try {
            $payload = $this->auth->authenticate();
            $data    = $this->body();
            $this->validate($data, [
                'current_password'      => 'required',
                'password'              => 'required|min:8|confirmed',
                'password_confirmation' => 'required',
            ]);

            $this->service->changePassword($payload['sub'], $data['current_password'], $data['password']);
            jsonResponse(null, 200, 'Senha alterada com sucesso.');
        } catch (\Throwable $e) {
            $this->handleException($e);
        }
    }

    // GET /api/auth/me
    public function me(): void
    {
        try {
            $payload = $this->auth->authenticate();
            $user    = $this->service->me($payload['sub']);
            jsonResponse($user);
        } catch (\Throwable $e) {
            $this->handleException($e);
        }
    }
}
