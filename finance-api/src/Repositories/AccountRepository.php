<?php

namespace App\Repositories;

class AccountRepository extends BaseRepository
{
    protected string $table = 'accounts';

    public function allByUser(int $userId, int $page = 1, int $perPage = 20): array
    {
        $offset = ($page - 1) * $perPage;

        $countStmt = $this->db->prepare("SELECT COUNT(*) FROM accounts WHERE user_id = :uid");
        $countStmt->execute([':uid' => $userId]);
        $total = (int) $countStmt->fetchColumn();

        $stmt = $this->db->prepare(
            "SELECT * FROM accounts WHERE user_id = :uid
             ORDER BY created_at DESC LIMIT :lim OFFSET :off"
        );
        $stmt->bindValue(':uid', $userId, \PDO::PARAM_INT);
        $stmt->bindValue(':lim', $perPage, \PDO::PARAM_INT);
        $stmt->bindValue(':off', $offset,  \PDO::PARAM_INT);
        $stmt->execute();

        return ['items' => $stmt->fetchAll(), 'total' => $total, 'page' => $page, 'perPage' => $perPage];
    }

    public function findUserAccount(int $id, int $userId): ?array
    {
        $stmt = $this->db->prepare(
            "SELECT * FROM accounts WHERE id = :id AND user_id = :uid LIMIT 1"
        );
        $stmt->execute([':id' => $id, ':uid' => $userId]);
        return $stmt->fetch() ?: null;
    }

    public function findDefaultReceiving(int $userId): ?array
    {
        $stmt = $this->db->prepare(
            "SELECT * FROM accounts WHERE user_id = :uid AND is_default_receiving = 1 LIMIT 1"
        );
        $stmt->execute([':uid' => $userId]);
        return $stmt->fetch() ?: null;
    }

    public function setDefaultReceiving(int $id, int $userId): void
    {
        // 1. Unset existing default
        $stmt = $this->db->prepare("UPDATE accounts SET is_default_receiving = 0 WHERE user_id = :uid");
        $stmt->execute([':uid' => $userId]);

        // 2. Set new default
        $stmt = $this->db->prepare("UPDATE accounts SET is_default_receiving = 1 WHERE id = :id AND user_id = :uid");
        $stmt->execute([':id' => $id, ':uid' => $userId]);
    }

    public function findOldestAccount(int $userId): ?array
    {
        $stmt = $this->db->prepare(
            "SELECT * FROM accounts WHERE user_id = :uid ORDER BY created_at ASC LIMIT 1"
        );
        $stmt->execute([':uid' => $userId]);
        return $stmt->fetch() ?: null;
    }

    public function totalBalanceByUser(int $userId): float
    {
        $stmt = $this->db->prepare(
            "SELECT COALESCE(SUM(balance), 0) FROM accounts WHERE user_id = :uid"
        );
        $stmt->execute([':uid' => $userId]);
        return (float) $stmt->fetchColumn();
    }

    public function balanceByType(int $userId): array
    {
        $stmt = $this->db->prepare(
            "SELECT type, COALESCE(SUM(balance), 0) as total
             FROM accounts WHERE user_id = :uid GROUP BY type"
        );
        $stmt->execute([':uid' => $userId]);
        $result = $stmt->fetchAll();
        
        // Ensure total is a float
        foreach ($result as &$row) {
            $row['total'] = (float) $row['total'];
        }
        unset($row);
        
        return $result;
    }
}
