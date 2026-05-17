<?php

namespace App\Services;

use App\Repositories\CategoryRepository;
use App\Exceptions\NotFoundException;
use App\Exceptions\ForbiddenException;

class CategoryService
{
    public function __construct(
        private CategoryRepository $repo = new CategoryRepository()
    ) {}

    public function list(int $userId, ?string $type = null): array
    {
        return $this->repo->allForUser($userId, $type);
    }

    public function find(int $id, int $userId): array
    {
        $cat = $this->repo->findUserCategory($id, $userId);
        if (!$cat) throw new NotFoundException('Categoria não encontrada.');
        return $cat;
    }

    public function create(int $userId, array $data): array
    {
        $id = $this->repo->create([
            'user_id' => $userId,
            'name'    => sanitize($data['name']),
            'type'    => $data['type'],
            'color'   => $data['color'] ?? '#6366f1',
            'icon'    => $data['icon']  ?? null,
        ]);
        return $this->repo->findById($id);
    }

    public function update(int $id, int $userId, array $data): array
    {
        $cat = $this->repo->findOwned($id, $userId);
        if (!$cat) throw new NotFoundException('Categoria não encontrada ou não pode ser editada.');

        $fields = [];
        if (isset($data['name']))  $fields['name']  = sanitize($data['name']);
        if (isset($data['type']))  $fields['type']  = $data['type'];
        if (isset($data['color'])) $fields['color'] = $data['color'];
        if (isset($data['icon']))  $fields['icon']  = $data['icon'];

        if (!empty($fields)) $this->repo->update($id, $fields);
        return $this->repo->findById($id);
    }

    public function delete(int $id, int $userId): void
    {
        $cat = $this->repo->findOwned($id, $userId);
        if (!$cat) throw new NotFoundException('Categoria não encontrada ou não pode ser eliminada.');
        $this->repo->delete($id);
    }
}
