<?php

namespace App\Controllers;

use App\Services\CategoryService;

class CategoryController extends BaseController
{
    private CategoryService $service;

    public function __construct()
    {
        parent::__construct();
        $this->service = new CategoryService();
    }

    // GET /api/categories
    public function index(): void
    {
        try {
            $payload = $this->auth->authenticate();
            $type    = $this->queryParam('type');
            $items   = $this->service->list($payload['sub'], $type ?: null);
            jsonResponse($items);
        } catch (\Throwable $e) { $this->handleException($e); }
    }

    // GET /api/categories/{id}
    public function show(int $id): void
    {
        try {
            $payload  = $this->auth->authenticate();
            $category = $this->service->find($id, $payload['sub']);
            jsonResponse($category);
        } catch (\Throwable $e) { $this->handleException($e); }
    }

    // POST /api/categories
    public function store(): void
    {
        try {
            $payload = $this->auth->authenticate();
            $data    = $this->body();
            $this->validate($data, [
                'name'  => 'required|min:2|max:100',
                'type'  => 'required|in:income,expense',
                'color' => 'nullable|max:20',
                'icon'  => 'nullable|max:100',
            ]);
            $category = $this->service->create($payload['sub'], $data);
            jsonResponse($category, 201, 'Categoria criada com sucesso.');
        } catch (\Throwable $e) { $this->handleException($e); }
    }

    // PUT /api/categories/{id}
    public function update(int $id): void
    {
        try {
            $payload = $this->auth->authenticate();
            $data    = $this->body();
            $this->validate($data, [
                'name'  => 'min:2|max:100',
                'type'  => 'in:income,expense',
                'color' => 'nullable|max:20',
                'icon'  => 'nullable|max:100',
            ]);
            $category = $this->service->update($id, $payload['sub'], $data);
            jsonResponse($category, 200, 'Categoria atualizada com sucesso.');
        } catch (\Throwable $e) { $this->handleException($e); }
    }

    // DELETE /api/categories/{id}
    public function destroy(int $id): void
    {
        try {
            $payload = $this->auth->authenticate();
            $this->service->delete($id, $payload['sub']);
            jsonResponse(null, 200, 'Categoria eliminada com sucesso.');
        } catch (\Throwable $e) { $this->handleException($e); }
    }
}
