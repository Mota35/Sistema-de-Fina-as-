<?php

namespace App\Services;

use App\Repositories\AccountRepository;
use App\Exceptions\NotFoundException;
use App\Exceptions\ForbiddenException;

class AccountService
{
    public function __construct(
        private AccountRepository $repo = new AccountRepository()
    ) {}

    public function list(int $userId, int $page, int $perPage): array
    {
        return $this->repo->allByUser($userId, $page, $perPage);
    }

    public function find(int $id, int $userId): array
    {
        $account = $this->repo->findUserAccount($id, $userId);
        if (!$account) throw new NotFoundException('Conta não encontrada.');
        return $account;
    }

    public function create(int $userId, array $data): array
    {
        $id = $this->repo->create([
            'user_id' => $userId,
            'name'    => sanitize($data['name']),
            'type'    => $data['type'],
            'balance' => $data['balance'] ?? 0,
        ]);
        return $this->repo->findById($id);
    }

    public function update(int $id, int $userId, array $data): array
    {
        $account = $this->repo->findUserAccount($id, $userId);
        if (!$account) throw new NotFoundException('Conta não encontrada.');

        $fields = [];
        if (isset($data['name']))    $fields['name']    = sanitize($data['name']);
        if (isset($data['type']))    $fields['type']    = $data['type'];
        if (isset($data['balance'])) $fields['balance'] = (float) $data['balance'];

        if (!empty($fields)) $this->repo->update($id, $fields);
        return $this->repo->findById($id);
    }

    public function delete(int $id, int $userId): void
    {
        $account = $this->repo->findUserAccount($id, $userId);
        if (!$account) throw new NotFoundException('Conta não encontrada.');
        $this->repo->delete($id);
    }

    public function setDefaultReceiving(int $id, int $userId): void
    {
        $account = $this->repo->findUserAccount($id, $userId);
        if (!$account) throw new NotFoundException('Conta não encontrada.');
        $this->repo->setDefaultReceiving($id, $userId);
    }

    public function summary(int $userId): array
    {
        return [
            'total_balance'  => $this->repo->totalBalanceByUser($userId),
            'balance_by_type'=> $this->repo->balanceByType($userId),
        ];
    }
}
