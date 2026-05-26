<?php

namespace App\Controllers;

use App\Services\TransactionService;

class TransactionController extends BaseController
{
    private TransactionService $service;

    public function __construct()
    {
        parent::__construct();
        $this->service = new TransactionService();
    }

    // GET /api/transactions
    public function index(): void
    {
        try {
            $payload = $this->auth->authenticate();
            [$page, $perPage] = $this->paginationParams();

            $filters = [
                'account_id'  => $this->queryParam('account_id'),
                'category_id' => $this->queryParam('category_id'),
                'type'        => $this->queryParam('type'),
                'date_from'   => $this->queryParam('date_from'),
                'date_to'     => $this->queryParam('date_to'),
                'search'      => $this->queryParam('search'),
            ];

            $result = $this->service->list($payload['sub'], array_filter($filters), $page, $perPage);
            paginatedResponse($result['items'], $result['total'], $result['page'], $result['perPage']);
        } catch (\Throwable $e) { $this->handleException($e); }
    }

    // GET /api/transactions/{id}
    public function show(int $id): void
    {
        try {
            $payload     = $this->auth->authenticate();
            $transaction = $this->service->find($id, $payload['sub']);
            jsonResponse($transaction);
        } catch (\Throwable $e) { $this->handleException($e); }
    }

    // POST /api/transactions
    public function store(): void
    {
        try {
            $payload = $this->auth->authenticate();
            $data    = $this->body();
            $this->validate($data, [
                'account_id'       => 'required|integer',
                'category_id'      => 'required|integer',
                'type'             => 'required|in:income,expense',
                'amount'           => 'required|numeric|min:0',
                'transaction_date' => 'required|date',
                'description'      => 'nullable|max:500',
                'recurring'        => 'nullable|boolean',
            ]);
            $tx = $this->service->create($payload['sub'], $data);
            jsonResponse($tx, 201, 'Transação registada com sucesso.');
        } catch (\Throwable $e) { $this->handleException($e); }
    }

    // PUT /api/transactions/{id}
    public function update(int $id): void
    {
        try {
            $payload = $this->auth->authenticate();
            $data    = $this->body();
            $this->validate($data, [
                'account_id'       => 'nullable|integer',
                'category_id'      => 'nullable|integer',
                'type'             => 'nullable|in:income,expense',
                'amount'           => 'nullable|numeric|min:0',
                'transaction_date' => 'nullable|date',
                'description'      => 'nullable|max:500',
                'recurring'        => 'nullable|boolean',
            ]);
            $tx = $this->service->update($id, $payload['sub'], $data);
            jsonResponse($tx, 200, 'Transação atualizada com sucesso.');
        } catch (\Throwable $e) { $this->handleException($e); }
    }

    // DELETE /api/transactions/{id}
    public function destroy(int $id): void
    {
        try {
            $payload = $this->auth->authenticate();
            $this->service->delete($id, $payload['sub']);
            jsonResponse(null, 200, 'Transação eliminada com sucesso.');
        } catch (\Throwable $e) { $this->handleException($e); }
    }

    // GET /api/transactions/summary?year=2024&month=5
    public function summary(): void
    {
        try {
            $payload = $this->auth->authenticate();
            $year    = (int) $this->queryParam('year',  date('Y'));
            $month   = (int) $this->queryParam('month', date('n'));
            $data    = $this->service->summary($payload['sub'], $year, $month);
            jsonResponse($data);
        } catch (\Throwable $e) { $this->handleException($e); }
    }

    // GET /api/transactions/by-category?type=expense&date_from=...&date_to=...
    public function byCategory(): void
    {
        try {
            $payload = $this->auth->authenticate();
            $type    = $this->queryParam('type', 'expense');
            $from    = $this->queryParam('date_from');
            $to      = $this->queryParam('date_to');
            $data    = $this->service->byCategory($payload['sub'], $type, $from ?: null, $to ?: null);
            jsonResponse($data);
        } catch (\Throwable $e) { $this->handleException($e); }
    }

    // GET /api/transactions/evolution?months=12
    public function evolution(): void
    {
        try {
            $payload = $this->auth->authenticate();
            $months  = (int) $this->queryParam('months', 12);
            $data    = $this->service->evolution($payload['sub'], $months);
            jsonResponse($data);
        } catch (\Throwable $e) { $this->handleException($e); }
    }
}
