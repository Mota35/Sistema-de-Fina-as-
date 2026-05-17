<?php

namespace App\Repositories;

class UserRepository extends BaseRepository
{
    protected string $table = 'users';

    public function findByEmail(string $email): ?array
    {
        $stmt = $this->db->prepare(
            "SELECT u.*, r.name as role_name
             FROM users u
             INNER JOIN roles r ON r.id = u.role_id
             WHERE u.email = :email LIMIT 1"
        );
        $stmt->execute([':email' => $email]);
        $result = $stmt->fetch();
        return $result ?: null;
    }

    public function findWithRole(int $id): ?array
    {
        $stmt = $this->db->prepare(
            "SELECT u.*, r.name as role_name
             FROM users u
             INNER JOIN roles r ON r.id = u.role_id
             WHERE u.id = :id LIMIT 1"
        );
        $stmt->execute([':id' => $id]);
        $result = $stmt->fetch();
        return $result ?: null;
    }

    public function emailExists(string $email, ?int $excludeId = null): bool
    {
        $sql    = "SELECT COUNT(*) FROM users WHERE email = :email";
        $params = [':email' => $email];
        if ($excludeId) {
            $sql .= " AND id != :id";
            $params[':id'] = $excludeId;
        }
        $stmt = $this->db->prepare($sql);
        $stmt->execute($params);
        return (int) $stmt->fetchColumn() > 0;
    }

    public function storeResetToken(int $userId, string $token, string $expiresAt): bool
    {
        // Store in a dedicated column (we reuse avatar slot via a tokens table approach)
        $stmt = $this->db->prepare(
            "UPDATE users
             SET reset_token = :token, reset_token_expires = :expires
             WHERE id = :id"
        );
        // Graceful fallback if columns don't exist yet
        try {
            $stmt->execute([':token' => $token, ':expires' => $expiresAt, ':id' => $userId]);
            return true;
        } catch (\PDOException) {
            return false;
        }
    }

    public function findByResetToken(string $token): ?array
    {
        $stmt = $this->db->prepare(
            "SELECT * FROM users
             WHERE reset_token = :token
               AND reset_token_expires > NOW()
             LIMIT 1"
        );
        try {
            $stmt->execute([':token' => $token]);
            $result = $stmt->fetch();
            return $result ?: null;
        } catch (\PDOException) {
            return null;
        }
    }

    public function clearResetToken(int $userId): void
    {
        $stmt = $this->db->prepare(
            "UPDATE users SET reset_token = NULL, reset_token_expires = NULL WHERE id = :id"
        );
        try { $stmt->execute([':id' => $userId]); } catch (\PDOException) {}
    }

    public function listAll(int $page, int $perPage, ?string $search = null): array
    {
        $offset = ($page - 1) * $perPage;
        $params = [];
        $where  = '';

        if ($search) {
            $where = "WHERE u.name LIKE :search OR u.email LIKE :search";
            $params[':search'] = "%$search%";
        }

        $total = (int) $this->db->prepare(
            "SELECT COUNT(*) FROM users u $where"
        )->execute($params) ? $this->db->query("SELECT COUNT(*) FROM users u $where")->fetchColumn() : 0;

        // Re-execute with params
        $countStmt = $this->db->prepare("SELECT COUNT(*) FROM users u $where");
        $countStmt->execute($params);
        $total = (int) $countStmt->fetchColumn();

        $params[':limit']  = $perPage;
        $params[':offset'] = $offset;

        $stmt = $this->db->prepare(
            "SELECT u.id, u.name, u.email, u.avatar, u.language, u.theme,
                    u.currency, u.status, u.created_at, r.name as role_name
             FROM users u
             INNER JOIN roles r ON r.id = u.role_id
             $where
             ORDER BY u.created_at DESC
             LIMIT :limit OFFSET :offset"
        );
        $stmt->bindValue(':limit',  $perPage, \PDO::PARAM_INT);
        $stmt->bindValue(':offset', $offset,  \PDO::PARAM_INT);
        if ($search) $stmt->bindValue(':search', "%$search%");
        $stmt->execute();

        return ['items' => $stmt->fetchAll(), 'total' => $total, 'page' => $page, 'perPage' => $perPage];
    }
}
