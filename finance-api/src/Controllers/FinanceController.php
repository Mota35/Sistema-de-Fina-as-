<?php

namespace App\Controllers;

use App\Services\ExternalApiService;

class FinanceController extends BaseController
{
    private ExternalApiService $service;

    public function __construct()
    {
        parent::__construct();
        $this->service = new ExternalApiService();
    }

    // GET /api/exchange/rates?base=AOA
    public function exchangeRates(): void
    {
        try {
            $this->auth->authenticate();
            $base = strtoupper($this->queryParam('base', 'AOA'));
            $data = $this->service->getExchangeRates($base);
            jsonResponse($data);
        } catch (\Throwable $e) { $this->handleException($e); }
    }

    // GET /api/exchange/convert?from=USD&to=AOA&amount=100
    public function convertCurrency(): void
    {
        try {
            $this->auth->authenticate();
            $from   = strtoupper($this->queryParam('from', 'USD'));
            $to     = strtoupper($this->queryParam('to', 'AOA'));
            $amount = (float) $this->queryParam('amount', 1);
            $data   = $this->service->convertCurrency($from, $to, $amount);
            jsonResponse($data);
        } catch (\Throwable $e) { $this->handleException($e); }
    }

    // GET /api/finance/quotes?symbols=AAPL,MSFT
    public function stockQuotes(): void
    {
        try {
            $this->auth->authenticate();
            $symbolsStr = $this->queryParam('symbols', 'AAPL,MSFT,GOOGL');
            $symbols    = array_slice(explode(',', $symbolsStr), 0, 10); // max 10
            $data       = $this->service->getStockQuotes($symbols);
            jsonResponse($data);
        } catch (\Throwable $e) { $this->handleException($e); }
    }

    // GET /api/finance/market
    public function marketSummary(): void
    {
        try {
            $this->auth->authenticate();
            $data = $this->service->getMarketSummary();
            jsonResponse($data);
        } catch (\Throwable $e) { $this->handleException($e); }
    }

    // GET /api/finance/crypto?symbols=BTC,ETH
    public function cryptoPrices(): void
    {
        try {
            $this->auth->authenticate();
            $symbolsStr = $this->queryParam('symbols', 'BTC,ETH,BNB');
            $symbols    = array_slice(explode(',', $symbolsStr), 0, 10);
            $data       = $this->service->getCryptoPrices($symbols);
            jsonResponse($data);
        } catch (\Throwable $e) { $this->handleException($e); }
    }
}
