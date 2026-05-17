<?php

namespace App\Controllers;

use App\Services\DashboardService;
use App\Services\TransactionService;
use App\Services\ExternalApiService;

class DashboardController extends BaseController
{
    private DashboardService  $dashService;
    private TransactionService $txService;
    private ExternalApiService $externalService;

    public function __construct()
    {
        parent::__construct();
        $this->dashService     = new DashboardService();
        $this->txService       = new TransactionService();
        $this->externalService = new ExternalApiService();
    }

    // GET /api/dashboard
    public function index(): void
    {
        try {
            $payload = $this->auth->authenticate();
            $data    = $this->dashService->getSummary($payload['sub']);
            jsonResponse($data);
        } catch (\Throwable $e) { $this->handleException($e); }
    }

    // GET /api/dashboard/forecast?months=3
    public function forecast(): void
    {
        try {
            $payload      = $this->auth->authenticate();
            $months       = (int) $this->queryParam('months', 3);
            $evolution    = $this->txService->evolution($payload['sub'], 12);
            $forecastData = $this->externalService->generateForecast($evolution, $months);
            jsonResponse($forecastData);
        } catch (\Throwable $e) { $this->handleException($e); }
    }

    // GET /api/dashboard/summary?month=2026-05
    public function summary(): void
    {
        try {
            $payload = $this->auth->authenticate();
            $month   = $this->queryParam('month', date('Y-m'));
            $data    = $this->dashService->getMonthSummary($payload['sub'], $month);
            jsonResponse($data);
        } catch (\Throwable $e) { $this->handleException($e); }
    }

    // GET /api/dashboard/evolution?months=12
    public function evolution(): void
    {
        try {
            $payload = $this->auth->authenticate();
            $months  = (int) $this->queryParam('months', 12);
            $data    = $this->txService->evolution($payload['sub'], $months);
            jsonResponse($data);
        } catch (\Throwable $e) { $this->handleException($e); }
    }

    // GET /api/dashboard/by-category?month=2026-05
    public function byCategory(): void
    {
        try {
            $payload = $this->auth->authenticate();
            $month   = $this->queryParam('month', date('Y-m'));
            $data    = $this->dashService->getByCategory($payload['sub'], $month);
            jsonResponse($data);
        } catch (\Throwable $e) { $this->handleException($e); }
    }
}
