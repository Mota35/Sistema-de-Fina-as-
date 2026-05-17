<?php

namespace App\Services;

use App\Repositories\UserRepository;
use App\Helpers\FileUpload;
use App\Exceptions\NotFoundException;
use App\Exceptions\ValidationException;
use App\Exceptions\ForbiddenException;

class UserService
{
    public function __construct(
        private UserRepository $repo   = new UserRepository(),
        private FileUpload     $upload = new FileUpload()
    ) {}

    public function getProfile(int $userId): array
    {
        $user = $this->repo->findWithRole($userId);
        if (!$user) throw new NotFoundException('Utilizador não encontrado.');
        return $this->sanitize($user);
    }

    public function updateProfile(int $userId, array $data): array
    {
        $user = $this->repo->findById($userId);
        if (!$user) throw new NotFoundException('Utilizador não encontrado.');

        // Check email uniqueness
        if (isset($data['email']) && $this->repo->emailExists($data['email'], $userId)) {
            throw new ValidationException(['email' => ['Este email já está em uso.']]);
        }

        $fields = [];
        if (isset($data['name']))     $fields['name']     = sanitize($data['name']);
        if (isset($data['email']))    $fields['email']    = strtolower(trim($data['email']));
        if (isset($data['language'])) $fields['language'] = $data['language'];
        if (isset($data['theme']))    $fields['theme']    = $data['theme'];
        if (isset($data['currency'])) $fields['currency'] = $data['currency'];

        if (!empty($fields)) $this->repo->update($userId, $fields);
        return $this->sanitize($this->repo->findWithRole($userId));
    }

    public function uploadAvatar(int $userId, array $file): array
    {
        $user = $this->repo->findById($userId);
        if (!$user) throw new NotFoundException('Utilizador não encontrado.');

        // Delete old avatar
        if ($user['avatar']) {
            $this->upload->deleteFile($user['avatar']);
        }

        $path = $this->upload->uploadAvatar($file);
        $this->repo->update($userId, ['avatar' => $path]);

        return $this->sanitize($this->repo->findWithRole($userId));
    }

    // ─── Admin ───────────────────────────────────────────────────────────────
    public function listAll(int $page, int $perPage, ?string $search = null): array
    {
        return $this->repo->listAll($page, $perPage, $search);
    }

    public function adminGetUser(int $id): array
    {
        $user = $this->repo->findWithRole($id);
        if (!$user) throw new NotFoundException('Utilizador não encontrado.');
        return $this->sanitize($user);
    }

    public function adminUpdateUser(int $id, array $data): array
    {
        $user = $this->repo->findById($id);
        if (!$user) throw new NotFoundException('Utilizador não encontrado.');

        $fields = [];
        if (isset($data['status']))  $fields['status']  = $data['status'];
        if (isset($data['role_id'])) $fields['role_id'] = (int) $data['role_id'];
        if (isset($data['name']))    $fields['name']    = sanitize($data['name']);

        if (!empty($fields)) $this->repo->update($id, $fields);
        return $this->sanitize($this->repo->findWithRole($id));
    }

    public function adminDeleteUser(int $id, int $adminId): void
    {
        if ($id === $adminId) {
            throw new ForbiddenException('Não pode eliminar a sua própria conta.');
        }
        $user = $this->repo->findById($id);
        if (!$user) throw new NotFoundException('Utilizador não encontrado.');
        $this->repo->delete($id);
    }

    private function sanitize(array $user): array
    {
        unset($user['password'], $user['reset_token'], $user['reset_token_expires']);
        return $user;
    }
}
