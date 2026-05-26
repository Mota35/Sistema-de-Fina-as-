<?php

namespace App\Config;

use PDO;
use PDOException;
use App\Helpers\Logger;

class Database
{
    private static ?PDO $instance = null;

    private function __construct() {}
    private function __clone() {}

    public static function getInstance(): PDO
    {
        if (self::$instance === null) {
            $config = require CONFIG_PATH . '/database.php';
            $c = $config['connections'][$config['default']];

            $dsn = sprintf(
                '%s:host=%s;port=%s;dbname=%s;charset=%s',
                $c['driver'],
                $c['host'],
                $c['port'],
                $c['database'],
                $c['charset']
            );

            try {
                self::$instance = new PDO($dsn, $c['username'], $c['password'], $c['options']);
            } catch (PDOException $e) {
                $logger = new Logger();
                $logger->critical('Database connection failed: ' . $e->getMessage());
                throw new \RuntimeException('Database connection failed.', 500, $e);
            }
        }

        return self::$instance;
    }
}
