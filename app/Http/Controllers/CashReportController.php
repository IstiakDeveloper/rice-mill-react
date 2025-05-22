<?php

namespace App\Http\Controllers;

use App\Models\Season;
use App\Models\Payment;
use App\Models\Expense;
use App\Models\FundInput;
use App\Models\AdditionalIncome;
use App\Models\CashBalance;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;

class CashReportController extends Controller
{
    /**
     * Display simple cash report by month
     */
    public function index(Request $request)
    {
        $currentSeason = Season::getCurrentSeason();

        // Get month and year from request
        $month = $request->get('month', Carbon::now()->month);
        $year = $request->get('year', Carbon::now()->year);
        $seasonId = $request->get('season_id', $currentSeason->id);

        // Generate daily cash report
        $reportData = $this->generateDailyCashReport($seasonId, $month, $year);

        return Inertia::render('Reports/CashReport', [
            'currentSeason' => $currentSeason,
            'seasons' => Season::orderBy('created_at', 'desc')->get(),
            'selectedMonth' => $month,
            'selectedYear' => $year,
            'selectedSeason' => $seasonId,
            'reportData' => $reportData,
            'monthName' => Carbon::create($year, $month, 1)->format('F Y'),
        ]);
    }

    /**
     * Generate daily cash report for a specific month
     */
    private function generateDailyCashReport($seasonId, $month, $year)
    {
        $startDate = Carbon::create($year, $month, 1)->startOfMonth();
        $endDate = Carbon::create($year, $month, 1)->endOfMonth();

        // Get previous month ending balance
        $previousMonthEnd = $startDate->copy()->subDay();
        $openingBalance = $this->calculateBalanceUpToDate($seasonId, $previousMonthEnd);

        $dailyData = [];
        $runningBalance = $openingBalance;

        // Loop through each day of the month
        for ($date = $startDate->copy(); $date->lte($endDate); $date->addDay()) {
            $dateStr = $date->format('Y-m-d');

            // Get cash IN for this date
            $cashIn = $this->getDailyCashIn($seasonId, $dateStr);

            // Get cash OUT for this date
            $cashOut = $this->getDailyCashOut($seasonId, $dateStr);

            // Calculate net and running balance
            $netAmount = $cashIn - $cashOut;
            $runningBalance += $netAmount;

            $dailyData[] = [
                'date' => $dateStr,
                'formatted_date' => $date->format('d/m/Y'),
                'day_name' => $date->format('l'),
                'cash_in' => $cashIn,
                'cash_out' => $cashOut,
                'net_amount' => $netAmount,
                'balance' => $runningBalance,
            ];
        }

        return [
            'opening_balance' => $openingBalance,
            'closing_balance' => $runningBalance,
            'total_cash_in' => array_sum(array_column($dailyData, 'cash_in')),
            'total_cash_out' => array_sum(array_column($dailyData, 'cash_out')),
            'daily_data' => $dailyData,
        ];
    }

    /**
     * Get cash IN for a specific date
     */
    private function getDailyCashIn($seasonId, $date)
    {
        $payments = Payment::where('season_id', $seasonId)
            ->whereDate('payment_date', $date)
            ->sum('amount');

        $fundInputs = FundInput::where('season_id', $seasonId)
            ->whereDate('date', $date)
            ->sum('amount');

        $additionalIncomes = AdditionalIncome::where('season_id', $seasonId)
            ->whereDate('date', $date)
            ->sum('amount');

        return $payments + $fundInputs + $additionalIncomes;
    }

    /**
     * Get cash OUT for a specific date
     */
    private function getDailyCashOut($seasonId, $date)
    {
        return Expense::where('season_id', $seasonId)
            ->whereDate('expense_date', $date)
            ->sum('amount');
    }

    /**
     * Calculate balance up to a specific date
     */
    private function calculateBalanceUpToDate($seasonId, $date)
    {
        // Total cash IN up to date
        $totalPayments = Payment::where('season_id', $seasonId)
            ->where('payment_date', '<=', $date)
            ->sum('amount');

        $totalFundInputs = FundInput::where('season_id', $seasonId)
            ->where('date', '<=', $date)
            ->sum('amount');

        $totalAdditionalIncomes = AdditionalIncome::where('season_id', $seasonId)
            ->where('date', '<=', $date)
            ->sum('amount');

        // Total cash OUT up to date
        $totalExpenses = Expense::where('season_id', $seasonId)
            ->where('expense_date', '<=', $date)
            ->sum('amount');

        return ($totalPayments + $totalFundInputs + $totalAdditionalIncomes) - $totalExpenses;
    }
}
