<?php

namespace App\Repositories;

class TransactionRepository extends BaseRepository
{
    protected string $table = 'transactions';

    public function allByUser(int $userId, array $filters = [], int $page = 1, int $perPage = 20): array
    {
        $offset = ($page - 1) * $perPage;
        $params = [':uid' => $userId];
        $where  = ['t.user_id = :uid'];

        if (!empty($filters['account_id'])) {
            $where[] = 't.account_id = :account_id';
            $params[':account_id'] = $filters['account_id'];
        }
        if (!empty($filters['category_id'])) {
            $where[] = 't.category_id = :category_id';
            $params[':category_id'] = $filters['category_id'];
        }
        if (!empty($filters['type'])) {
            $where[] = 't.type = :type';
            $params[':type'] = $filters['type'];
        }
        if (!empty($filters['date_from'])) {
            $where[] = 't.transaction_date >= :date_from';
            $params[':date_from'] = $filters['date_from'];
        }
        if (!empty($filters['date_to'])) {
            $where[] = 't.transaction_date <= :date_to';
            $params[':date_to'] = $filters['date_to'];
        }
        if (!empty($filters['search'])) {
            $where[] = 't.description LIKE :search';
            $params[':search'] = '%' . $filters['search'] . '%';
        }

        $whereClause = 'WHERE ' . implode(' AND ', $where);

        $countStmt = $this->db->prepare("SELECT COUNT(*) FROM transactions t $whereClause");
        $countStmt->execute($params);
        $total = (int) $countStmt->fetchColumn();

        $params[':lim'] = $perPage;
        $params[':off'] = $offset;

        $stmt = $this->db->prepare(
            "SELECT t.*,
                    a.name  AS account_name,
                    c.name  AS category_name,
                    c.color AS category_color,
                    c.icon  AS category_icon
             FROM transactions t
             LEFT JOIN accounts   a ON a.id = t.account_id
             LEFT JOIN categories c ON c.id = t.category_id
             $whereClause
             ORDER BY t.transaction_date DESC, t.created_at DESC
             LIMIT :lim OFFSET :off"
        );
        $stmt->bindValue(':lim', $perPage, \PDO::PARAM_INT);
        $stmt->bindValue(':off', $offset,  \PDO::PARAM_INT);
        foreach ($params as $k => $v) {
            if ($k !== ':lim' && $k !== ':off') $stmt->bindValue($k, $v);
        }
        $stmt->execute();

        return ['items' => $stmt->fetchAll(), 'total' => $total, 'page' => $page, 'perPage' => $perPage];
    }

    public function findUserTransaction(int $id, int $userId): ?array
    {
        $stmt = $this->db->prepare(
            "SELECT t.*,
                    a.name  AS account_name,
                    c.name  AS category_name,
                    c.color AS category_color,
                    c.icon  AS category_icon
             FROM transactions t
             LEFT JOIN accounts   a ON a.id = t.account_id
             LEFT JOIN categories c ON c.id = t.category_id
             WHERE t.id = :id AND t.user_id = :uid LIMIT 1"
        );
        $stmt->execute([':id' => $id, ':uid' => $userId]);
        return $stmt->fetch() ?: null;
    }

    public function summaryByMonth(int $userId, int $year, int $month): array
    {
        // 1. Transactions summary
        $stmt = $this->db->prepare(
            "SELECT
                type,
                COALESCE(SUM(amount), 0)   AS total,
                COUNT(*)                   AS count
             FROM transactions
             WHERE user_id = :uid
               AND YEAR(transaction_date)  = :year
               AND MONTH(transaction_date) = :month
             GROUP BY type"
        );
        $stmt->execute([':uid' => $userId, ':year' => $year, ':month' => $month]);
        $txSummary = $stmt->fetchAll();

        // 2. Transfers summary
        // Outgoing transfers are 'expense'
        $stmtOut = $this->db->prepare(
            "SELECT COALESCE(SUM(amount), 0) as total, COUNT(*) as count 
             FROM transfers 
             WHERE sender_id = :uid AND YEAR(created_at) = :year AND MONTH(created_at) = :month"
        );
        $stmtOut->execute([':uid' => $userId, ':year' => $year, ':month' => $month]);
        $out = $stmtOut->fetch();

        // Incoming transfers are 'income'
        $stmtIn = $this->db->prepare(
            "SELECT COALESCE(SUM(amount), 0) as total, COUNT(*) as count 
             FROM transfers 
             WHERE receiver_id = :uid AND YEAR(created_at) = :year AND MONTH(created_at) = :month"
        );
        $stmtIn->execute([':uid' => $userId, ':year' => $year, ':month' => $month]);
        $in = $stmtIn->fetch();

        // Merge results
        $summary = ['income' => ['total' => 0, 'count' => 0], 'expense' => ['total' => 0, 'count' => 0]];
        foreach ($txSummary as $row) {
            $summary[$row['type']]['total'] += (float)$row['total'];
            $summary[$row['type']]['count'] += (int)$row['count'];
        }

        $summary['income']['total']  += (float)$in['total'];
        $summary['income']['count']  += (int)$in['count'];
        $summary['expense']['total'] += (float)$out['total'];
        $summary['expense']['count'] += (int)$out['count'];

        // Format for backward compatibility if needed, though most places expect the list
        return [
            ['type' => 'income',  'total' => $summary['income']['total'],  'count' => $summary['income']['count']],
            ['type' => 'expense', 'total' => $summary['expense']['total'], 'count' => $summary['expense']['count']]
        ];
    }

