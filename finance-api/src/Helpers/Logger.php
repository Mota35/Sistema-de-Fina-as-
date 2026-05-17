<?php

namespace App\Helpers;

class Logger
{
    private string $logPath;
    private string $dateFormat = 'Y-m-d H:i:s';

    private const LEVELS = [
        'debug'    => 0,
        'info'     => 1,
        'warning'  => 2,
        'error'    => 3,
        'critical' => 4,
    ];

    public function __construct()
    {
        $this->logPath = STORAGE_PATH . '/logs';
        if (!is_dir($this->logPath)) {
            mkdir($this->logPath, 0755, true);
        }
    }

    public function debug(string $message, array $context = []): void
    {
        $this->write('debug', $message, $context);
    }

    public function info(string $message, array $context = []): void
    {
        $this->write('info', $message, $context);
    }

    public function warning(string $message, array $context = []): void
    {
        $this->write('warning', $message, $context);
    }

    public function error(string $message, array $context = []): void
    {
        $this->write('error', $message, $context);
    }

    public function critical(string $message, array $context = []): void
    {
        $this->write('critical', $message, $context);
    }

    private function write(string $level, string $message, array $context = []): void
    {
        $configuredLevel = env('LOG_LEVEL', 'debug');
        if ((self::LEVELS[$level] ?? 0) < (self::LEVELS[$configuredLevel] ?? 0)) {
            return;
        }

        $filename = $this->logPath . '/' . date('Y-m-d') . '.log';
        $contextStr = empty($context) ? '' : ' ' . json_encode($context, JSON_UNESCAPED_UNICODE);

        $line = sprintf(
            "[%s] %s.%s: %s%s\n",
            date($this->dateFormat),
            env('APP_NAME', 'API'),
            strtoupper($level),
            $message,
            $contextStr
        );

        file_put_contents($filename, $line, FILE_APPEND | LOCK_EX);
    }

    public function logRequest(string $method, string $uri, int $statusCode, float $duration): void
    {
        $ip = $_SERVER['REMOTE_ADDR'] ?? 'unknown';
        $userAgent = $_SERVER['HTTP_USER_AGENT'] ?? 'unknown';

        $this->info("[$method] $uri → $statusCode ({$duration}ms)", [
            'ip'         => $ip,
            'user_agent' => $userAgent,
        ]);
    }
}
