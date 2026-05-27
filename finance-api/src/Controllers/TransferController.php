<?php

namespace App\Controllers;

use App\Services\TransferService;

class TransferController extends BaseController
{
    private TransferService $service;

    public function __construct()
    {
        parent::__construct();
        $this->service = new TransferService();
    }

    // POST /api/transfers
    public function store(): void
    {
        try {
            $payload = $this->auth->authenticate();
            $data    = $this->body();
            $this->validate($data, [
                'sender_account_id' => 'required|integer',
                'recipient'         => 'required|string',
                'amount'            => 'required|numeric|min:0.01',
                'description'       => 'nullable|string|max:255',
            ]);
            $transfer = $this->service->transfer($payload['sub'], $data);
            jsonResponse($transfer, 201, 'Transferência realizada com sucesso.');
        } catch (\Throwable $e) { $this->handleException($e); }
    }

    // GET /api/accounts/{id}/history
    public function history(int $accountId): void
    {
        try {
            $payload = $this->auth->authenticate();
            [$page, $perPage] = $this->paginationParams();
            $result = $this->service->history($accountId, $payload['sub'], $page, $perPage);
            paginatedResponse($result['items'], $result['total'], $result['page'], $result['perPage']);
        } catch (\Throwable $e) { $this->handleException($e); }
    }
}
