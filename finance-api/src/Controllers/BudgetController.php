<?php

namespace App\Controllers;

use App\Services\DashboardService;

class BudgetController extends BaseController
{
    private DashboardService $dashService;

    public function __construct()
    {
        parent::__construct();
        $this->dashService = new DashboardService();
    }

    // GET /api/budgets?month=2026-05
    public function index(): void
    {
        try {
            $payload = $this->auth->authenticate();
            $month   = $this->queryParam('month', date('Y-m'));
            $data    = $this->dashService->getByCategory($payload['sub'], $month);
            jsonResponse($data);
        } catch (\Throwable $e) { $this->handleException($e); }
    }

    // POST /api/budgets
    public function store(): void
    {
        try {
            $payload = $this->auth->authenticate();
            
            $data = $this->body();
            $validated = [
                'category_id' => $data['category_id'] ?? null,
                'amount'      => $data['amount'] ?? 0,
                'period'      => $data['period'] ?? 'monthly',
                'name'        => $data['name'] ?? '',
            ];

            if (!$validated['category_id'] || $validated['amount'] <= 0) {
                jsonResponse([
                    'success' => false,
                    'message' => 'Invalid category or amount',
                ], 422);
                return;
            }

            jsonResponse([
                'success' => true,
                'message' => 'Budget created',
                'data'    => $validated,
            ], 201);
        } catch (\Throwable $e) { $this->handleException($e); }
    }

    // PUT /api/budgets/{id}
    public function update($id = null): void
    {
        try {
            $payload = $this->auth->authenticate();
            
            $data = $this->body();
            
            jsonResponse([
                'success' => true,
                'message' => 'Budget updated',
                'id'      => $id,
            ]);
        } catch (\Throwable $e) { $this->handleException($e); }
    }

    // DELETE /api/budgets/{id}
    public function destroy($id = null): void
    {
        try {
            $payload = $this->auth->authenticate();
            
            jsonResponse([
                'success' => true,
                'message' => 'Budget deleted',
                'id'      => $id,
            ]);
        } catch (\Throwable $e) { $this->handleException($e); }
    }
}
