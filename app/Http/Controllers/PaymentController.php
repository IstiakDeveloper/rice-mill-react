<?php

namespace App\Http\Controllers;

use App\Models\Customer;
use App\Models\Transaction;
use App\Models\Payment;
use App\Models\Season;
use App\Models\CashBalance;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;

class PaymentController extends Controller
{
    /**
     * Display a listing of payments.
     */
    public function index()
    {
        $payments = Payment::with(['customer', 'transaction', 'season'])
            ->latest('payment_date')
            ->paginate(15);

        return Inertia::render('Payments/Index', [
            'payments' => $payments,
            'seasons' => Season::all()
        ]);
    }

    /**
     * Show the form for creating a new payment.
     */
    public function create()
    {
        $customers = Customer::all();
        $seasons = Season::all();

        // Get transactions with due amounts
        $transactions = Transaction::where('due_amount', '>', 0)
            ->with(['customer', 'season'])
            ->orderBy('transaction_date', 'desc')
            ->get();

        return Inertia::render('Payments/Create', [
            'customers' => $customers,
            'transactions' => $transactions,
            'seasons' => $seasons
        ]);
    }

    /**
     * Store a newly created payment.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'customer_id' => 'required|exists:customers,id',
            'transaction_id' => 'nullable|exists:transactions,id',
            'season_id' => 'required|exists:seasons,id',
            'payment_date' => 'required|date',
            'amount' => 'required|numeric|min:0.01',
            'notes' => 'nullable|string',
            'received_by' => 'nullable|string|max:255',
        ]);

        DB::transaction(function () use ($validated) {
            // Create payment
            $payment = Payment::create($validated);

            // Update transaction if linked
            if ($validated['transaction_id']) {
                $this->updateTransactionPaymentStatus($validated['transaction_id'], $validated['amount']);
            }

            // Update cash balance
            $this->updateCashBalance($validated['season_id'], $validated['amount'], 'add');
        });

        return redirect()->route('payments.index')->with('success', 'Payment recorded successfully.');
    }

    /**
     * Show the form for editing the specified payment.
     */
    public function edit(Payment $payment)
    {
        $customers = Customer::all();
        $seasons = Season::all();

        // Get transactions for the customer
        $transactions = Transaction::where('customer_id', $payment->customer_id)
            ->with(['customer', 'season'])
            ->orderBy('transaction_date', 'desc')
            ->get();

        return Inertia::render('Payments/Edit', [
            'payment' => $payment->load(['customer', 'transaction', 'season']),
            'customers' => $customers,
            'transactions' => $transactions,
            'seasons' => $seasons
        ]);
    }

    /**
     * Update the specified payment.
     */
    public function update(Request $request, Payment $payment)
    {
        $validated = $request->validate([
            'customer_id' => 'required|exists:customers,id',
            'transaction_id' => 'nullable|exists:transactions,id',
            'season_id' => 'required|exists:seasons,id',
            'payment_date' => 'required|date',
            'amount' => 'required|numeric|min:0.01',
            'notes' => 'nullable|string',
            'received_by' => 'nullable|string|max:255',
        ]);

        DB::transaction(function () use ($validated, $payment) {
            $oldAmount = $payment->amount;
            $oldSeasonId = $payment->season_id;
            $oldTransactionId = $payment->transaction_id;

            // Reverse old transaction payment status
            if ($oldTransactionId) {
                $this->updateTransactionPaymentStatus($oldTransactionId, -$oldAmount);
            }

            // Reverse old cash balance
            $this->updateCashBalance($oldSeasonId, $oldAmount, 'subtract');

            // Update payment
            $payment->update($validated);

            // Update new transaction payment status
            if ($validated['transaction_id']) {
                $this->updateTransactionPaymentStatus($validated['transaction_id'], $validated['amount']);
            }

            // Update new cash balance
            $this->updateCashBalance($validated['season_id'], $validated['amount'], 'add');
        });

        return redirect()->route('payments.index')->with('success', 'Payment updated successfully.');
    }

    /**
     * Remove the specified payment.
     */
    public function destroy(Payment $payment)
    {
        DB::transaction(function () use ($payment) {
            // Reverse transaction payment status
            if ($payment->transaction_id) {
                $this->updateTransactionPaymentStatus($payment->transaction_id, -$payment->amount);
            }

            // Reverse cash balance
            $this->updateCashBalance($payment->season_id, $payment->amount, 'subtract');

            // Delete payment
            $payment->delete();
        });

        return redirect()->route('payments.index')->with('success', 'Payment deleted successfully.');
    }

    /**
     * Display the specified payment.
     */
    public function show(Payment $payment)
    {
        return Inertia::render('Payments/Show', [
            'payment' => $payment->load(['customer', 'transaction', 'season'])
        ]);
    }

    /**
     * Display payments for a specific customer.
     */
    public function customerPayments(Customer $customer)
    {
        $payments = Payment::where('customer_id', $customer->id)
            ->with(['transaction', 'season'])
            ->orderBy('payment_date', 'desc')
            ->get();

        $totalPaid = $payments->sum('amount');

        $transactions = Transaction::where('customer_id', $customer->id)
            ->with('season')
            ->orderBy('transaction_date', 'desc')
            ->get();

        $totalTransactions = $transactions->sum('total_amount');
        $totalDue = $transactions->sum('due_amount');

        return Inertia::render('Payments/CustomerPayments', [
            'customer' => $customer,
            'payments' => $payments,
            'transactions' => $transactions,
            'totalPaid' => $totalPaid,
            'totalTransactions' => $totalTransactions,
            'totalDue' => $totalDue
        ]);
    }

    /**
     * Get transactions by customer for AJAX requests.
     */
    public function getTransactionsByCustomer(Customer $customer)
    {
        $transactions = Transaction::where('customer_id', $customer->id)
            ->where('due_amount', '>', 0)
            ->with('season')
            ->orderBy('transaction_date', 'desc')
            ->get();

        return response()->json($transactions);
    }

    /**
     * Update transaction payment status.
     */
    private function updateTransactionPaymentStatus($transactionId, $amount)
    {
        $transaction = Transaction::find($transactionId);

        if ($transaction) {
            $transaction->paid_amount += $amount;
            $transaction->due_amount = $transaction->total_amount - $transaction->paid_amount;

            // Update payment status
            if ($transaction->due_amount <= 0) {
                $transaction->payment_status = 'paid';
                $transaction->due_amount = 0; // Ensure it doesn't go negative
            } elseif ($transaction->paid_amount > 0) {
                $transaction->payment_status = 'partial';
            } else {
                $transaction->payment_status = 'due';
            }

            $transaction->save();
        }
    }

    /**
     * Update cash balance.
     */
    private function updateCashBalance($seasonId, $amount, $operation)
    {
        $cashBalance = CashBalance::firstOrCreate(
            ['season_id' => $seasonId],
            ['amount' => 0, 'last_updated' => now()]
        );

        if ($operation === 'add') {
            $cashBalance->amount += $amount;
        } else {
            $cashBalance->amount -= $amount;
        }

        $cashBalance->last_updated = now();
        $cashBalance->save();
    }
}
