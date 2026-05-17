<?php

namespace App\Services;

use App\Helpers\Logger;

/**
 * ExternalApiService
 * Integrates: ExchangeRate-API (forex) + Financial Modeling Prep (stocks/quotes)
 */
class ExternalApiService
{
    private Logger $logger;
    private string $exchangeApiKey;
    private string $exchangeBaseUrl;
    private string $fmpApiKey;
    private string $fmpBaseUrl = 'https://financialmodelingprep.com/api/v3';

    public function __construct()
    {
        $this->logger          = new Logger();
        $this->exchangeApiKey  = env('EXCHANGE_RATE_API_KEY', '');
        $this->exchangeBaseUrl = env('EXCHANGE_RATE_BASE_URL', 'https://v6.exchangerate-api.com/v6');
        $this->fmpApiKey       = env('FMP_API_KEY', '');
    }

    // ─── 1. Live Exchange Rates ───────────────────────────────────────────────
    /**
     * GET /api/exchange/rates?base=AOA
     * Returns all exchange rates from a base currency.
     */
    public function getExchangeRates(string $base = 'AOA'): array
    {
        $cacheKey  = "exchange_rates_{$base}";
        $cached    = $this->getCache($cacheKey);
        if ($cached) return $cached;

        $url  = "{$this->exchangeBaseUrl}/{$this->exchangeApiKey}/latest/{$base}";
        $data = $this->httpGet($url);

        if (($data['result'] ?? '') !== 'success') {
            // Fallback: return demo rates
            return $this->fallbackRates($base);
        }

        $result = [
            'base'       => $base,
            'date'       => $data['time_last_update_utc'] ?? now(),
            'rates'      => $data['conversion_rates'] ?? [],
            'next_update'=> $data['time_next_update_utc'] ?? null,
        ];

        $this->setCache($cacheKey, $result, 3600); // cache 1h
        return $result;
    }

    /**
     * GET /api/exchange/convert?from=USD&to=AOA&amount=100
     */
    public function convertCurrency(string $from, string $to, float $amount): array
    {
        $cacheKey = "exchange_pair_{$from}_{$to}";
        $cached   = $this->getCache($cacheKey);

        $rate = null;
        if ($cached) {
            $rate = $cached['rate'];
        } else {
            $url  = "{$this->exchangeBaseUrl}/{$this->exchangeApiKey}/pair/{$from}/{$to}";
            $data = $this->httpGet($url);

            if (($data['result'] ?? '') === 'success') {
                $rate = (float) $data['conversion_rate'];
                $this->setCache($cacheKey, ['rate' => $rate], 3600);
            }
        }

        if (!$rate) {
            $rate = $this->fallbackRate($from, $to);
        }

        return [
            'from'           => $from,
            'to'             => $to,
            'amount'         => $amount,
            'rate'           => $rate,
            'converted'      => round($amount * $rate, 2),
            'formatted'      => number_format($amount * $rate, 2, ',', '.') . ' ' . $to,
        ];
    }

    // ─── 2. Stock Quotes (Financial Modeling Prep) ────────────────────────────
    /**
     * GET /api/finance/quotes?symbols=AAPL,MSFT,GOOGL
     */
    public function getStockQuotes(array $symbols): array
    {
        if (empty($this->fmpApiKey)) {
            return $this->fallbackStockQuotes($symbols);
        }

        $symbolStr = implode(',', array_map('strtoupper', $symbols));
        $cacheKey  = 'quotes_' . md5($symbolStr);
        $cached    = $this->getCache($cacheKey);
        if ($cached) return $cached;

        $url  = "{$this->fmpBaseUrl}/quote/{$symbolStr}?apikey={$this->fmpApiKey}";
        $data = $this->httpGet($url);

        if (!is_array($data) || empty($data)) {
            return $this->fallbackStockQuotes($symbols);
        }

        $result = array_map(fn($q) => [
            'symbol'         => $q['symbol']        ?? '',
            'name'           => $q['name']           ?? '',
            'price'          => $q['price']          ?? 0,
            'change'         => $q['change']         ?? 0,
            'change_percent' => $q['changesPercentage'] ?? 0,
            'volume'         => $q['volume']         ?? 0,
            'market_cap'     => $q['marketCap']      ?? 0,
            'currency'       => 'USD',
            'updated_at'     => now(),
        ], $data);

        $this->setCache($cacheKey, $result, 300); // cache 5min
        return $result;
    }