    public function summaryByCategory(int $userId, string $type, ?string $dateFrom = null, ?string $dateTo = null): array
    {
        $params = [':uid' => $userId, ':type' => $type];
        $extra  = '';
        if ($dateFrom) { $extra .= ' AND t.transaction_date >= :df'; $params[':df'] = $dateFrom; }
        if ($dateTo)   { $extra .= ' AND t.transaction_date <= :dt'; $params[':dt'] = $dateTo;   }

        $stmt = $this->db->prepare(
            "SELECT c.id, c.name, c.color, c.icon,
                    COALESCE(SUM(t.amount), 0) AS total,
                    COUNT(t.id) AS count
             FROM transactions t
             INNER JOIN categories c ON c.id = t.category_id
             WHERE t.user_id = :uid AND t.type = :type $extra
             GROUP BY c.id ORDER BY total DESC"
        );
        $stmt->execute($params);
        return $stmt->fetchAll();
    }

    public function monthlyEvolution(int $userId, int $months = 12): array
    {
        // 1. Transactions evolution
        $stmt = $this->db->prepare(
            "SELECT
                DATE_FORMAT(transaction_date, '%Y-%m') AS month,
                type,
                COALESCE(SUM(amount), 0) AS total
             FROM transactions
             WHERE user_id = :uid
               AND transaction_date >= DATE_SUB(CURDATE(), INTERVAL :months MONTH)
             GROUP BY month, type"
        );
        $stmt->bindValue(':uid',    $userId, \PDO::PARAM_INT);
        $stmt->bindValue(':months', $months, \PDO::PARAM_INT);
        $stmt->execute();
        $txRows = $stmt->fetchAll();

        // 2. Outgoing transfers evolution
        $stmtOut = $this->db->prepare(
            "SELECT 
                DATE_FORMAT(created_at, '%Y-%m') AS month,
                'expense' as type,
                COALESCE(SUM(amount), 0) AS total
             FROM transfers
             WHERE sender_id = :uid
               AND created_at >= DATE_SUB(CURDATE(), INTERVAL :months MONTH)
             GROUP BY month"
        );
        $stmtOut->bindValue(':uid',    $userId, \PDO::PARAM_INT);
        $stmtOut->bindValue(':months', $months, \PDO::PARAM_INT);
        $stmtOut->execute();
        $outRows = $stmtOut->fetchAll();

        // 3. Incoming transfers evolution
        $stmtIn = $this->db->prepare(
            "SELECT 
                DATE_FORMAT(created_at, '%Y-%m') AS month,
                'income' as type,
                COALESCE(SUM(amount), 0) AS total
             FROM transfers
             WHERE receiver_id = :uid
               AND created_at >= DATE_SUB(CURDATE(), INTERVAL :months MONTH)
             GROUP BY month"
        );
        $stmtIn->bindValue(':uid',    $userId, \PDO::PARAM_INT);
        $stmtIn->bindValue(':months', $months, \PDO::PARAM_INT);
        $stmtIn->execute();
        $inRows = $stmtIn->fetchAll();

        // Merge results
        $evolution = [];
        foreach (array_merge($txRows, $outRows, $inRows) as $row) {
            $m = $row['month'];
            $t = $row['type'];
            $evolution[$m] ??= ['month' => $m, 'income' => 0.0, 'expense' => 0.0];
            if ($t === 'income')  $evolution[$m]['income']  += (float)$row['total'];
            if ($t === 'expense') $evolution[$m]['expense'] += (float)$row['total'];
        }

        // Reformat for output
        $final = [];
        foreach ($evolution as $m => $data) {
            $final[] = ['month' => $m, 'type' => 'income',  'total' => $data['income']];
            $final[] = ['month' => $m, 'type' => 'expense', 'total' => $data['expense']];
        }

        usort($final, fn($a, $b) => strcmp($a['month'], $b['month']));

        return $final;
    }

    public function recentByUser(int $userId, int $limit = 5): array
    {
        $stmt = $this->db->prepare(
            "SELECT t.*, c.name AS category_name, c.color AS category_color, c.icon AS category_icon,
                    a.name AS account_name
             FROM transactions t
             LEFT JOIN categories c ON c.id = t.category_id
             LEFT JOIN accounts   a ON a.id = t.account_id
             WHERE t.user_id = :uid
             ORDER BY t.transaction_date DESC, t.created_at DESC
             LIMIT :lim"
        );
        $stmt->bindValue(':uid', $userId, \PDO::PARAM_INT);
        $stmt->bindValue(':lim', $limit,  \PDO::PARAM_INT);
        $stmt->execute();
        return $stmt->fetchAll();
    }
}
