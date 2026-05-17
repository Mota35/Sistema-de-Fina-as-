<?php

namespace App\Services;

use App\Repositories\GoalRepository;
use App\Exceptions\NotFoundException;
use App\Exceptions\ValidationException;

class GoalService
{
    public function __construct(
        private GoalRepository $repo = new GoalRepository()
    ) {}

    public function list(int $userId, int $page, int $perPage): array
    {
        return $this->repo->allByUser($userId, $page, $perPage);
    }

    public function find(int $id, int $userId): array
    {
        $goal = $this->repo->findUserGoal($id, $userId);
        if (!$goal) throw new NotFoundException('Meta não encontrada.');
        return $goal;
    }

    public function create(int $userId, array $data): array
    {
        $id = $this->repo->create([
            'user_id'        => $userId,
            'title'          => sanitize($data['title']),
            'target_amount'  => round((float) $data['target_amount'], 2),
            'current_amount' => round((float) ($data['current_amount'] ?? 0), 2),
            'deadline'       => $data['deadline'] ?? null,
        ]);
        return $this->repo->findUserGoal($id, $userId);
    }

    public function update(int $id, int $userId, array $data): array
    {
        $goal = $this->repo->findUserGoal($id, $userId);
        if (!$goal) throw new NotFoundException('Meta não encontrada.');

        $fields = [];
        if (isset($data['title']))          $fields['title']          = sanitize($data['title']);
        if (isset($data['target_amount']))  $fields['target_amount']  = round((float) $data['target_amount'], 2);
        if (isset($data['current_amount'])) $fields['current_amount'] = round((float) $data['current_amount'], 2);
        if (array_key_exists('deadline', $data)) $fields['deadline'] = $data['deadline'];

        if (!empty($fields)) $this->repo->update($id, $fields);
        return $this->repo->findUserGoal($id, $userId);
    }

    public function deposit(int $id, int $userId, float $amount): array
    {
        $goal = $this->repo->findUserGoal($id, $userId);
        if (!$goal) throw new NotFoundException('Meta não encontrada.');

        if ($amount <= 0) {
            throw new ValidationException(['amount' => ['O valor deve ser positivo.']]);
        }

        $this->repo->addAmount($id, $amount);
        return $this->repo->findUserGoal($id, $userId);
    }

    public function delete(int $id, int $userId): void
    {
        $goal = $this->repo->findUserGoal($id, $userId);
        if (!$goal) throw new NotFoundException('Meta não encontrada.');
        $this->repo->delete($id);
    }
}
