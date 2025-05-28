<?php

namespace App\Http\Controllers;

use App\Models\Customer;
use App\Models\Payment;
use App\Models\Transaction;
use App\Models\Season;
use App\Models\CashBalance;
use App\Models\CustomerBalance;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;

class PaymentController extends Controller
{
    /**
     * Display payment list for a transaction or all payments
     */
    public function index($transactionId = null)
    {
        try {
            $query = Payment::with(['customer', 'transaction', 'season']);

            if ($transactionId) {
                $query->where('transaction_id', $transactionId);
                $transaction = Transaction::with('customer')->find($transactionId);
            }

            $payments = $query->orderBy('payment_date', 'desc')->paginate(20);

            return Inertia::render('Payments/Index', [
                'payments' => $payments,
                'transaction' => isset($transaction) ? $transaction : null
            ]);
        } catch (\Exception $e) {
            Log::error('Payments list loading failed', [
                'transaction_id' => $transactionId,
                'error' => $e->getMessage()
            ]);

            return redirect()->back()->with('error', 'Unable to load payments. Please try again.');
        }
    }

    /**
     * Show the form for creating a new payment
     */
    public function create(Request $request)
    {
        try {
            $transactionId = $request->get('transaction_id');
            $customerId = $request->get('customer_id');

            $transaction = null;
            if ($transactionId) {
                $transaction = Transaction::with('customer')->find($transactionId);
                $customerId = $transaction->customer_id ?? $customerId;
            }

            return Inertia::render('Payments/Create', [
                'customers' => Customer::orderBy('name')->get(),
                'seasons' => Season::orderBy('created_at', 'desc')->get(),
                'transactions' => $customerId ?
                    Transaction::where('customer_id', $customerId)
                        ->where('payment_status', '!=', 'paid')
                        ->orderBy('transaction_date', 'desc')->get() : [],
                'selectedTransaction' => $transaction,
                'selectedCustomerId' => $customerId,
            ]);
        } catch (\Exception $e) {
            Log::error('Payment create form loading failed', [
                'error' => $e->getMessage()
            ]);

            return redirect()->back()->with('error', 'Unable to load payment form. Please try again.');
        }
    }

