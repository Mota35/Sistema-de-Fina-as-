<?php

namespace App\Services;

use App\Repositories\BudgetRepository;
use App\Exceptions\NotFoundException;
use App\Exceptions\ValidationException;

class BudgetService
{
    public function __construct(
        private BudgetRepository $repo = new BudgetRepository()
    ) {}

    public function list(int $userId, ?string $month = null): array
    {
        $month = $month ?? date('Y-m');
        return $this->repo->allByUser($userId, $month);
    }

    public function find(int $id, int $userId): array
    {
        $budget = $this->repo->findUserBudget($id, $userId);
        if (!$budget) throw new NotFoundException('Orçamento não encontrado.');
        return $budget;
    }

    public function create(int $userId, array $data): array
    {
        $month = $data['month'] ?? date('Y-m');

        if ($this->repo->existsForMonth($userId, (int)$data['category_id'], $month)) {
            throw new ValidationException([
                'category_id' => ['Já existe um orçamento para esta categoria neste mês.']
            ]);
        }

        $id = $this->repo->create([
            'user_id'      => $userId,
            'category_id'  => (int) $data['category_id'],
            'limit_amount' => round((float) $data['limit_amount'], 2),
            'month'        => $month,
        ]);

        return $this->repo->findUserBudget($id, $userId);
    }

    public function update(int $id, int $userId, array $data): array
    {
        $budget = $this->repo->findUserBudget($id, $userId);
        if (!$budget) throw new NotFoundException('Orçamento não encontrado.');

        if (isset($data['category_id']) || isset($data['month'])) {
            $catId = (int) ($data['category_id'] ?? $budget['category_id']);
            $month = $data['month'] ?? $budget['month'];
            if ($this->repo->existsForMonth($userId, $catId, $month, $id)) {
                throw new ValidationException([
                    'category_id' => ['Já existe um orçamento para esta categoria neste mês.']
                ]);
            }
        }

        $fields = [];
        if (isset($data['category_id']))  $fields['category_id']  = (int)   $data['category_id'];
        if (isset($data['limit_amount'])) $fields['limit_amount'] = round((float) $data['limit_amount'], 2);
        if (isset($data['month']))        $fields['month']        = $data['month'];

        if (!empty($fields)) $this->repo->update($id, $fields);
        return $this->repo->findUserBudget($id, $userId);
    }

    public function delete(int $id, int $userId): void
    {
        $budget = $this->repo->findUserBudget($id, $userId);
        if (!$budget) throw new NotFoundException('Orçamento não encontrado.');
        $this->repo->delete($id);
    }
}
