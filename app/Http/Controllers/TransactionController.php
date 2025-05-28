<?php

namespace App\Http\Controllers;

use App\Models\CashBalance;
use App\Models\Customer;
use App\Models\CustomerBalance;
use App\Models\SackType;
use App\Models\Season;
use App\Models\Transaction;
use App\Models\TransactionItem;
use App\Models\Payment;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\ValidationException;

class TransactionController extends Controller
{
    /**
     * Display a listing of transactions.
     */
    public function index()
    {
        $currentSeason = Season::getCurrentSeason();

        $transactions = Transaction::with(['customer', 'items.sackType'])
            ->where('season_id', $currentSeason->id) // Only show current season transactions
            ->latest()
            ->paginate(1000);

        // Load customer balance data for each transaction
        foreach ($transactions as $transaction) {
            if ($transaction->customer) {
                $customerBalance = CustomerBalance::where('customer_id', $transaction->customer->id)
                    ->where('season_id', $currentSeason->id)
                    ->first();

                if ($customerBalance) {
                    $transaction->customer->balance = [
                        'total_sales' => $customerBalance->total_sales,
                        'total_payments' => $customerBalance->total_payments,
                        'balance' => $customerBalance->balance,
                        'advance_payment' => $customerBalance->advance_payment,
                        'last_transaction_date' => $customerBalance->last_transaction_date,
                        'last_payment_date' => $customerBalance->last_payment_date,
                    ];
                } else {
                    $transaction->customer->balance = [
                        'total_sales' => 0,
                        'total_payments' => 0,
                        'balance' => 0,
                        'advance_payment' => 0,
                        'last_transaction_date' => null,
                        'last_payment_date' => null,
                    ];
                }
            }
        }

        return Inertia::render('Transactions/Index', [
            'transactions' => $transactions
        ]);
    }



    /**
     * Display the specified transaction.
     */
    public function show(Transaction $transaction)
    {
        $transaction->load(['customer', 'items.sackType', 'payments', 'season']);

        // Get customer balance from customer_balances table
        $customerBalance = CustomerBalance::where('customer_id', $transaction->customer_id)
            ->where('season_id', $transaction->season_id)
            ->first();

        // If no balance record exists, create default values
        if (!$customerBalance) {
            $balanceData = [
                'total_sales' => 0,
                'total_payments' => 0,
                'balance' => 0,
                'advance_payment' => 0,
                'last_transaction_date' => null,
                'last_payment_date' => null,
            ];
        } else {
            $balanceData = [
                'total_sales' => $customerBalance->total_sales,
                'total_payments' => $customerBalance->total_payments,
                'balance' => $customerBalance->balance,
                'advance_payment' => $customerBalance->advance_payment,
                'last_transaction_date' => $customerBalance->last_transaction_date,
                'last_payment_date' => $customerBalance->last_payment_date,
            ];
        }

        // Add balance data to customer relationship
        $transaction->customer->balance = $balanceData;

        return Inertia::render('Transactions/Show', [
            'transaction' => $transaction
        ]);
    }


    private function calculateTransactionTotals(array $items, float $paidAmount): array
    {
        $total = 0;
        foreach ($items as $item) {
            // Ensure quantity is treated as float for decimal support
            $quantity = floatval($item['quantity']);
            $unitPrice = floatval($item['unit_price']);
            $total += $quantity * $unitPrice;
        }

        return [
            'total' => round($total, 2),  // Round to 2 decimal places
            'paid' => $paidAmount,
            'due' => max(0, round($total - $paidAmount, 2)),
            'status' => $this->determinePaymentStatus($total, $paidAmount)
        ];
    }

    private function updateCustomerBalance(int $customerId, int $seasonId, float $saleAmount = 0, float $paymentAmount = 0, ?string $transactionDate = null, ?string $paymentDate = null): void
    {
        $customerBalance = CustomerBalance::firstOrCreate(
            ['customer_id' => $customerId, 'season_id' => $seasonId],
            ['total_sales' => 0, 'total_payments' => 0, 'balance' => 0, 'advance_payment' => 0]
        );

        // Update sales
        if ($saleAmount > 0) {
            $customerBalance->total_sales += $saleAmount;
            if ($transactionDate) {
                $customerBalance->last_transaction_date = $transactionDate;
            }
        }

        // Update payments
        if ($paymentAmount > 0) {
            $customerBalance->total_payments += $paymentAmount;
            if ($paymentDate) {
                $customerBalance->last_payment_date = $paymentDate;
            }
        }

        // Calculate new balance
        $newBalance = $customerBalance->total_sales - $customerBalance->total_payments;

        if ($newBalance >= 0) {
            $customerBalance->balance = $newBalance;
            $customerBalance->advance_payment = 0;
        } else {
            $customerBalance->balance = 0;
            $customerBalance->advance_payment = abs($newBalance);
        }

        $customerBalance->save();
    }

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

