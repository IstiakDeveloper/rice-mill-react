<?php

namespace App\Http\Controllers;

use App\Models\Customer;
use App\Models\Season;
use Illuminate\Http\Request;
use Inertia\Inertia;

class PublicCustomerController extends Controller
{
    public function index(Request $request)
    {
        // Get current season or the latest season
        $currentSeason = Season::latest()->first();

        // Get season from request if provided
        $selectedSeasonId = $request->get('season_id', $currentSeason?->id);
        $selectedSeason = $selectedSeasonId ? Season::find($selectedSeasonId) : $currentSeason;

        // Get customers with their relationships for the selected season
        $customers = Customer::with([
            'customerBalances' => function($query) use ($selectedSeason) {
                if ($selectedSeason) {
                    $query->where('season_id', $selectedSeason->id);
                }
            },
            'transactions' => function($query) use ($selectedSeason) {
                if ($selectedSeason) {
                    $query->where('season_id', $selectedSeason->id)
                          ->with(['transactionItems.sackType']);
                }
            },
            'payments' => function($query) use ($selectedSeason) {
                if ($selectedSeason) {
                    $query->where('season_id', $selectedSeason->id);
                }
            }
        ])
        ->get()
        ->map(function ($customer) use ($selectedSeason) {
            $balance = $customer->customerBalances->first();

            // Calculate total sacks purchased
            $totalSacks = $customer->transactions->flatMap(function($transaction) {
                return $transaction->transactionItems;
            })->sum('quantity');

            // Get latest transaction and payment dates
            $latestTransaction = $customer->transactions->sortByDesc('transaction_date')->first();
            $latestPayment = $customer->payments->sortByDesc('payment_date')->first();

            // Calculate payment summary
            $totalSales = $balance ? $balance->total_sales : 0;
            $totalPayments = $balance ? $balance->total_payments : 0;
            $remainingBalance = $balance ? $balance->balance : 0;
            $advancePayment = $balance ? $balance->advance_payment : 0;

            // Calculate due amount (positive balance means customer owes money)
            $dueAmount = max(0, $remainingBalance);

            return [
                'id' => $customer->id,
                'name' => $customer->name,
                'area' => $customer->area,
                'phone_number' => $customer->phone_number,
                'image' => $customer->image,
                'total_sacks' => round($totalSacks, 2),
                'total_sales' => $totalSales,
                'total_payments' => $totalPayments,
                'remaining_balance' => $remainingBalance,
                'due_amount' => $dueAmount,
                'advance_payment' => $advancePayment,
                'last_transaction_date' => $latestTransaction ? $latestTransaction->transaction_date : null,
                'last_payment_date' => $latestPayment ? $latestPayment->payment_date : null,
                'payment_status' => $this->getPaymentStatus($remainingBalance, $advancePayment),
                'transaction_count' => $customer->transactions->count(),
                'payment_count' => $customer->payments->count(),
            ];
        })
        ->filter(function ($customer) {
            // Only show customers who have transactions or payments
            return $customer['transaction_count'] > 0 || $customer['payment_count'] > 0;
        })
        ->sortBy('name')
        ->values();

        // Calculate summary statistics
        $totalCustomers = $customers->count();
        $totalDueAmount = $customers->sum('due_amount');
        $totalSacks = $customers->sum('total_sacks');
        $totalSales = $customers->sum('total_sales');
        $customersWithDue = $customers->where('payment_status', 'due')->count();

        // Get all seasons for the dropdown
        $seasons = Season::orderBy('name')->get();

        // Get unique areas for filtering
        $areas = $customers->pluck('area')->unique()->filter()->sort()->values();

        return Inertia::render('Public/Customers', [
            'customers' => $customers,
            'seasons' => $seasons,
            'currentSeason' => $selectedSeason,
            'areas' => $areas,
            'summary' => [
                'total_customers' => $totalCustomers,
                'total_due_amount' => $totalDueAmount,
                'total_sacks' => $totalSacks,
                'total_sales' => $totalSales,
                'customers_with_due' => $customersWithDue,
            ]
        ]);
    }

    /**
     * Get payment status based on balance and advance payment
     */
    private function getPaymentStatus($remainingBalance, $advancePayment)
    {
        if ($remainingBalance > 0) {
            return 'due';
        } elseif ($remainingBalance < 0 || $advancePayment > 0) {
            return 'advance';
        } else {
            return 'settled';
        }
    }

    /**
     * API endpoint for getting customer data
     */
    public function api(Request $request)
    {
        $currentSeason = Season::latest()->first();
        $selectedSeasonId = $request->get('season_id', $currentSeason?->id);
        $selectedSeason = $selectedSeasonId ? Season::find($selectedSeasonId) : $currentSeason;

        $customers = Customer::with([
            'customerBalances' => function($query) use ($selectedSeason) {
                if ($selectedSeason) {
                    $query->where('season_id', $selectedSeason->id);
                }
            },
            'transactions' => function($query) use ($selectedSeason) {
                if ($selectedSeason) {
                    $query->where('season_id', $selectedSeason->id)
                          ->with(['transactionItems.sackType']);
                }
            },
            'payments' => function($query) use ($selectedSeason) {
                if ($selectedSeason) {
                    $query->where('season_id', $selectedSeason->id);
                }
            }
        ])
        ->get()
        ->map(function ($customer) use ($selectedSeason) {
            $balance = $customer->customerBalances->first();

            $totalSacks = $customer->transactions->flatMap(function($transaction) {
                return $transaction->transactionItems;
            })->sum('quantity');

            $totalSales = $balance ? $balance->total_sales : 0;
            $totalPayments = $balance ? $balance->total_payments : 0;
            $remainingBalance = $balance ? $balance->balance : 0;
            $advancePayment = $balance ? $balance->advance_payment : 0;
            $dueAmount = max(0, $remainingBalance);

            return [
                'id' => $customer->id,
                'name' => $customer->name,
                'area' => $customer->area,
                'phone_number' => $customer->phone_number,
                'total_sacks' => round($totalSacks, 2),
                'total_sales' => $totalSales,
                'total_payments' => $totalPayments,
                'due_amount' => $dueAmount,
                'advance_payment' => $advancePayment,
                'payment_status' => $this->getPaymentStatus($remainingBalance, $advancePayment),
                'transaction_count' => $customer->transactions->count(),
                'payment_count' => $customer->payments->count(),
            ];
        })
        ->filter(function ($customer) {
            return $customer['transaction_count'] > 0 || $customer['payment_count'] > 0;
        })
        ->values();

        return response()->json([
            'customers' => $customers,
            'season' => $selectedSeason,
            'summary' => [
                'total_customers' => $customers->count(),
                'total_due_amount' => $customers->sum('due_amount'),
                'total_sacks' => $customers->sum('total_sacks'),
                'total_sales' => $customers->sum('total_sales'),
                'customers_with_due' => $customers->where('payment_status', 'due')->count(),
            ]
        ]);
    }
}