    /**
     * GET /api/finance/market-summary
     * Major indices summary
     */
    public function getMarketSummary(): array
    {
        $cacheKey = 'market_summary';
        $cached   = $this->getCache($cacheKey);
        if ($cached) return $cached;

        // Major indices symbols
        $indices = ['^GSPC', '^DJI', '^IXIC', '^FTSE', 'GC=F', 'BTC-USD'];

        if (empty($this->fmpApiKey)) {
            return $this->fallbackMarketSummary();
        }

        $symbolStr = implode(',', $indices);
        $url       = "{$this->fmpBaseUrl}/quote/{$symbolStr}?apikey={$this->fmpApiKey}";
        $data      = $this->httpGet($url);

        if (!is_array($data)) {
            return $this->fallbackMarketSummary();
        }

        $result = ['indices' => $data, 'updated_at' => now()];
        $this->setCache($cacheKey, $result, 900); // 15min
        return $result;
    }

    /**
     * GET /api/finance/crypto?symbols=BTC,ETH,BNB
     */
    public function getCryptoPrices(array $symbols): array
    {
        $pairs    = array_map(fn($s) => strtoupper($s) . 'USD', $symbols);
        $cacheKey = 'crypto_' . md5(implode(',', $pairs));
        $cached   = $this->getCache($cacheKey);
        if ($cached) return $cached;

        if (empty($this->fmpApiKey)) {
            return $this->fallbackCrypto($symbols);
        }

        $symbolStr = implode(',', $pairs);
        $url       = "{$this->fmpBaseUrl}/quote/{$symbolStr}?apikey={$this->fmpApiKey}";
        $data      = $this->httpGet($url);

        if (!is_array($data) || empty($data)) {
            return $this->fallbackCrypto($symbols);
        }

        $this->setCache($cacheKey, $data, 300);
        return $data;
    }

    // ─── 3. Financial Forecast ────────────────────────────────────────────────
    /**
     * POST /api/finance/forecast
     * Simple forecast based on user's transaction history
     */
    public function generateForecast(array $monthlyData, int $months = 3): array
    {
        if (count($monthlyData) < 2) {
            return ['error' => 'Dados insuficientes para previsão.'];
        }

        $incomes  = array_column($monthlyData, 'income');
        $expenses = array_column($monthlyData, 'expense');

        $avgIncome  = array_sum($incomes)  / count($incomes);
        $avgExpense = array_sum($expenses) / count($expenses);

        // Linear regression trend
        $incomeTrend  = $this->linearTrend($incomes);
        $expenseTrend = $this->linearTrend($expenses);

        $forecast = [];
        for ($i = 1; $i <= $months; $i++) {
            $projectedIncome  = max(0, $avgIncome  + ($incomeTrend  * $i));
            $projectedExpense = max(0, $avgExpense + ($expenseTrend * $i));

            $forecast[] = [
                'month'            => date('Y-m', strtotime("+{$i} months")),
                'projected_income' => round($projectedIncome,  2),
                'projected_expense'=> round($projectedExpense, 2),
                'projected_balance'=> round($projectedIncome - $projectedExpense, 2),
                'trend_income'     => $incomeTrend  >= 0 ? 'up' : 'down',
                'trend_expense'    => $expenseTrend >= 0 ? 'up' : 'down',
            ];
        }

        return [
            'forecast'       => $forecast,
            'avg_income'     => round($avgIncome,   2),
            'avg_expense'    => round($avgExpense,  2),
            'avg_balance'    => round($avgIncome - $avgExpense, 2),
            'income_trend'   => round($incomeTrend,  2),
            'expense_trend'  => round($expenseTrend, 2),
            'generated_at'   => now(),
        ];
    }