    /**
     * Store a newly created payment
     */
    public function store(Request $request)
    {
        try {
            $validated = $this->validatePaymentData($request);
            $seasonId = $validated['season_id'] ?? Season::getCurrentSeason()->id;

            DB::transaction(function () use ($validated, $seasonId) {
                // Create payment record
                $payment = $this->createPaymentRecord($validated, $seasonId);

                // Update customer balance
                $this->adjustCustomerBalance(
                    $validated['customer_id'],
                    $seasonId,
                    0, // No sales change
                    $validated['amount'] // Payment amount
                );

                // Update linked transaction if specified
                if (!empty($validated['transaction_id'])) {
                    $this->updateTransactionPaymentStatus($validated['transaction_id'], $validated['amount']);
                }
            });

            $redirectRoute = !empty($validated['transaction_id']) ?
                route('payments.index', $validated['transaction_id']) :
                route('payments.index');

            return redirect($redirectRoute)->with('success', 'Payment recorded successfully!');

        } catch (ValidationException $e) {
            return redirect()->back()
                ->withErrors($e->errors())
                ->withInput()
                ->with('error', 'Please check the payment information and try again.');
        } catch (\Exception $e) {
            Log::error('Payment creation failed', [
                'customer_id' => $request->customer_id ?? null,
                'amount' => $request->amount ?? null,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            return redirect()->back()
                ->withInput()
                ->with('error', 'Failed to record payment. Please try again.');
        }
    }

    /**
     * Show payment details
     */
    public function show(Payment $payment)
    {
        try {
            $payment->load(['customer', 'transaction.items.sackType', 'season']);

            return Inertia::render('Payments/Show', [
                'payment' => $payment,
            ]);
        } catch (\Exception $e) {
            Log::error('Payment details loading failed', [
                'payment_id' => $payment->id,
                'error' => $e->getMessage()
            ]);

            return redirect()->back()->with('error', 'Unable to load payment details. Please try again.');
        }
    }

    /**
     * Show payment edit form
     */
    public function edit(Payment $payment)
    {
        try {
            $payment->load(['customer', 'transaction', 'season']);

            return Inertia::render('Payments/Edit', [
                'payment' => $payment,
                'customers' => Customer::orderBy('name')->get(),
                'transactions' => Transaction::where('customer_id', $payment->customer_id)
                    ->orderBy('transaction_date', 'desc')->get(),
                'seasons' => Season::orderBy('created_at', 'desc')->get(),
            ]);
        } catch (\Exception $e) {
            Log::error('Payment edit form loading failed', [
                'payment_id' => $payment->id,
                'error' => $e->getMessage()
            ]);

            return redirect()->back()->with('error', 'Unable to load payment edit form. Please try again.');
        }
    }

    /**
     * Update payment amount
     */
    public function update(Request $request, Payment $payment)
    {
        try {
            $validated = $request->validate([
                'amount' => 'required|numeric|min:0.01|max:999999.99',
                'payment_date' => 'required|date|before_or_equal:today',
                'notes' => 'nullable|string|max:1000',
                'received_by' => 'nullable|string|max:255',
            ]);

            // Get the difference for balance adjustment
            $oldAmount = $payment->amount;
            $newAmount = $validated['amount'];
            $difference = $newAmount - $oldAmount;

            DB::transaction(function () use ($payment, $validated, $difference, $newAmount) {
                // Update payment record
                $payment->update([
                    'amount' => $newAmount,
                    'payment_date' => $validated['payment_date'],
                    'notes' => $validated['notes'] ?? $payment->notes,
                    'received_by' => $validated['received_by'] ?? $payment->received_by,
                    'updated_at' => now(),
                ]);

                // Update customer balance
                $this->adjustCustomerBalance(
                    $payment->customer_id,
                    $payment->season_id,
                    0, // No sales change
                    $difference // Payment difference
                );

                // Update transaction payment status if linked
                if ($payment->transaction_id) {
                    $this->updateTransactionPaymentStatus($payment->transaction_id, $difference);
                }
            });

            $redirectRoute = $payment->transaction_id ?
                route('payments.index', $payment->transaction_id) :
                route('payments.index');

            return redirect($redirectRoute)->with('success', 'Payment updated successfully!');

        } catch (ValidationException $e) {
            return redirect()->back()
                ->withErrors($e->errors())
                ->withInput()
                ->with('error', 'Please check the form data and try again.');
        } catch (\Exception $e) {
            Log::error('Payment update failed', [
                'payment_id' => $payment->id,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            return redirect()->back()
                ->withInput()
                ->with('error', 'Failed to update payment. Please try again.');
        }
    }

    /**
     * Delete a payment (with proper balance adjustment)
     */
    public function destroy(Payment $payment)
    {
        try {
            DB::transaction(function () use ($payment) {
                $amount = $payment->amount;

                // Adjust customer balance (subtract the payment)
                $this->adjustCustomerBalance(
                    $payment->customer_id,
                    $payment->season_id,
                    0, // No sales change
                    -$amount // Negative to reduce payment
                );

                // Update transaction payment status if linked
                if ($payment->transaction_id) {
                    $this->updateTransactionPaymentStatus($payment->transaction_id, -$amount);
                }

                // Delete the payment
                $payment->delete();
            });

            return redirect()->back()->with('success', 'Payment deleted successfully!');

        } catch (\Exception $e) {
            Log::error('Payment deletion failed', [
                'payment_id' => $payment->id,
                'error' => $e->getMessage()
            ]);

            return redirect()->back()->with('error', 'Failed to delete payment. Please try again.');
        }
    }

    // ============================================================================
    // TRANSACTION UPDATE METHODS (for DashboardController integration)
    // ============================================================================

    /**
     * Update transaction with better payment handling
     */
    public function updateTransaction(Request $request, Transaction $transaction)
    {
        try {
            $validated = $this->validateTransactionData($request);
            $seasonId = $validated['season_id'] ?? $transaction->season_id;

            // Calculate new totals
            $totals = $this->calculateTransactionTotals($validated['items'], $validated['paid_amount']);

            DB::transaction(function () use ($transaction, $validated, $seasonId, $totals) {
                // Store old values for balance adjustment
                $oldTotal = $transaction->total_amount;

                // Update transaction record
                $transaction->update([
                    'customer_id' => $validated['customer_id'],
                    'season_id' => $seasonId,
                    'transaction_date' => $validated['transaction_date'],
                    'total_amount' => $totals['total'],
                    'notes' => $validated['notes'],
                ]);

                // Delete old items and create new ones
                $transaction->items()->delete();
                $this->createTransactionItems($transaction, $validated['items']);

                // Adjust customer balance for sale amount change
                $saleDifference = $totals['total'] - $oldTotal;
                if ($saleDifference != 0) {
                    $this->adjustCustomerBalance(
                        $validated['customer_id'],
                        $seasonId,
                        $saleDifference, // Sales difference
                        0 // No payment change here
                    );
                }

                // Handle additional payment if provided
                if ($totals['paid'] > 0) {
                    $this->processTransactionPayment($transaction, $validated, $seasonId, $totals['paid']);
                }

                // Update transaction payment status
                $this->recalculateTransactionPaymentStatus($transaction);
            });

            return redirect()->route('transactions.show', $transaction->id)
                ->with('success', 'Transaction updated successfully!');

        } catch (ValidationException $e) {
            return redirect()->back()
                ->withErrors($e->errors())
                ->withInput()
                ->with('error', 'Please check the form data and try again.');
        } catch (\Exception $e) {
            Log::error('Transaction update failed', [
                'transaction_id' => $transaction->id,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            return redirect()->back()
                ->withInput()
                ->with('error', 'Failed to update transaction. Please try again.');
        }
    }

    // ============================================================================
    // PRIVATE HELPER METHODS
    // ============================================================================

    /**
     * Validate payment request data
     */
    private function validatePaymentData(Request $request): array
    {
        return $request->validate([
            'customer_id' => 'required|exists:customers,id',
            'transaction_id' => 'nullable|exists:transactions,id',
            'season_id' => 'nullable|exists:seasons,id',
            'payment_date' => 'required|date|before_or_equal:today',
            'amount' => 'required|numeric|min:0.01|max:999999.99',
            'notes' => 'nullable|string|max:1000',
            'received_by' => 'nullable|string|max:255',
        ]);
    }

    /**
     * Validate transaction request data
     */
    private function validateTransactionData(Request $request): array
    {
        return $request->validate([
            'customer_id' => 'required|exists:customers,id',
            'season_id' => 'nullable|exists:seasons,id',
            'transaction_date' => 'required|date|before_or_equal:today',
            'paid_amount' => 'required|numeric|min:0',
            'notes' => 'nullable|string|max:1000',
            'items' => 'required|array|min:1|max:20',
            'items.*.sack_type_id' => 'required|exists:sack_types,id',
            'items.*.quantity' => 'required|numeric|min:0.1|max:999999.99',
            'items.*.unit_price' => 'required|numeric|min:0|max:999999.99',
        ]);
    }

    /**
     * Create payment record
     */
    private function createPaymentRecord(array $validated, int $seasonId): Payment
    {
        return Payment::create([
            'customer_id' => $validated['customer_id'],
            'transaction_id' => $validated['transaction_id'] ?? null,
            'season_id' => $seasonId,
            'payment_date' => $validated['payment_date'],
            'amount' => $validated['amount'],
            'notes' => $validated['notes'] ?? null,
            'received_by' => $validated['received_by'] ?? auth()->user()->name ?? 'Admin',
        ]);
    }

    /**
     * Calculate transaction totals
     */
    private function calculateTransactionTotals(array $items, float $paidAmount): array
    {
        $total = 0;
        foreach ($items as $item) {
            $quantity = floatval($item['quantity']);
            $unitPrice = floatval($item['unit_price']);
            $total += $quantity * $unitPrice;
        }

        return [
            'total' => round($total, 2),
            'paid' => $paidAmount,
            'due' => max(0, round($total - $paidAmount, 2)),
            'status' => $this->determinePaymentStatus($total, $paidAmount)
        ];
    }

    /**
     * Create transaction record
     */
    private function createTransactionRecord(array $validated, int $seasonId, array $totals): Transaction
    {
        return Transaction::create([
            'customer_id' => $validated['customer_id'],
            'season_id' => $seasonId,
            'transaction_date' => $validated['transaction_date'],
            'total_amount' => $totals['total'],
            'paid_amount' => $totals['paid'],
            'due_amount' => $totals['due'],
            'payment_status' => $totals['status'],
            'notes' => $validated['notes'],
        ]);
    }

    /**
     * Create transaction items
     */
    private function createTransactionItems(Transaction $transaction, array $items): void
    {
        foreach ($items as $item) {
            $quantity = floatval($item['quantity']);
            $unitPrice = floatval($item['unit_price']);
            $totalPrice = round($quantity * $unitPrice, 2);

            $transaction->items()->create([
                'sack_type_id' => $item['sack_type_id'],
                'quantity' => $quantity,
                'unit_price' => $unitPrice,
                'total_price' => $totalPrice,
            ]);
        }
    }

    /**
     * Process payment for transaction
     */
    private function processTransactionPayment(Transaction $transaction, array $validated, int $seasonId, float $amount): void
    {
        Payment::create([
            'customer_id' => $validated['customer_id'],
            'transaction_id' => $transaction->id,
            'season_id' => $seasonId,
            'payment_date' => $validated['transaction_date'],
            'amount' => $amount,
            'notes' => 'Payment during transaction update',
            'received_by' => auth()->user()->name ?? 'System',
        ]);

        $this->adjustCustomerBalance(
            $validated['customer_id'],
            $seasonId,
            0, // No sales change
            $amount // Payment amount
        );
    }

    /**
     * Determine payment status based on amounts
     */
    private function determinePaymentStatus(float $totalAmount, float $paidAmount): string
    {
        if ($paidAmount >= $totalAmount) {
            return 'paid';
        } elseif ($paidAmount > 0) {
            return 'partial';
        } else {
            return 'due';
        }
    }

    /**
     * Adjust customer balance (for both sales and payment changes)
     * This method also updates cash balance when payment changes occur
     */
    private function adjustCustomerBalance(int $customerId, int $seasonId, float $salesDifference = 0, float $paymentDifference = 0): void
    {
        $customerBalance = CustomerBalance::firstOrCreate(
            ['customer_id' => $customerId, 'season_id' => $seasonId],
            ['total_sales' => 0, 'total_payments' => 0, 'balance' => 0, 'advance_payment' => 0]
        );

        // Adjust totals
        $customerBalance->total_sales += $salesDifference;
        $customerBalance->total_payments += $paymentDifference;

        // Recalculate balance
        $newBalance = $customerBalance->total_sales - $customerBalance->total_payments;

        if ($newBalance >= 0) {
            $customerBalance->balance = $newBalance;
            $customerBalance->advance_payment = 0;
        } else {
            $customerBalance->balance = 0;
            $customerBalance->advance_payment = abs($newBalance);
        }

        $customerBalance->save();

        // Update cash balance ONLY if there's a payment difference
        // Logic: Payment increase = Cash increase, Payment decrease = Cash decrease
        if ($paymentDifference != 0) {
            if ($paymentDifference > 0) {
                // Payment বেড়েছে = Cash বাড়বে
                $this->updateCashBalance($seasonId, abs($paymentDifference), 'add');
            } else {
                // Payment কমেছে = Cash কমবে
                $this->updateCashBalance($seasonId, abs($paymentDifference), 'subtract');
            }
        }
    }

    /**
     * Update transaction payment status
     */
    private function updateTransactionPaymentStatus(int $transactionId, float $amountDifference): void
    {
        $transaction = Transaction::find($transactionId);
        if (!$transaction) {
            return;
        }

        $transaction->paid_amount += $amountDifference;
        $transaction->due_amount = max(0, $transaction->total_amount - $transaction->paid_amount);

        // Determine payment status
        if ($transaction->paid_amount >= $transaction->total_amount) {
            $transaction->payment_status = 'paid';
        } elseif ($transaction->paid_amount > 0) {
            $transaction->payment_status = 'partial';
        } else {
            $transaction->payment_status = 'due';
        }

        $transaction->save();
    }

    /**
     * Recalculate transaction payment status based on current payments
     */
    private function recalculateTransactionPaymentStatus(Transaction $transaction): void
    {
        $totalPaid = Payment::where('transaction_id', $transaction->id)->sum('amount');

        $transaction->paid_amount = $totalPaid;
        $transaction->due_amount = max(0, $transaction->total_amount - $totalPaid);

        if ($totalPaid >= $transaction->total_amount) {
            $transaction->payment_status = 'paid';
        } elseif ($totalPaid > 0) {
            $transaction->payment_status = 'partial';
        } else {
            $transaction->payment_status = 'due';
        }

        $transaction->save();
    }

    /**
     * Update cash balance
     */
    private function updateCashBalance(int $seasonId, float $amount, string $operation): void
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

    /**
     * Get customer balance for specific season
     */
    public function getCustomerBalance(Customer $customer, $seasonId = null)
    {
        $seasonId = $seasonId ?? Season::getCurrentSeason()->id;

        $balance = CustomerBalance::where('customer_id', $customer->id)
            ->where('season_id', $seasonId)
            ->first();

        if (!$balance) {
            return [
                'total_sales' => 0,
                'total_payments' => 0,
                'balance' => 0,
                'advance_payment' => 0,
                'status' => 'no_transaction',
                'last_transaction_date' => null,
                'last_payment_date' => null,
            ];
        }

        $status = 'clear';
        if ($balance->balance > 0) {
            $status = 'due';
        } elseif ($balance->advance_payment > 0) {
            $status = 'advance';
        }

        return [
            'total_sales' => $balance->total_sales,
            'total_payments' => $balance->total_payments,
            'balance' => $balance->balance,
            'advance_payment' => $balance->advance_payment,
            'status' => $status,
            'last_transaction_date' => $balance->last_transaction_date,
            'last_payment_date' => $balance->last_payment_date,
        ];
    }

    /**
     * Get payment statistics for dashboard
     */
    public function getPaymentStats($seasonId = null)
    {
        $seasonId = $seasonId ?? Season::getCurrentSeason()->id;

        return [
            'total_payments_today' => Payment::whereDate('payment_date', today())->sum('amount'),
            'total_payments_month' => Payment::whereMonth('payment_date', now()->month)
                ->whereYear('payment_date', now()->year)->sum('amount'),
            'total_payments_season' => Payment::where('season_id', $seasonId)->sum('amount'),
            'pending_payments' => Transaction::where('season_id', $seasonId)
                ->where('payment_status', '!=', 'paid')->sum('due_amount'),
        ];
    }
}
