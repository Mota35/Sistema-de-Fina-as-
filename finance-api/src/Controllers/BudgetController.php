<?php

namespace App\Controllers;

use App\Services\BudgetService;

class BudgetController extends BaseController
{
    private BudgetService $service;

    public function __construct()
    {
        parent::__construct();
        $this->service = new BudgetService();
    }

    // GET /api/budgets?month=2026-05
    public function index(): void
    {
        try {
            $payload = $this->auth->authenticate();
            $month   = $this->queryParam('month');
            $items   = $this->service->list($payload['sub'], $month ?: null);
            jsonResponse($items);
        } catch (\Throwable $e) { $this->handleException($e); }
    }

    // GET /api/budgets/{id}
    public function show(int $id): void
    {
        try {
            $payload = $this->auth->authenticate();
            $budget  = $this->service->find($id, $payload['sub']);
            jsonResponse($budget);
        } catch (\Throwable $e) { $this->handleException($e); }
    }

    // POST /api/budgets
    public function store(): void
    {
        try {
            $payload = $this->auth->authenticate();
            $data    = $this->body();
            $this->validate($data, [
                'category_id'  => 'required|integer',
                'limit_amount' => 'required|numeric|min:1',
                'month'        => 'nullable|string',
            ]);
            $budget = $this->service->create($payload['sub'], $data);
            jsonResponse($budget, 201, 'Orçamento criado com sucesso.');
        } catch (\Throwable $e) { $this->handleException($e); }
    }

    // PUT /api/budgets/{id}
    public function update(int $id): void
    {
        try {
            $payload = $this->auth->authenticate();
            $data    = $this->body();
            $this->validate($data, [
                'category_id'  => 'nullable|integer',
                'limit_amount' => 'nullable|numeric|min:1',
                'month'        => 'nullable|string',
            ]);
            $budget = $this->service->update($id, $payload['sub'], $data);
            jsonResponse($budget, 200, 'Orçamento atualizado com sucesso.');
        } catch (\Throwable $e) { $this->handleException($e); }
    }

    // DELETE /api/budgets/{id}
    public function destroy(int $id): void
    {
        try {
            $payload = $this->auth->authenticate();
            $this->service->delete($id, $payload['sub']);
            jsonResponse(null, 200, 'Orçamento eliminado com sucesso.');
        } catch (\Throwable $e) { $this->handleException($e); }
    }
}
