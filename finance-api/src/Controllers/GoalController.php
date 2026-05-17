<?php

namespace App\Controllers;

use App\Services\GoalService;

class GoalController extends BaseController
{
    private GoalService $service;

    public function __construct()
    {
        parent::__construct();
        $this->service = new GoalService();
    }

    // GET /api/goals
    public function index(): void
    {
        try {
            $payload = $this->auth->authenticate();
            [$page, $perPage] = $this->paginationParams();
            $result = $this->service->list($payload['sub'], $page, $perPage);
            paginatedResponse($result['items'], $result['total'], $result['page'], $result['perPage']);
        } catch (\Throwable $e) { $this->handleException($e); }
    }

    // GET /api/goals/{id}
    public function show(int $id): void
    {
        try {
            $payload = $this->auth->authenticate();
            $goal    = $this->service->find($id, $payload['sub']);
            jsonResponse($goal);
        } catch (\Throwable $e) { $this->handleException($e); }
    }

    // POST /api/goals
    public function store(): void
    {
        try {
            $payload = $this->auth->authenticate();
            $data    = $this->body();
            $this->validate($data, [
                'title'          => 'required|min:2|max:150',
                'target_amount'  => 'required|numeric|min:1',
                'current_amount' => 'nullable|numeric',
                'deadline'       => 'nullable|date',
            ]);
            $goal = $this->service->create($payload['sub'], $data);
            jsonResponse($goal, 201, 'Meta criada com sucesso.');
        } catch (\Throwable $e) { $this->handleException($e); }
    }

    // PUT /api/goals/{id}
    public function update(int $id): void
    {
        try {
            $payload = $this->auth->authenticate();
            $data    = $this->body();
            $this->validate($data, [
                'title'          => 'nullable|min:2|max:150',
                'target_amount'  => 'nullable|numeric|min:1',
                'current_amount' => 'nullable|numeric',
                'deadline'       => 'nullable|date',
            ]);
            $goal = $this->service->update($id, $payload['sub'], $data);
            jsonResponse($goal, 200, 'Meta atualizada com sucesso.');
        } catch (\Throwable $e) { $this->handleException($e); }
    }

    // POST /api/goals/{id}/deposit
    public function deposit(int $id): void
    {
        try {
            $payload = $this->auth->authenticate();
            $data    = $this->body();
            $this->validate($data, ['amount' => 'required|numeric|min:1']);
            $goal = $this->service->deposit($id, $payload['sub'], (float) $data['amount']);
            jsonResponse($goal, 200, 'Depósito realizado com sucesso.');
        } catch (\Throwable $e) { $this->handleException($e); }
    }

    // DELETE /api/goals/{id}
    public function destroy(int $id): void
    {
        try {
            $payload = $this->auth->authenticate();
            $this->service->delete($id, $payload['sub']);
            jsonResponse(null, 200, 'Meta eliminada com sucesso.');
        } catch (\Throwable $e) { $this->handleException($e); }
    }
}
