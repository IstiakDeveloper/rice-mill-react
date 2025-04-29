<?php

namespace App\Http\Controllers;

use App\Models\Customer;
use App\Models\Season;
use App\Models\Transaction;
use App\Models\Payment;
use App\Models\SackType;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Carbon\Carbon;

class ReportController extends Controller
{
    /**
     * Display the daily report.
     */
    public function daily(Request $request)
    {
        $date = $request->input('date', Carbon::today()->format('Y-m-d'));

        // Get transactions and payments for the day
        $transactions = Transaction::with(['customer', 'items.sackType'])
            ->whereDate('transaction_date', $date)
            ->get();

        $payments = Payment::with(['customer', 'transaction'])
            ->whereDate('payment_date', $date)
            ->get();

        // Calculate totals
        $totalTransactions = $transactions->sum('total_amount');
        $totalPaid = $payments->sum('amount');

        // Group transactions by sack type
        $sackTypeData = [];

        foreach ($transactions as $transaction) {
            foreach ($transaction->items as $item) {
                $sackTypeName = $item->sackType->name;

                if (!isset($sackTypeData[$sackTypeName])) {
                    $sackTypeData[$sackTypeName] = [
                        'quantity' => 0,
                        'total' => 0
                    ];
                }

                $sackTypeData[$sackTypeName]['quantity'] += $item->quantity;
                $sackTypeData[$sackTypeName]['total'] += $item->total_price;
            }
        }

        return Inertia::render('Reports/Daily', [
            'date' => $date,
            'transactions' => $transactions,
            'payments' => $payments,
            'totalTransactions' => $totalTransactions,
            'totalPaid' => $totalPaid,
            'sackTypeData' => $sackTypeData
        ]);
    }

    /**
     * Display the season report.
     */
    public function season(Request $request)
    {
        // Get all seasons for selection
        $allSeasons = Season::all();

        // Get current season if no season selected
        $seasonId = $request->input('season_id', Season::getCurrentSeason()->id);
        $selectedSeason = Season::findOrFail($seasonId);

        // Get transactions and payments for the season
        $transactions = Transaction::where('season_id', $seasonId)
            ->with('customer')
            ->get();

        $payments = Payment::where('season_id', $seasonId)
            ->with('customer')
            ->get();

        // Calculate totals
        $totalTransactions = $transactions->sum('total_amount');
        $totalPaid = $payments->sum('amount');
        $totalDue = $transactions->sum('due_amount');

        // Group transactions by sack type
        $sackTypeData = [];
        $sackTypes = SackType::all();

        foreach ($sackTypes as $sackType) {
            $sackTypeData[$sackType->name] = [
                'quantity' => 0,
                'total' => 0
            ];
        }

        foreach ($transactions as $transaction) {
            foreach ($transaction->items as $item) {
                $sackTypeName = $item->sackType->name;
                $sackTypeData[$sackTypeName]['quantity'] += $item->quantity;
                $sackTypeData[$sackTypeName]['total'] += $item->total_price;
            }
        }

        // Customer summary
        $customerData = Customer::whereHas('transactions', function($query) use ($seasonId) {
                $query->where('season_id', $seasonId);
            })
            ->withSum(['transactions as total_transactions' => function($query) use ($seasonId) {
                $query->where('season_id', $seasonId);
            }], 'total_amount')
            ->withSum(['transactions as total_due' => function($query) use ($seasonId) {
                $query->where('season_id', $seasonId);
            }], 'due_amount')
            ->withSum(['payments as total_paid' => function($query) use ($seasonId) {
                $query->where('season_id', $seasonId);
            }], 'amount')
            ->get();

        return Inertia::render('Reports/Season', [
            'allSeasons' => $allSeasons,
            'selectedSeason' => $selectedSeason,
            'totalTransactions' => $totalTransactions,
            'totalPaid' => $totalPaid,
            'totalDue' => $totalDue,
            'sackTypeData' => $sackTypeData,
            'customerData' => $customerData
        ]);
    }

    /**
     * Display customer report.
     */
    public function customer(Request $request)
    {
        // Get all customers for selection
        $allCustomers = Customer::all();

        // Get customer data if selected
        $customerId = $request->input('customer_id');
        $seasonId = $request->input('season_id', Season::getCurrentSeason()->id);

        if ($customerId) {
            $customer = Customer::findOrFail($customerId);

            // Get transactions and payments
            $query = Transaction::where('customer_id', $customerId);
            $paymentQuery = Payment::where('customer_id', $customerId);

            if ($seasonId) {
                $query->where('season_id', $seasonId);
                $paymentQuery->where('season_id', $seasonId);
            }

            $transactions = $query->with('items.sackType')->get();
            $payments = $paymentQuery->get();

            // Calculate totals
            $totalTransactions = $transactions->sum('total_amount');
            $totalPaid = $payments->sum('amount');
            $totalDue = $transactions->sum('due_amount');

            // Group by sack type
            $sackTypeData = [];

            foreach ($transactions as $transaction) {
                foreach ($transaction->items as $item) {
                    $sackTypeName = $item->sackType->name;

                    if (!isset($sackTypeData[$sackTypeName])) {
                        $sackTypeData[$sackTypeName] = [
                            'quantity' => 0,
                            'total' => 0
                        ];
                    }

                    $sackTypeData[$sackTypeName]['quantity'] += $item->quantity;
                    $sackTypeData[$sackTypeName]['total'] += $item->total_price;
                }
            }

            return Inertia::render('Reports/Customer', [
                'allCustomers' => $allCustomers,
                'customer' => $customer,
                'transactions' => $transactions,
                'payments' => $payments,
                'totalTransactions' => $totalTransactions,
                'totalPaid' => $totalPaid,
                'totalDue' => $totalDue,
                'sackTypeData' => $sackTypeData
            ]);
        }

        // Just show customer selection screen if no customer selected
        return Inertia::render('Reports/Customer', [
            'allCustomers' => $allCustomers
        ]);
    }
}
