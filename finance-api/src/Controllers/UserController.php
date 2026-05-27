<?php

namespace App\Controllers;

use App\Services\UserService;

class UserController extends BaseController
{
    private UserService $service;

    public function __construct()
    {
        parent::__construct();
        $this->service = new UserService();
    }

    // GET /api/profile
    public function profile(): void
    {
        try {
            $payload = $this->auth->authenticate();
            $user    = $this->service->getProfile($payload['sub']);
            jsonResponse($user);
        } catch (\Throwable $e) { $this->handleException($e); }
    }

    // PUT /api/profile
    public function updateProfile(): void
    {
        try {
            $payload = $this->auth->authenticate();
            $data    = $this->body();
            $this->validate($data, [
                'name'     => 'nullable|min:2|max:100',
                'email'    => 'nullable|email|max:150',
                'language' => 'nullable|max:10',
                'theme'    => 'nullable|in:light,dark',
                'currency' => 'nullable|max:10',
            ]);
            $user = $this->service->updateProfile($payload['sub'], $data);
            jsonResponse($user, 200, 'Perfil atualizado com sucesso.');
        } catch (\Throwable $e) { $this->handleException($e); }
    }

    // POST /api/profile/avatar
    public function uploadAvatar(): void
    {
        try {
            $payload = $this->auth->authenticate();
            if (empty($_FILES['avatar'])) {
                throw new \App\Exceptions\ValidationException(['avatar' => ['Ficheiro de avatar é obrigatório.']]);
            }
            $user = $this->service->uploadAvatar($payload['sub'], $_FILES['avatar']);
            jsonResponse($user, 200, 'Avatar atualizado com sucesso.');
        } catch (\Throwable $e) { $this->handleException($e); }
    }

    // ─── Admin endpoints ─────────────────────────────────────────────────────

    // GET /api/admin/users
    public function adminIndex(): void
    {
        try {
            $this->auth->requireAdmin();
            [$page, $perPage] = $this->paginationParams();
            $search = $this->queryParam('search');
            $result = $this->service->listAll($page, $perPage, $search ?: null);
            paginatedResponse($result['items'], $result['total'], $result['page'], $result['perPage']);
        } catch (\Throwable $e) { $this->handleException($e); }
    }

    // GET /api/admin/users/{id}
    public function adminShow(int $id): void
    {
        try {
            $this->auth->requireAdmin();
            $user = $this->service->adminGetUser($id);
            jsonResponse($user);
        } catch (\Throwable $e) { $this->handleException($e); }
    }

    // PATCH /api/admin/users/{id}
    public function adminUpdate(int $id): void
    {
        try {
            $this->auth->requireAdmin();
            $data = $this->body();
            $this->validate($data, [
                'status'  => 'nullable|in:active,blocked',
                'role_id' => 'nullable|integer',
                'name'    => 'nullable|min:2|max:100',
            ]);
            $user = $this->service->adminUpdateUser($id, $data);
            jsonResponse($user, 200, 'Utilizador atualizado com sucesso.');
        } catch (\Throwable $e) { $this->handleException($e); }
    }

    // DELETE /api/admin/users/{id}
    public function adminDestroy(int $id): void
    {
        try {
            $payload = $this->auth->requireAdmin();
            $this->service->adminDeleteUser($id, $payload['sub']);
            jsonResponse(null, 200, 'Utilizador eliminado com sucesso.');
        } catch (\Throwable $e) { $this->handleException($e); }
    }
}
