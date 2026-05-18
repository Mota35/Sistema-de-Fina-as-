<?php

namespace App\Services;

use App\Repositories\TransactionRepository;
use App\Repositories\AccountRepository;
use App\Repositories\CategoryRepository;
use App\Exceptions\NotFoundException;
use App\Exceptions\ValidationException;

class TransactionService
{
    public function __construct(
        private TransactionRepository $repo        = new TransactionRepository(),
        private AccountRepository     $accountRepo  = new AccountRepository(),
        private CategoryRepository    $categoryRepo = new CategoryRepository()
    ) {}

    public function list(int $userId, array $filters, int $page, int $perPage): array
    {
        return $this->repo->allByUser($userId, $filters, $page, $perPage);
    }

    public function find(int $id, int $userId): array
    {
        $tx = $this->repo->findUserTransaction($id, $userId);
        if (!$tx) throw new NotFoundException('Transação não encontrada.');
        return $tx;
    }

    public function create(int $userId, array $data): array
    {
        // Validate account ownership
        $account = $this->accountRepo->findUserAccount((int) $data['account_id'], $userId);
        if (!$account) throw new NotFoundException('Conta não encontrada.');

        // Validate category access
        $category = $this->categoryRepo->findUserCategory((int) $data['category_id'], $userId);
        if (!$category) throw new NotFoundException('Categoria não encontrada.');

        // Prevent overdraft (optional - business rule)
        if ($data['type'] === 'expense' && (float) $data['amount'] > $account['balance']) {
            // Allow overdraft but flag it
        }

        $id = $this->repo->create([
            'user_id'          => $userId,
            'account_id'       => (int) $data['account_id'],
            'category_id'      => (int) $data['category_id'],
            'type'             => $data['type'],
            'amount'           => round((float) $data['amount'], 2),
            'description'      => isset($data['description']) ? sanitize($data['description']) : null,
            'transaction_date' => $data['transaction_date'],
            'recurring'        => isset($data['recurring']) ? (int)(bool) $data['recurring'] : 0,
        ]);
        // Note: balance updated by DB trigger trg_after_transaction_insert

        return $this->repo->findUserTransaction($id, $userId);
    }

    public function update(int $id, int $userId, array $data): array
    {
        $tx = $this->repo->findUserTransaction($id, $userId);
        if (!$tx) throw new NotFoundException('Transação não encontrada.');

        // If amount or type changes, we need to reverse old and apply new
        $needsBalanceAdjust = isset($data['amount']) || isset($data['type']) || isset($data['account_id']);

        if ($needsBalanceAdjust) {
            $this->reverseTransaction($tx);
        }

        $fields = [];
        if (isset($data['account_id']))      $fields['account_id']      = (int) $data['account_id'];
        if (isset($data['category_id']))     $fields['category_id']     = (int) $data['category_id'];
        if (isset($data['type']))            $fields['type']            = $data['type'];
        if (isset($data['amount']))          $fields['amount']          = round((float) $data['amount'], 2);
        if (isset($data['description']))     $fields['description']     = sanitize($data['description']);
        if (isset($data['transaction_date']))$fields['transaction_date']= $data['transaction_date'];
        if (isset($data['recurring']))       $fields['recurring']       = (int)(bool) $data['recurring'];

        if (!empty($fields)) $this->repo->update($id, $fields);

        if ($needsBalanceAdjust) {
            $updated = $this->repo->findUserTransaction($id, $userId);
            $this->applyTransaction($updated);
        }

        return $this->repo->findUserTransaction($id, $userId);
    }

    public function delete(int $id, int $userId): void
    {
        $tx = $this->repo->findUserTransaction($id, $userId);
        if (!$tx) throw new NotFoundException('Transação não encontrada.');

        // Reverse the balance effect
        $this->reverseTransaction($tx);
        $this->repo->delete($id);
    }

    public function summary(int $userId, int $year, int $month): array
    {
        $rows   = $this->repo->summaryByMonth($userId, $year, $month);
        $income = 0.0;
        $expense= 0.0;

        foreach ($rows as $row) {
            if ($row['type'] === 'income')  $income  = (float) $row['total'];
            if ($row['type'] === 'expense') $expense = (float) $row['total'];
        }

        return [
            'year'    => $year,
            'month'   => $month,
            'income'  => $income,
            'expense' => $expense,
            'balance' => $income - $expense,
        ];
    }

    public function byCategory(int $userId, string $type, ?string $from, ?string $to): array
    {
        return $this->repo->summaryByCategory($userId, $type, $from, $to);
    }

    public function export(int $userId, array $filters = [], int $page = 1, int $perPage = 1000): array
    {
        $result = $this->repo->allByUser($userId, $filters, $page, $perPage);
        return $result['items'];
    }

    public function evolution(int $userId, int $months = 12): array
    {
        $rows   = $this->repo->monthlyEvolution($userId, $months);
        $result = [];

        foreach ($rows as $row) {
            $m = $row['month'];
            $result[$m] ??= ['month' => $m, 'income' => 0.0, 'expense' => 0.0];
            $result[$m][$row['type']] = (float) $row['total'];
        }

        return array_values($result);
    }

    // ─── Balance helpers ─────────────────────────────────────────────────────
    private function reverseTransaction(array $tx): void
    {
        $db = \App\Config\Database::getInstance();
        $op = $tx['type'] === 'income' ? '-' : '+';
        $stmt = $db->prepare("UPDATE accounts SET balance = balance $op :amt WHERE id = :id");
        $stmt->execute([':amt' => $tx['amount'], ':id' => $tx['account_id']]);
    }

    private function applyTransaction(array $tx): void
    {
        $db = \App\Config\Database::getInstance();
        $op = $tx['type'] === 'income' ? '+' : '-';
        $stmt = $db->prepare("UPDATE accounts SET balance = balance $op :amt WHERE id = :id");
        $stmt->execute([':amt' => $tx['amount'], ':id' => $tx['account_id']]);
    }
}
