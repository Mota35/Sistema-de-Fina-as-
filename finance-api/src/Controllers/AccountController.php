<?php

namespace App\Controllers;

use App\Services\AccountService;

class AccountController extends BaseController
{
    private AccountService $service;

    public function __construct()
    {
        parent::__construct();
        $this->service = new AccountService();
    }

    // GET /api/accounts
    public function index(): void
    {
        try {
            $payload = $this->auth->authenticate();
            [$page, $perPage] = $this->paginationParams();
            $result = $this->service->list($payload['sub'], $page, $perPage);
            paginatedResponse($result['items'], $result['total'], $result['page'], $result['perPage']);
        } catch (\Throwable $e) { $this->handleException($e); }
    }

    // GET /api/accounts/{id}
    public function show(int $id): void
    {
        try {
            $payload = $this->auth->authenticate();
            $account = $this->service->find($id, $payload['sub']);
            jsonResponse($account);
        } catch (\Throwable $e) { $this->handleException($e); }
    }

    // POST /api/accounts
    public function store(): void
    {
        try {
            $payload = $this->auth->authenticate();
            $data    = $this->body();
            $this->validate($data, [
                'name'    => 'required|min:2|max:100',
                'type'    => 'required|in:wallet,bank,savings,credit_card,investment',
                'balance' => 'nullable|numeric',
            ]);
            $account = $this->service->create($payload['sub'], $data);
            jsonResponse($account, 201, 'Conta criada com sucesso.');
        } catch (\Throwable $e) { $this->handleException($e); }
    }

    // PUT /api/accounts/{id}
    public function update(int $id): void
    {
        try {
            $payload = $this->auth->authenticate();
            $data    = $this->body();
            $this->validate($data, [
                'name'    => 'min:2|max:100',
                'type'    => 'in:wallet,bank,savings,credit_card,investment',
                'balance' => 'nullable|numeric',
            ]);
            $account = $this->service->update($id, $payload['sub'], $data);
            jsonResponse($account, 200, 'Conta atualizada com sucesso.');
        } catch (\Throwable $e) { $this->handleException($e); }
    }

    // DELETE /api/accounts/{id}
    public function destroy(int $id): void
    {
        try {
            $payload = $this->auth->authenticate();
            $this->service->delete($id, $payload['sub']);
            jsonResponse(null, 200, 'Conta eliminada com sucesso.');
        } catch (\Throwable $e) { $this->handleException($e); }
    }

    public function setDefaultReceiving(int $id): void
    {
        try {
            $payload = $this->auth->authenticate();
            $this->service->setDefaultReceiving($id, $payload['sub']);
            jsonResponse(null, 200, 'Conta definida como principal para recebimentos.');
        } catch (\Throwable $e) { $this->handleException($e); }
    }

    public function summary(): void
    {
        try {
            $payload = $this->auth->authenticate();
            $data    = $this->service->summary($payload['sub']);
            jsonResponse($data);
        } catch (\Throwable $e) { $this->handleException($e); }
    }
}
