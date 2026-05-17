<?php

namespace App\Repositories;

class GoalRepository extends BaseRepository
{
    protected string $table = 'goals';

    public function allByUser(int $userId, int $page = 1, int $perPage = 20): array
    {
        $offset = ($page - 1) * $perPage;

        $countStmt = $this->db->prepare("SELECT COUNT(*) FROM goals WHERE user_id = :uid");
        $countStmt->execute([':uid' => $userId]);
        $total = (int) $countStmt->fetchColumn();

        $stmt = $this->db->prepare(
            "SELECT *,
                ROUND((current_amount / NULLIF(target_amount,0)) * 100, 2) AS progress_pct
             FROM goals
             WHERE user_id = :uid
             ORDER BY deadline IS NULL, deadline ASC
             LIMIT :lim OFFSET :off"
        );
        $stmt->bindValue(':uid', $userId, \PDO::PARAM_INT);
        $stmt->bindValue(':lim', $perPage, \PDO::PARAM_INT);
        $stmt->bindValue(':off', $offset,  \PDO::PARAM_INT);
        $stmt->execute();

        return ['items' => $stmt->fetchAll(), 'total' => $total, 'page' => $page, 'perPage' => $perPage];
    }

    public function findUserGoal(int $id, int $userId): ?array
    {
        $stmt = $this->db->prepare(
            "SELECT *,
                ROUND((current_amount / NULLIF(target_amount,0)) * 100, 2) AS progress_pct
             FROM goals WHERE id = :id AND user_id = :uid LIMIT 1"
        );
        $stmt->execute([':id' => $id, ':uid' => $userId]);
        return $stmt->fetch() ?: null;
    }

    public function addAmount(int $id, float $amount): bool
    {
        $stmt = $this->db->prepare(
            "UPDATE goals
             SET current_amount = LEAST(current_amount + :amt, target_amount)
             WHERE id = :id"
        );
        $stmt->execute([':amt' => $amount, ':id' => $id]);
        return $stmt->rowCount() > 0;
    }
}