    // ─── HTTP Client ──────────────────────────────────────────────────────────
    private function httpGet(string $url, int $timeout = 10): array
    {
        $ctx = stream_context_create([
            'http' => [
                'method'  => 'GET',
                'timeout' => $timeout,
                'header'  => "Accept: application/json\r\nUser-Agent: FinanceManagerAPI/1.0\r\n",
            ],
            'ssl' => ['verify_peer' => true, 'verify_peer_name' => true],
        ]);

        $response = @file_get_contents($url, false, $ctx);

        if ($response === false) {
            $this->logger->warning("External API call failed: $url");
            return [];
        }

        $decoded = json_decode($response, true);
        return is_array($decoded) ? $decoded : [];
    }

    // ─── File Cache (simple) ─────────────────────────────────────────────────
    private function getCache(string $key): ?array
    {
        $file = STORAGE_PATH . '/logs/cache_' . md5($key) . '.json';
        if (!file_exists($file)) return null;

        $data = json_decode(file_get_contents($file), true);
        if (!$data || ($data['expires'] ?? 0) < time()) {
            @unlink($file);
            return null;
        }
        return $data['value'];
    }

    private function setCache(string $key, array $value, int $ttl): void
    {
        $file = STORAGE_PATH . '/logs/cache_' . md5($key) . '.json';
        file_put_contents($file, json_encode([
            'expires' => time() + $ttl,
            'value'   => $value,
        ]));
    }

    // ─── Linear trend helper ──────────────────────────────────────────────────
    private function linearTrend(array $values): float
    {
        $n = count($values);
        if ($n < 2) return 0;

        $sumX = $sumY = $sumXY = $sumX2 = 0;
        foreach ($values as $i => $v) {
            $sumX  += $i;
            $sumY  += $v;
            $sumXY += $i * $v;
            $sumX2 += $i * $i;
        }

        $denom = ($n * $sumX2 - $sumX * $sumX);
        if ($denom == 0) return 0;
        return ($n * $sumXY - $sumX * $sumY) / $denom;
    }

    // ─── Fallback data ────────────────────────────────────────────────────────
    private function fallbackRates(string $base): array
    {
        return [
            'base'  => $base,
            'date'  => now(),
            'rates' => ['USD' => 0.0011, 'EUR' => 0.0010, 'GBP' => 0.00087, 'AOA' => 1.0],
            'note'  => 'Fallback rates - configure EXCHANGE_RATE_API_KEY',
        ];
    }

    private function fallbackRate(string $from, string $to): float
    {
        $rates = ['AOA' => 1, 'USD' => 900, 'EUR' => 980, 'GBP' => 1140];
        $fromRate = $rates[$from] ?? 1;
        $toRate   = $rates[$to]   ?? 1;
        return $fromRate > 0 ? $toRate / $fromRate : 1;
    }

    private function fallbackStockQuotes(array $symbols): array
    {
        return array_map(fn($s) => [
            'symbol' => strtoupper($s),
            'price'  => 0,
            'note'   => 'Configure FMP_API_KEY for live data',
        ], $symbols);
    }

    private function fallbackMarketSummary(): array
    {
        return ['note' => 'Configure FMP_API_KEY for live market data', 'updated_at' => now()];
    }

    private function fallbackCrypto(array $symbols): array
    {
        return array_map(fn($s) => [
            'symbol' => strtoupper($s),
            'price'  => 0,
            'note'   => 'Configure FMP_API_KEY for live crypto data',
        ], $symbols);
    }
}