    private function determinePaymentStatus(float $totalAmount, float $paidAmount): string
    {
        // Round both amounts to avoid floating point precision issues
        $total = round($totalAmount, 2);
        $paid = round($paidAmount, 2);

        if ($paid <= 0) {
            return 'unpaid';
        } elseif ($paid >= $total) {
            return 'paid';
        } else {
            return 'partial';
        }
    }

    /**
     * Get payment status text for display (optional helper)
     */
    public static function getPaymentStatusText(string $status): string
    {
        return match ($status) {
            'paid' => 'Paid',
            'partial' => 'Partially Paid',
            'unpaid' => 'Unpaid',
            default => 'Unknown'
        };
    }

    /**
     * Get payment status CSS class for styling (optional helper)
     */
    public static function getPaymentStatusClass(string $status): string
    {
        return match ($status) {
            'paid' => 'bg-green-100 text-green-800',
            'partial' => 'bg-yellow-100 text-yellow-800',
            'unpaid' => 'bg-red-100 text-red-800',
            default => 'bg-gray-100 text-gray-800'
        };
    }


    /**
     * Remove the specified transaction from storage.
     */
    public function destroy(Transaction $transaction)
    {
        try {
            DB::transaction(function () use ($transaction) {

                // Step 1: Get original payment amount from customer balance (not transaction)
                $originalPaymentAmount = $this->getCustomerPaymentAmountForTransaction($transaction);

                // Step 2: Reverse customer balance impact
                $this->reverseCustomerBalance(
                    $transaction->customer_id,
                    $transaction->season_id,
                    $transaction->total_amount,
                    $originalPaymentAmount
                );

                // Step 3: Reverse cash balance impact based on actual payments
                if ($originalPaymentAmount > 0) {
                    $this->updateCashBalance($transaction->season_id, $originalPaymentAmount, 'subtract');
                }

                // Step 4: Delete all related payments
                $transaction->payments()->delete();

                // Step 5: Delete all transaction items
                $transaction->items()->delete();

                // Step 6: Delete the main transaction
                $transaction->delete();
            });

            return redirect()->route('transactions.index')
                ->with('success', 'Transaction deleted successfully!');

        } catch (\Exception $e) {
            Log::error('Transaction deletion failed', [
                'transaction_id' => $transaction->id,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            return redirect()->back()
                ->with('error', 'Failed to delete transaction. Please try again.');
        }
    }

    public function edit(Transaction $transaction)
    {
        $transaction->load(['customer', 'items.sackType', 'season', 'payments']);

        // Format transaction_date for HTML date input
        if ($transaction->transaction_date) {
            $transaction->transaction_date = Carbon::parse($transaction->transaction_date)->format('Y-m-d');
        }

        // Format payment dates
        if ($transaction->payments) {
            foreach ($transaction->payments as $payment) {
                if ($payment->payment_date) {
                    $payment->payment_date = Carbon::parse($payment->payment_date)->format('Y-m-d');
                }
            }
        }

        $customers = Customer::select('id', 'name')->orderBy('name')->get();

        // Include price in sackTypes for auto-filling
        $sackTypes = SackType::select('id', 'name', 'price')->orderBy('name')->get();

        $seasons = Season::select('id', 'name')->orderBy('name')->get();

        // Debug: Check if data is loading properly
        Log::info('Edit Transaction Data', [
            'transaction_id' => $transaction->id,
            'formatted_date' => $transaction->transaction_date,
            'sack_types_count' => $sackTypes->count(),
            'payments_count' => $transaction->payments->count(),
            'transaction_data' => [
                'customer_id' => $transaction->customer_id,
                'total_amount' => $transaction->total_amount,
                'items_count' => $transaction->items->count()
            ]
        ]);

        return Inertia::render('Transactions/Edit', [
            'transaction' => $transaction,
            'customers' => $customers,
            'sackTypes' => $sackTypes,
            'seasons' => $seasons
        ]);
    }

    /**
     * Update the specified transaction in storage.
     */
/**
 * Update the specified transaction in storage.
 * Fixed version focusing on proper balance calculations
 */
public function update(Request $request, Transaction $transaction)
{
    Log::info('Transaction Update Started', [
        'transaction_id' => $transaction->id,
        'original_total' => $transaction->total_amount,
        'original_paid' => $transaction->paid_amount
    ]);

    try {
        // Clean up items data
        $items = $request->input('items', []);
        foreach ($items as $index => $item) {
            if (isset($item['sack_type_id']) && ($item['sack_type_id'] === 0 || $item['sack_type_id'] === '')) {
                $items[$index]['sack_type_id'] = null;
            }
            if (isset($item['quantity'])) {
                $items[$index]['quantity'] = floatval($item['quantity']);
            }
            if (isset($item['unit_price'])) {
                $items[$index]['unit_price'] = floatval($item['unit_price']);
            }
        }
        $request->merge(['items' => $items]);

        $validated = $this->validateTransactionData($request);
        $seasonId = $validated['season_id'] ?? Season::getCurrentSeason()->id;

        // Get original transaction data
        $originalCustomerId = $transaction->customer_id;
        $originalSeasonId = $transaction->season_id;
        $originalTotalAmount = $transaction->total_amount;

        // Get ACTUAL payments made for this transaction (from payments table)
        $originalActualPayments = Payment::where('transaction_id', $transaction->id)->sum('amount');

        Log::info('Original Data', [
            'customer_id' => $originalCustomerId,
            'season_id' => $originalSeasonId,
            'total_amount' => $originalTotalAmount,
            'transaction_paid_amount' => $transaction->paid_amount, // This might be wrong
            'actual_payments_from_table' => $originalActualPayments // This is correct
        ]);

        // Calculate new totals
        $newTotalAmount = 0;
        foreach ($validated['items'] as $item) {
            $newTotalAmount += floatval($item['quantity']) * floatval($item['unit_price']);
        }
        $newTotalAmount = round($newTotalAmount, 2);

        $additionalPayment = floatval($validated['paid_amount']); // This is ADDITIONAL payment

        Log::info('New Calculations', [
            'new_total_amount' => $newTotalAmount,
            'additional_payment' => $additionalPayment,
            'existing_payments' => $originalActualPayments
        ]);

        DB::transaction(function () use ($validated, $seasonId, $transaction, $originalCustomerId, $originalSeasonId, $originalTotalAmount, $originalActualPayments, $newTotalAmount, $additionalPayment) {

            // Step 1: Reverse original customer balance impact
            Log::info('Step 1: Reversing original customer balance');
            $this->reverseCustomerBalanceCorrect(
                $originalCustomerId,
                $originalSeasonId,
                $originalTotalAmount,      // Remove original sale
                $originalActualPayments    // Remove original payments
            );

            // Step 2: Reverse original cash balance (only actual payments)
            if ($originalActualPayments > 0) {
                Log::info('Step 2: Reversing cash balance', ['amount' => $originalActualPayments]);
                $this->updateCashBalance($originalSeasonId, $originalActualPayments, 'subtract');
            }

            // Step 3: Delete existing items and payments
            Log::info('Step 3: Deleting existing data');
            $transaction->items()->delete();
            $transaction->payments()->delete();

            // Step 4: Create new transaction items
            Log::info('Step 4: Creating new items');
            foreach ($validated['items'] as $item) {
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

            // Step 5: Calculate final amounts
            $totalNewPayments = $originalActualPayments + $additionalPayment;
            $finalDueAmount = max(0, $newTotalAmount - $totalNewPayments);
            $paymentStatus = $this->determinePaymentStatus($newTotalAmount, $totalNewPayments);

            Log::info('Step 5: Final calculations', [
                'new_total' => $newTotalAmount,
                'existing_payments' => $originalActualPayments,
                'additional_payment' => $additionalPayment,
                'total_payments' => $totalNewPayments,
                'due_amount' => $finalDueAmount,
                'status' => $paymentStatus
            ]);

            // Step 6: Update transaction record
            $transaction->update([
                'customer_id' => $validated['customer_id'],
                'season_id' => $seasonId,
                'transaction_date' => $validated['transaction_date'],
                'total_amount' => $newTotalAmount,
                'paid_amount' => $totalNewPayments, // Total of all payments
                'due_amount' => $finalDueAmount,
                'payment_status' => $paymentStatus,
                'notes' => $validated['notes'],
            ]);

            // Step 7: Add new sale to customer balance
            Log::info('Step 7: Adding new sale to customer balance');
            $this->updateCustomerBalanceCorrect(
                $validated['customer_id'],
                $seasonId,
                $newTotalAmount, // Add new sale
                0,               // No payment yet
                $validated['transaction_date'],
                null
            );

            // Step 8: Re-create existing payments
            if ($originalActualPayments > 0) {
                Log::info('Step 8: Re-creating existing payments');

                Payment::create([
                    'customer_id' => $validated['customer_id'],
                    'transaction_id' => $transaction->id,
                    'season_id' => $seasonId,
                    'payment_date' => $validated['transaction_date'],
                    'amount' => $originalActualPayments,
                    'notes' => 'Existing payments restored after transaction update',
                    'received_by' => auth()->user()->name ?? 'System',
                ]);

                // Add existing payments back to customer balance
                $this->updateCustomerBalanceCorrect(
                    $validated['customer_id'],
                    $seasonId,
                    0,                      // No sale
                    $originalActualPayments, // Add existing payments
                    null,
                    $validated['transaction_date']
                );

                // Add existing payments back to cash balance
                $this->updateCashBalance($seasonId, $originalActualPayments, 'add');
            }

            // Step 9: Handle additional payment if provided
            if ($additionalPayment > 0) {
                Log::info('Step 9: Adding additional payment', ['amount' => $additionalPayment]);

                Payment::create([
                    'customer_id' => $validated['customer_id'],
                    'transaction_id' => $transaction->id,
                    'season_id' => $seasonId,
                    'payment_date' => $validated['transaction_date'],
                    'amount' => $additionalPayment,
                    'notes' => 'Additional payment during transaction update',
                    'received_by' => auth()->user()->name ?? 'System',
                ]);

                // Add additional payment to customer balance
                $this->updateCustomerBalanceCorrect(
                    $validated['customer_id'],
                    $seasonId,
                    0,                 // No sale
                    $additionalPayment, // Add additional payment
                    null,
                    $validated['transaction_date']
                );

                // Add additional payment to cash balance
                $this->updateCashBalance($seasonId, $additionalPayment, 'add');
            }

            Log::info('Transaction update completed successfully');
        });

        return redirect()->route('transactions.show', $transaction->id)
            ->with('success', 'Transaction updated successfully!');

    } catch (\Exception $e) {
        Log::error('Transaction update failed', [
            'transaction_id' => $transaction->id,
            'error' => $e->getMessage(),
            'trace' => $e->getTraceAsString()
        ]);

        return redirect()->back()
            ->withInput()
            ->with('error', 'Failed to update transaction. Error: ' . $e->getMessage());
    }
}

/**
 * Correct version of reverseCustomerBalance
 */
private function reverseCustomerBalanceCorrect(int $customerId, int $seasonId, float $saleAmount, float $paymentAmount): void
{
    Log::info('Reversing customer balance', [
        'customer_id' => $customerId,
        'season_id' => $seasonId,
        'sale_amount' => $saleAmount,
        'payment_amount' => $paymentAmount
    ]);

    $customerBalance = CustomerBalance::where('customer_id', $customerId)
        ->where('season_id', $seasonId)
        ->first();

    if (!$customerBalance) {
        Log::warning('No customer balance found to reverse');
        return;
    }

    Log::info('Customer balance before reverse', [
        'total_sales' => $customerBalance->total_sales,
        'total_payments' => $customerBalance->total_payments,
        'balance' => $customerBalance->balance,
        'advance_payment' => $customerBalance->advance_payment
    ]);

    // Reverse the amounts
    $customerBalance->total_sales = max(0, $customerBalance->total_sales - $saleAmount);
    $customerBalance->total_payments = max(0, $customerBalance->total_payments - $paymentAmount);

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

    Log::info('Customer balance after reverse', [
        'total_sales' => $customerBalance->total_sales,
        'total_payments' => $customerBalance->total_payments,
        'balance' => $customerBalance->balance,
        'advance_payment' => $customerBalance->advance_payment
    ]);
}

/**
 * Correct version of updateCustomerBalance
 */
private function updateCustomerBalanceCorrect(int $customerId, int $seasonId, float $saleAmount = 0, float $paymentAmount = 0, ?string $transactionDate = null, ?string $paymentDate = null): void
{
    Log::info('Updating customer balance', [
        'customer_id' => $customerId,
        'season_id' => $seasonId,
        'sale_amount' => $saleAmount,
        'payment_amount' => $paymentAmount
    ]);

    $customerBalance = CustomerBalance::firstOrCreate(
        ['customer_id' => $customerId, 'season_id' => $seasonId],
        ['total_sales' => 0, 'total_payments' => 0, 'balance' => 0, 'advance_payment' => 0]
    );

    Log::info('Customer balance before update', [
        'total_sales' => $customerBalance->total_sales,
        'total_payments' => $customerBalance->total_payments,
        'balance' => $customerBalance->balance,
        'advance_payment' => $customerBalance->advance_payment
    ]);

    // Update sales
    if ($saleAmount > 0) {
        $customerBalance->total_sales += $saleAmount;
        if ($transactionDate) {
            $customerBalance->last_transaction_date = $transactionDate;
        }
    }

    // Update payments
    if ($paymentAmount > 0) {
        $customerBalance->total_payments += $paymentAmount;
        if ($paymentDate) {
            $customerBalance->last_payment_date = $paymentDate;
        }
    }

    // Calculate new balance
    $newBalance = $customerBalance->total_sales - $customerBalance->total_payments;

    if ($newBalance >= 0) {
        $customerBalance->balance = $newBalance;
        $customerBalance->advance_payment = 0;
    } else {
        $customerBalance->balance = 0;
        $customerBalance->advance_payment = abs($newBalance);
    }

    $customerBalance->save();

    Log::info('Customer balance after update', [
        'total_sales' => $customerBalance->total_sales,
        'total_payments' => $customerBalance->total_payments,
        'balance' => $customerBalance->balance,
        'advance_payment' => $customerBalance->advance_payment
    ]);
}

    /**
     * Enhanced createTransactionItems method with logging
     */
    private function createTransactionItems(Transaction $transaction, array $items): void
    {
        Log::info('Creating transaction items', [
            'transaction_id' => $transaction->id,
            'items_count' => count($items)
        ]);

        foreach ($items as $index => $item) {
            Log::info('Processing item', [
                'index' => $index,
                'item' => $item
            ]);

            // Validate item data
            if (!isset($item['sack_type_id']) || !isset($item['quantity']) || !isset($item['unit_price'])) {
                Log::error('Invalid item data', [
                    'index' => $index,
                    'item' => $item
                ]);
                throw new \Exception("Invalid item data at index {$index}");
            }

            $quantity = floatval($item['quantity']);
            $unitPrice = floatval($item['unit_price']);
            $totalPrice = round($quantity * $unitPrice, 2);

            $createdItem = $transaction->items()->create([
                'sack_type_id' => $item['sack_type_id'],
                'quantity' => $quantity,
                'unit_price' => $unitPrice,
                'total_price' => $totalPrice,
            ]);

            Log::info('Item created', [
                'item_id' => $createdItem->id,
                'data' => [
                    'sack_type_id' => $item['sack_type_id'],
                    'quantity' => $quantity,
                    'unit_price' => $unitPrice,
                    'total_price' => $totalPrice,
                ]
            ]);
        }
    }

    /**
     * Enhanced validation method with better error messages
     */
    private function validateTransactionData(Request $request): array
    {
        Log::info('Validating transaction data', [
            'request_data' => $request->all()
        ]);

        $rules = [
            'customer_id' => 'required|exists:customers,id',
            'season_id' => 'nullable|exists:seasons,id',
            'transaction_date' => 'required|date|before_or_equal:today',
            'paid_amount' => 'required|numeric|min:0',
            'notes' => 'nullable|string|max:1000',
            'items' => 'required|array|min:1|max:20',
            'items.*.sack_type_id' => 'required|exists:sack_types,id',
            'items.*.quantity' => 'required|numeric|min:0.1|max:999999.99',
            'items.*.unit_price' => 'required|numeric|min:0|max:999999.99',
        ];

        $messages = [
            'items.*.sack_type_id.required' => 'Please select a sack type for all items.',
            'items.*.sack_type_id.exists' => 'Selected sack type is invalid.',
            'items.*.quantity.required' => 'Quantity is required for all items.',
            'items.*.quantity.min' => 'Quantity must be at least 0.1.',
            'items.*.unit_price.required' => 'Unit price is required for all items.',
            'items.*.unit_price.min' => 'Unit price cannot be negative.',
        ];

        try {
            $validated = $request->validate($rules, $messages);
            Log::info('Validation successful');
            return $validated;
        } catch (ValidationException $e) {
            Log::error('Validation failed', [
                'errors' => $e->errors(),
                'rules' => $rules
            ]);
            throw $e;
        }
    }

    /**
     * Get the actual payment amount for this transaction from payments table
     */
    private function getCustomerPaymentAmountForTransaction(Transaction $transaction): float
    {
        // Get total payments made for this specific transaction
        $totalPayments = Payment::where('transaction_id', $transaction->id)->sum('amount');

        return $totalPayments;
    }

    /**
     * Reverse customer balance changes for the given transaction
     */
    private function reverseCustomerBalance(int $customerId, int $seasonId, float $saleAmount, float $actualPaymentAmount): void
    {
        $customerBalance = CustomerBalance::where('customer_id', $customerId)
            ->where('season_id', $seasonId)
            ->first();

        if (!$customerBalance) {
            return; // No balance record to reverse
        }

        // Reverse the sale amount
        $customerBalance->total_sales -= $saleAmount;

        // Reverse the actual payment amount (not transaction paid_amount)
        $customerBalance->total_payments -= $actualPaymentAmount;

        // Ensure values don't go negative
        $customerBalance->total_sales = max(0, $customerBalance->total_sales);
        $customerBalance->total_payments = max(0, $customerBalance->total_payments);

        // Recalculate balance
        $newBalance = $customerBalance->total_sales - $customerBalance->total_payments;

        if ($newBalance >= 0) {
            $customerBalance->balance = $newBalance;
            $customerBalance->advance_payment = 0;
        } else {
            $customerBalance->balance = 0;
            $customerBalance->advance_payment = abs($newBalance);
        }

        // Update last transaction date if this was the latest transaction
        $latestTransaction = Transaction::where('customer_id', $customerId)
            ->where('season_id', $seasonId)
            ->where('id', '!=', request()->route('transaction')->id ?? 0) // Exclude current transaction being deleted
            ->latest('transaction_date')
            ->first();

        $customerBalance->last_transaction_date = $latestTransaction ? $latestTransaction->transaction_date : null;

        // Update last payment date if this transaction had payments
        $latestPayment = Payment::whereHas('transaction', function ($query) use ($customerId, $seasonId) {
            $query->where('customer_id', $customerId)
                ->where('season_id', $seasonId)
                ->where('id', '!=', request()->route('transaction')->id ?? 0); // Exclude current transaction
        })->latest('payment_date')->first();

        $customerBalance->last_payment_date = $latestPayment ? $latestPayment->payment_date : null;

        $customerBalance->save();
    }

    /**
     * Update cash balance (same as DashboardController)
     */
    private function updateCashBalance(int $seasonId, float $amount, string $operation): void
    {
        $cashBalance = CashBalance::firstOrCreate(
            ['season_id' => $seasonId],
            ['amount' => 0, 'last_updated' => now()]
        );

        if ($operation === 'add') {
            $cashBalance->amount += $amount;
        } elseif ($operation === 'subtract') {
            $cashBalance->amount -= $amount;
        }

        $cashBalance->last_updated = now();
        $cashBalance->save();
    }

    /**
     * Process payment for transaction (updated to include cash balance)
     */
    private function processTransactionPayment(Transaction $transaction, array $validated, int $seasonId, float $paidAmount): void
    {
        // Create payment record
        Payment::create([
            'customer_id' => $validated['customer_id'],
            'transaction_id' => $transaction->id,
            'season_id' => $seasonId,
            'payment_date' => $validated['transaction_date'],
            'amount' => $paidAmount,
            'notes' => 'Initial payment with transaction',
            'received_by' => auth()->user()->name ?? 'System',
        ]);

        // Update customer balance with payment
        $this->updateCustomerBalance(
            $validated['customer_id'],
            $seasonId,
            0,
            $paidAmount,
            null,
            $validated['transaction_date']
        );

        // Update cash balance with payment
        $this->updateCashBalance($seasonId, $paidAmount, 'add');
    }
    /**
     * Reverse customer balance changes for the given transaction
     */



}
