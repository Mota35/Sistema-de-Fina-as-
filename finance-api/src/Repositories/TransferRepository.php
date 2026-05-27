<?php

namespace App\Repositories;

class TransferRepository extends BaseRepository
{
    protected string $table = 'transfers';

    public function allByAccount(int $accountId, int $page = 1, int $perPage = 20): array
    {
        $offset = ($page - 1) * $perPage;
        
        $countStmt = $this->db->prepare(
            "SELECT COUNT(*) FROM transfers 
             WHERE sender_account_id = :aid OR receiver_account_id = :aid"
        );
        $countStmt->execute([':aid' => $accountId]);
        $total = (int) $countStmt->fetchColumn();

        $stmt = $this->db->prepare(
            "SELECT t.*, 
                    su.name as sender_name, su.email as sender_email, su.id_conta as sender_id_conta,
                    ru.name as receiver_name, ru.email as receiver_email, ru.id_conta as receiver_id_conta
             FROM transfers t
             INNER JOIN users su ON su.id = t.sender_id
             INNER JOIN users ru ON ru.id = t.receiver_id
             WHERE t.sender_account_id = :aid OR t.receiver_account_id = :aid
             ORDER BY t.created_at DESC
             LIMIT :lim OFFSET :off"
        );
        $stmt->bindValue(':aid', $accountId, \PDO::PARAM_INT);
        $stmt->bindValue(':lim', $perPage,   \PDO::PARAM_INT);
        $stmt->bindValue(':off', $offset,    \PDO::PARAM_INT);
        $stmt->execute();

        return ['items' => $stmt->fetchAll(), 'total' => $total, 'page' => $page, 'perPage' => $perPage];
    }

    public function getCombinedHistory(int $accountId, int $page = 1, int $perPage = 20): array
    {
        $offset = ($page - 1) * $perPage;

        // Count total (transactions + transfers)
        $qTx = "SELECT COUNT(*) FROM transactions WHERE account_id = :aid";
        $qTf = "SELECT COUNT(*) FROM transfers WHERE sender_account_id = :aid OR receiver_account_id = :aid";
        
        $stmtTx = $this->db->prepare($qTx);
        $stmtTx->execute([':aid' => $accountId]);
        $totalTx = (int) $stmtTx->fetchColumn();

        $stmtTf = $this->db->prepare($qTf);
        $stmtTf->execute([':aid' => $accountId]);
        $totalTf = (int) $stmtTf->fetchColumn();

        $total = $totalTx + $totalTf;

        // Combined query using UNION
        // We need to match columns.
        // Type mapping: 
        // Transactions: income/expense
        // Transfers: 'sent' if sender, 'received' if receiver
        
        $sql = "
            (SELECT 
                t.id, 
                'transaction' as origin,
                t.type, 
                t.amount, 
                t.description, 
                t.transaction_date as date,
                t.created_at,
                NULL as sender_name,
                NULL as receiver_name,
                NULL as sender_id_conta,
                NULL as receiver_id_conta,
                c.name as category_name
             FROM transactions t
             LEFT JOIN categories c ON c.id = t.category_id
             WHERE t.account_id = :aid1)
            UNION ALL
            (SELECT 
                tf.id, 
                'transfer' as origin,
                IF(tf.sender_account_id = :aid2, 'expense', 'income') as type,
                tf.amount, 
                tf.description, 
                DATE(tf.created_at) as date,
                tf.created_at,
                su.name as sender_name,
                ru.name as receiver_name,
                su.id_conta as sender_id_conta,
                ru.id_conta as receiver_id_conta,
                'Transferência' as category_name
             FROM transfers tf
             INNER JOIN users su ON su.id = tf.sender_id
             INNER JOIN users ru ON ru.id = tf.receiver_id
             WHERE tf.sender_account_id = :aid2 OR tf.receiver_account_id = :aid3)
            ORDER BY created_at DESC
            LIMIT :lim OFFSET :off
        ";

        $stmt = $this->db->prepare($sql);
        $stmt->bindValue(':aid1', $accountId, \PDO::PARAM_INT);
        $stmt->bindValue(':aid2', $accountId, \PDO::PARAM_INT);
        $stmt->bindValue(':aid3', $accountId, \PDO::PARAM_INT);
        $stmt->bindValue(':lim',  $perPage,   \PDO::PARAM_INT);
        $stmt->bindValue(':off',  $offset,    \PDO::PARAM_INT);
        $stmt->execute();

        return ['items' => $stmt->fetchAll(), 'total' => $total, 'page' => $page, 'perPage' => $perPage];
    }
}
