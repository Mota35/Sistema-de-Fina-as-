<?php

namespace App\Repositories;

class CategoryRepository extends BaseRepository
{
    protected string $table = 'categories';

    /** Returns global categories (user_id IS NULL) + user's own categories */
    public function allForUser(int $userId, ?string $type = null): array
    {
        $sql  = "SELECT * FROM categories WHERE (user_id = :uid OR user_id IS NULL)";
        $params = [':uid' => $userId];

        if ($type) {
            $sql .= " AND type = :type";
            $params[':type'] = $type;
        }

        $sql .= " ORDER BY user_id IS NULL DESC, name ASC";
        $stmt = $this->db->prepare($sql);
        $stmt->execute($params);
        return $stmt->fetchAll();
    }

    public function findUserCategory(int $id, int $userId): ?array
    {
        $stmt = $this->db->prepare(
            "SELECT * FROM categories WHERE id = :id AND (user_id = :uid OR user_id IS NULL) LIMIT 1"
        );
        $stmt->execute([':id' => $id, ':uid' => $userId]);
        return $stmt->fetch() ?: null;
    }

    public function findOwned(int $id, int $userId): ?array
    {
        $stmt = $this->db->prepare(
            "SELECT * FROM categories WHERE id = :id AND user_id = :uid LIMIT 1"
        );
        $stmt->execute([':id' => $id, ':uid' => $userId]);
        return $stmt->fetch() ?: null;
    }
}
