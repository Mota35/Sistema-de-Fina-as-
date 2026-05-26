<?php

namespace App\Repositories;

class BudgetRepository extends BaseRepository
{
    protected string $table = 'budgets';

    public function allByUser(int $userId, ?string $month = null): array
    {
        $params = [':uid' => $userId];
        $where  = 'b.user_id = :uid';

        if ($month) {
            $where .= ' AND b.month = :month';
            $params[':month'] = $month;
        }

        $stmt = $this->db->prepare(
            "SELECT
                b.*,
                c.name  AS category_name,
                c.color AS category_color,
                c.icon  AS category_icon,
                COALESCE(
                    (SELECT SUM(t.amount)
                     FROM transactions t
                     WHERE t.user_id   = b.user_id
                       AND t.category_id = b.category_id
                       AND t.type      = 'expense'
                       AND DATE_FORMAT(t.transaction_date, '%Y-%m') = b.month
                    ), 0
                ) AS spent
             FROM budgets b
             LEFT JOIN categories c ON c.id = b.category_id
             WHERE $where
             ORDER BY b.month DESC, c.name ASC"
        );
        $stmt->execute($params);
        $items = $stmt->fetchAll();

        // Add percentage
        foreach ($items as &$item) {
            $item['spent']       = (float) $item['spent'];
            $item['limit_amount']= (float) $item['limit_amount'];
            $item['percentage']  = $item['limit_amount'] > 0
                ? round(($item['spent'] / $item['limit_amount']) * 100, 2)
                : 0;
            $item['remaining']   = max(0, $item['limit_amount'] - $item['spent']);
            $item['over_budget'] = $item['spent'] > $item['limit_amount'];
        }

        return $items;
    }

    public function findUserBudget(int $id, int $userId): ?array
    {
        $stmt = $this->db->prepare(
            "SELECT b.*, c.name AS category_name, c.color AS category_color
             FROM budgets b
             LEFT JOIN categories c ON c.id = b.category_id
             WHERE b.id = :id AND b.user_id = :uid LIMIT 1"
        );
        $stmt->execute([':id' => $id, ':uid' => $userId]);
        return $stmt->fetch() ?: null;
    }

    public function existsForMonth(int $userId, int $categoryId, string $month, ?int $excludeId = null): bool
    {
        $sql    = "SELECT COUNT(*) FROM budgets WHERE user_id = :uid AND category_id = :cid AND month = :month";
        $params = [':uid' => $userId, ':cid' => $categoryId, ':month' => $month];
        if ($excludeId) {
            $sql .= " AND id != :eid";
            $params[':eid'] = $excludeId;
        }
        $stmt = $this->db->prepare($sql);
        $stmt->execute($params);
        return (int) $stmt->fetchColumn() > 0;
    }
}
