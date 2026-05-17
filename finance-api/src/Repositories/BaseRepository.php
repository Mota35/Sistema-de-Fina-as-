<?php

namespace App\Repositories;

use PDO;
use App\Config\Database;

abstract class BaseRepository
{
    protected PDO $db;
    protected string $table;
    protected string $primaryKey = 'id';

    public function __construct()
    {
        $this->db = Database::getInstance();
    }

    // ─── Find by PK ──────────────────────────────────────────────────────────
    public function findById(int $id): ?array
    {
        $stmt = $this->db->prepare(
            "SELECT * FROM {$this->table} WHERE {$this->primaryKey} = :id LIMIT 1"
        );
        $stmt->execute([':id' => $id]);
        $result = $stmt->fetch();
        return $result ?: null;
    }

    // ─── Find one by condition ────────────────────────────────────────────────
    public function findBy(string $column, mixed $value): ?array
    {
        $stmt = $this->db->prepare(
            "SELECT * FROM {$this->table} WHERE $column = :value LIMIT 1"
        );
        $stmt->execute([':value' => $value]);
        $result = $stmt->fetch();
        return $result ?: null;
    }

    // ─── Get all with optional filters ───────────────────────────────────────
    public function all(array $conditions = [], ?int $limit = null, ?int $offset = null): array
    {
        $sql    = "SELECT * FROM {$this->table}";
        $params = [];

        if (!empty($conditions)) {
            $clauses = [];
            foreach ($conditions as $col => $val) {
                $clauses[] = "$col = :$col";
                $params[":$col"] = $val;
            }
            $sql .= ' WHERE ' . implode(' AND ', $clauses);
        }

        if ($limit !== null) {
            $sql .= " LIMIT $limit";
        }
        if ($offset !== null) {
            $sql .= " OFFSET $offset";
        }

        $stmt = $this->db->prepare($sql);
        $stmt->execute($params);
        return $stmt->fetchAll();
    }

    // ─── Count ───────────────────────────────────────────────────────────────
    public function count(array $conditions = []): int
    {
        $sql    = "SELECT COUNT(*) FROM {$this->table}";
        $params = [];

        if (!empty($conditions)) {
            $clauses = [];
            foreach ($conditions as $col => $val) {
                $clauses[] = "$col = :$col";
                $params[":$col"] = $val;
            }
            $sql .= ' WHERE ' . implode(' AND ', $clauses);
        }

        $stmt = $this->db->prepare($sql);
        $stmt->execute($params);
        return (int) $stmt->fetchColumn();
    }

    // ─── Insert ───────────────────────────────────────────────────────────────
    public function create(array $data): int
    {
        $columns = implode(', ', array_keys($data));
        $placeholders = implode(', ', array_map(fn($k) => ":$k", array_keys($data)));

        $stmt = $this->db->prepare(
            "INSERT INTO {$this->table} ($columns) VALUES ($placeholders)"
        );

        $params = [];
        foreach ($data as $key => $value) {
            $params[":$key"] = $value;
        }

        $stmt->execute($params);
        return (int) $this->db->lastInsertId();
    }

    // ─── Update ───────────────────────────────────────────────────────────────
    public function update(int $id, array $data): bool
    {
        $sets = implode(', ', array_map(fn($k) => "$k = :$k", array_keys($data)));
        $stmt = $this->db->prepare(
            "UPDATE {$this->table} SET $sets WHERE {$this->primaryKey} = :__id"
        );

        $params = [':__id' => $id];
        foreach ($data as $key => $value) {
            $params[":$key"] = $value;
        }

        $stmt->execute($params);
        return $stmt->rowCount() > 0;
    }

    // ─── Delete ───────────────────────────────────────────────────────────────
    public function delete(int $id): bool
    {
        $stmt = $this->db->prepare(
            "DELETE FROM {$this->table} WHERE {$this->primaryKey} = :id"
        );
        $stmt->execute([':id' => $id]);
        return $stmt->rowCount() > 0;
    }

    // ─── Paginate ─────────────────────────────────────────────────────────────
    public function paginate(array $conditions = [], int $page = 1, int $perPage = 15): array
    {
        $offset = ($page - 1) * $perPage;
        $total  = $this->count($conditions);
        $items  = $this->all($conditions, $perPage, $offset);

        return [
            'items'   => $items,
            'total'   => $total,
            'page'    => $page,
            'perPage' => $perPage,
        ];
    }
}
