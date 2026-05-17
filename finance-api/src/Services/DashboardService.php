<?php

namespace App\Services;

use App\Repositories\AccountRepository;
use App\Repositories\TransactionRepository;
use App\Repositories\GoalRepository;

class DashboardService
{
    public function __construct(
        private AccountRepository     $accountRepo     = new AccountRepository(),
        private TransactionRepository $transactionRepo = new TransactionRepository(),
        private GoalRepository        $goalRepo        = new GoalRepository()
    ) {}

    public function getSummary(int $userId): array
    {
        $now   = date('Y-m-d');
        $year  = (int) date('Y');
        $month = (int) date('m');

        // Current month income/expense
        $monthSummary = $this->getMonthSummary($userId, $year, $month);

        // Last month for comparison
        $lastMonth     = $month === 1 ? 12 : $month - 1;
        $lastMonthYear = $month === 1 ? $year - 1 : $year;
        $lastSummary   = $this->getMonthSummary($userId, $lastMonthYear, $lastMonth);

        // Total balance across all accounts
        $totalBalance = $this->accountRepo->totalBalanceByUser($userId);

        // Recent transactions
        $recentTransactions = $this->transactionRepo->recentByUser($userId, 5);

        // Goals progress
        $goals = $this->goalRepo->allByUser($userId, 1, 5);

        // Balance by account type
        $balanceByType = $this->accountRepo->balanceByType($userId);

        // Month evolution (6 months)
        $evolution = $this->getMonthlyEvolution($userId, 6);

        return [
            'total_balance'       => $totalBalance,
            'current_month'       => $monthSummary,
            'last_month'          => $lastSummary,
            'comparison'          => $this->buildComparison($monthSummary, $lastSummary),
            'recent_transactions' => $recentTransactions,
            'goals'               => $goals['items'],
            'balance_by_type'     => $balanceByType,
            'evolution'           => $evolution,
            'generated_at'        => now(),
        ];
    }

    private function getMonthSummary(int $userId, int $year, int $month): array
    {
        $rows    = $this->transactionRepo->summaryByMonth($userId, $year, $month);
        $income  = 0.0;
        $expense = 0.0;

        foreach ($rows as $row) {
            if ($row['type'] === 'income')  $income  = (float) $row['total'];
            if ($row['type'] === 'expense') $expense = (float) $row['total'];
        }

        return [
            'year'    => $year,
            'month'   => $month,
            'income'  => $income,
            'expense' => $expense,
            'balance' => $income - $expense,
        ];
    }

    private function buildComparison(array $current, array $last): array
    {
        $incomeDiff  = $last['income']  > 0 ? (($current['income']  - $last['income'])  / $last['income'])  * 100 : 0;
        $expenseDiff = $last['expense'] > 0 ? (($current['expense'] - $last['expense']) / $last['expense']) * 100 : 0;

        return [
            'income_change_pct'  => round($incomeDiff,  2),
            'expense_change_pct' => round($expenseDiff, 2),
            'income_trend'       => $incomeDiff  >= 0 ? 'up' : 'down',
            'expense_trend'      => $expenseDiff >= 0 ? 'up' : 'down',
        ];
    }

    private function getMonthlyEvolution(int $userId, int $months): array
    {
        $rows   = $this->transactionRepo->monthlyEvolution($userId, $months);
        $result = [];

        foreach ($rows as $row) {
            $m = $row['month'];
            $result[$m] ??= ['month' => $m, 'income' => 0.0, 'expense' => 0.0, 'balance' => 0.0];
            $result[$m][$row['type']] = (float) $row['total'];
        }

        foreach ($result as &$r) {
            $r['balance'] = $r['income'] - $r['expense'];
        }

        return array_values($result);
    }
}
