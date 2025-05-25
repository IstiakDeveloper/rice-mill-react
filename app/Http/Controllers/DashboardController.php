<?php

namespace App\Http\Controllers;

use App\Models\Customer;
use App\Models\Season;
use App\Models\Transaction;
use App\Models\Payment;
use App\Models\SackType;
use App\Models\CashBalance;
use App\Models\CustomerBalance;
use App\Models\Expense;
use App\Models\FundInput;
use App\Models\AdditionalIncome;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\ValidationException;

class DashboardController extends Controller
{
    /**
     * Display the dashboard with all necessary data.
     */
    public function index()
    {
        try {
            // Get current season
            $currentSeason = Season::getCurrentSeason();

            // Collect dashboard data
            $dashboardData = $this->collectDashboardData($currentSeason);

            return Inertia::render('Dashboard', $dashboardData);
        } catch (\Exception $e) {
            Log::error('Dashboard loading failed', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            return redirect()->back()->with('error', 'Unable to load dashboard. Please try again.');
        }
    }

    /**
     * Create a new transaction with items and handle payments.
     */
    public function storeTransaction(Request $request)
    {
        try {
            $validated = $this->validateTransactionData($request);
            $seasonId = $validated['season_id'] ?? Season::getCurrentSeason()->id;

            // Calculate transaction totals
            $totals = $this->calculateTransactionTotals($validated['items'], $validated['paid_amount']);

            DB::transaction(function () use ($validated, $seasonId, $totals) {
                // Create main transaction record
                $transaction = $this->createTransactionRecord($validated, $seasonId, $totals);

                // Create transaction items
                $this->createTransactionItems($transaction, $validated['items']);

                // Update customer balance with sale
                $this->updateCustomerBalance(
                    $validated['customer_id'],
                    $seasonId,
                    $totals['total'],
                    0,
                    $validated['transaction_date']
                );

                // Handle payment if provided
                if ($totals['paid'] > 0) {
                    $this->processTransactionPayment($transaction, $validated, $seasonId, $totals['paid']);
                }
            });

            return redirect()->route('dashboard')->with('success', 'Sale transaction created successfully!');
        } catch (ValidationException $e) {
            return redirect()->back()
                ->withErrors($e->errors())
                ->withInput()
                ->with('error', 'Please check the form data and try again.');
        } catch (\Exception $e) {
            Log::error('Transaction creation failed', [
                'customer_id' => $request->customer_id ?? null,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            return redirect()->back()
                ->withInput()
                ->with('error', 'Failed to create transaction. Please try again.');
        }
    }

    /**
     * Record a customer payment.
     */
    public function storePayment(Request $request)
    {
        try {
            $validated = $this->validatePaymentData($request);
            $seasonId = $validated['season_id'] ?? Season::getCurrentSeason()->id;

            DB::transaction(function () use ($validated, $seasonId) {
                // Create payment record
                $payment = $this->createPaymentRecord($validated, $seasonId);

                // Update customer balance
                $this->updateCustomerBalance(
                    $validated['customer_id'],
                    $seasonId,
                    0,
                    $validated['amount'],
                    null,
                    $validated['payment_date']
                );

                // Update linked transaction if specified
                if (!empty($validated['transaction_id'])) {
                    $this->updateTransactionPaymentStatus($validated['transaction_id'], $validated['amount']);
                }

                // Update cash balance
                $this->updateCashBalance($seasonId, $validated['amount'], 'add');
            });

            return redirect()->route('dashboard')->with('success', 'Payment recorded successfully!');
        } catch (ValidationException $e) {
            return redirect()->back()
                ->withErrors($e->errors())
                ->withInput()
                ->with('error', 'Please check the payment information and try again.');
        } catch (\Exception $e) {
            Log::error('Payment recording failed', [
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
     * Add a new customer.
     */
    public function storeCustomer(Request $request)
    {
        try {
            // Validate input
            $validated = $request->validate([
                'name' => 'required|string|max:255',
                'area' => 'nullable|string',
                'phone_number' => 'nullable|string',
                'image' => 'nullable|image|mimes:jpeg,png,jpg|max:2048',
            ]);

            // Handle image upload if provided
            if ($request->hasFile('image')) {
                $imagePath = $request->file('image')->store('customers', 'public');
                $validated['image'] = $imagePath;
            }

            // dd($validated);
            // Create customer
            Customer::create($validated);


            // Redirect with success message
            return redirect()->route('customer.index')->with('success', 'Customer added successfully!');
        } catch (\Illuminate\Validation\ValidationException $e) {
            // Redirect back with validation errors
            return redirect()->back()->withErrors($e->errors())->withInput();
        } catch (\Exception $e) {
            // Redirect with error message
            return redirect()->back()->with('error', 'Something went wrong. Please try again.')->withInput();
        }
    }


    /**
     * Add a new product/sack type.
     */
    public function storeSackType(Request $request)
    {
        try {
            $validated = $this->validateSackTypeData($request);

            $sackType = SackType::create($validated);

            return redirect()->route('dashboard')->with('success', 'Sack type created successfully!');
        } catch (ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Invalid product data provided.',
                'errors' => $e->errors()
            ], 422);
        } catch (\Exception $e) {
            Log::error('Sack type creation failed', [
                'name' => $request->name ?? null,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to add product. Please try again.'
            ], 500);
        }
    }

    /**
     * Switch the current active season.
     */
    public function switchSeason(Request $request)
    {
        try {
            $validated = $request->validate([
                'season_id' => 'required|exists:seasons,id'
            ]);

            session(['current_season_id' => $validated['season_id']]);

            $season = Season::find($validated['season_id']);

            return redirect()->route('dashboard')->with('success', "Successfully switched to season: {$season->name}");
        } catch (ValidationException $e) {
            return redirect()->back()->with('error', 'Invalid season selected.');
        } catch (\Exception $e) {
            Log::error('Season switching failed', [
                'season_id' => $request->season_id ?? null,
                'error' => $e->getMessage()
            ]);

            return redirect()->back()->with('error', 'Failed to switch season. Please try again.');
        }
    }

    /**
     * Get customer transactions with balance information.
     */
    public function getCustomerTransactions(Customer $customer)
    {
        try {
            $currentSeason = Season::getCurrentSeason();

            $transactions = Transaction::where('customer_id', $customer->id)
                ->where('season_id', $currentSeason->id)
                ->with(['season', 'items.sackType'])
                ->orderBy('transaction_date', 'desc')
                ->get();

            $payments = Payment::where('customer_id', $customer->id)
                ->where('season_id', $currentSeason->id)
                ->orderBy('payment_date', 'desc')
                ->get();

            $balance = $this->getCustomerBalance($customer, $currentSeason->id);

            return response()->json([
                'success' => true,
                'data' => [
                    'transactions' => $transactions,
                    'payments' => $payments,
                    'balance' => $balance,
                    'customer' => $customer,
                    'season' => $currentSeason
                ]
            ]);
        } catch (\Exception $e) {
            Log::error('Customer transactions retrieval failed', [
                'customer_id' => $customer->id,
                'error' => $e->getMessage()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to load customer transactions.'
            ], 500);
        }
    }

    /**
     * Get customer balance for specific season.
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

    // ============================================================================
    // PRIVATE HELPER METHODS
    // ============================================================================

    /**
     * Collect all dashboard data.
     */
    private function collectDashboardData(Season $currentSeason): array
    {
        $today = Carbon::today();

        return [
            // Season information
            'currentSeason' => $currentSeason,
            'seasons' => Season::orderBy('created_at', 'desc')->get(),

            // Today's statistics
            'todayTransactions' => Transaction::whereDate('transaction_date', $today)->sum('total_amount'),
            'todayPayments' => Payment::whereDate('payment_date', $today)->sum('amount'),
            'todayExpenses' => Expense::whereDate('expense_date', $today)->sum('amount'),

            // Season totals
            'seasonTransactions' => Transaction::where('season_id', $currentSeason->id)->sum('total_amount'),
            'seasonPayments' => Payment::where('season_id', $currentSeason->id)->sum('amount'),
            'seasonExpenses' => Expense::where('season_id', $currentSeason->id)->sum('amount'),
            'seasonFundInputs' => FundInput::where('season_id', $currentSeason->id)->sum('amount'),
            'seasonAdditionalIncomes' => AdditionalIncome::where('season_id', $currentSeason->id)->sum('amount'),

            // Customer balances
            'totalCustomerDue' => CustomerBalance::where('season_id', $currentSeason->id)
                ->where('balance', '>', 0)->sum('balance'),
            'totalCustomerAdvance' => CustomerBalance::where('season_id', $currentSeason->id)
                ->where('advance_payment', '>', 0)->sum('advance_payment'),

            // Cash balance
            'currentCashBalance' => optional(CashBalance::where('season_id', $currentSeason->id)->first())->amount ?? 0,

            // Calculated fields
            'seasonProfit' => $this->calculateSeasonProfit($currentSeason),

            // Recent activities
            'recentTransactions' => Transaction::with(['customer', 'season'])
                ->orderBy('transaction_date', 'desc')->take(5)->get(),
            'recentPayments' => Payment::with(['customer', 'season'])
                ->orderBy('payment_date', 'desc')->take(5)->get(),

            // Customer lists
            'customersWithDue' => CustomerBalance::with('customer')
                ->where('season_id', $currentSeason->id)
                ->where('balance', '>', 0)
                ->orderByDesc('balance')->take(10)->get(),
            'customersWithAdvance' => CustomerBalance::with('customer')
                ->where('season_id', $currentSeason->id)
                ->where('advance_payment', '>', 0)
                ->orderByDesc('advance_payment')->take(5)->get(),
            'topCustomers' => CustomerBalance::with('customer')
                ->where('season_id', $currentSeason->id)
                ->where('total_sales', '>', 0)
                ->orderByDesc('total_sales')->take(5)->get(),

            // Form data
            'customers' => Customer::orderBy('name')->get(),
            'sackTypes' => SackType::orderBy('name')->get(),
            'monthlyData' => $this->getMonthlyData($currentSeason),
        ];
    }

    /**
     * Calculate season profit/loss.
     */
    private function calculateSeasonProfit(Season $season): float
    {
        $totalIncome = Transaction::where('season_id', $season->id)->sum('total_amount') +
            AdditionalIncome::where('season_id', $season->id)->sum('amount');
        $totalExpenses = Expense::where('season_id', $season->id)->sum('amount');
        $fundInputs = FundInput::where('season_id', $season->id)->sum('amount');

        return ($totalIncome + $fundInputs) - $totalExpenses;
    }

    /**
     * Validate transaction request data.
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
     * Validate payment request data.
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
     * Validate customer request data.
     */
    private function validateCustomerData(Request $request): array
    {
        return $request->validate([
            'name' => 'required|string|max:255|min:2',
            'area' => 'required|string|max:255|min:2',
            'phone_number' => 'required|string|max:20|min:10|unique:customers,phone_number',
            'image' => 'nullable|image|mimes:jpeg,png,jpg,gif|max:2048',
        ]);
    }

    /**
     * Validate sack type request data.
     */
    private function validateSackTypeData(Request $request): array
    {
        return $request->validate([
            'name' => 'required|string|max:255|min:2|unique:sack_types,name',
            'price' => 'required|numeric|min:0|max:999999.99',
        ]);
    }

    /**
     * Calculate transaction totals.
     */
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

    /**
     * Create transaction record.
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
     * Create transaction items.
     */
    private function createTransactionItems(Transaction $transaction, array $items): void
    {
        foreach ($items as $item) {
            $quantity = floatval($item['quantity']);
            $unitPrice = floatval($item['unit_price']);
            $totalPrice = round($quantity * $unitPrice, 2);

            $transaction->items()->create([
                'sack_type_id' => $item['sack_type_id'],
                'quantity' => $quantity,  // Store as decimal
                'unit_price' => $unitPrice,
                'total_price' => $totalPrice,
            ]);
        }
    }

    /**
     * Process payment for transaction.
     */
    private function processTransactionPayment(Transaction $transaction, array $validated, int $seasonId, float $amount): void
    {
        Payment::create([
            'customer_id' => $validated['customer_id'],
            'transaction_id' => $transaction->id,
            'season_id' => $seasonId,
            'payment_date' => $validated['transaction_date'],
            'amount' => $amount,
            'notes' => 'Payment during transaction',
            'received_by' => auth()->user()->name ?? 'System',
        ]);

        $this->updateCustomerBalance(
            $validated['customer_id'],
            $seasonId,
            0,
            $amount,
            null,
            $validated['transaction_date']
        );

        $this->updateCashBalance($seasonId, $amount, 'add');
    }

    /**
     * Create payment record.
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
     * Handle image upload.
     */
    private function handleImageUpload($file, string $directory): string
    {
        return $file->store($directory, 'public');
    }

    /**
     * Update customer balance for both sales and payments.
     */
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

    /**
     * Update transaction payment status.
     */
    private function updateTransactionPaymentStatus(int $transactionId, float $amount): void
    {
        $transaction = Transaction::find($transactionId);
        if (!$transaction) {
            return;
        }

        $transaction->paid_amount += $amount;
        $transaction->due_amount = max(0, $transaction->total_amount - $transaction->paid_amount);
        $transaction->payment_status = $this->determinePaymentStatus(
            $transaction->total_amount,
            $transaction->paid_amount
        );
        $transaction->save();
    }

    /**
     * Update cash balance.
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
     * Determine payment status based on amounts.
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
     * Get monthly data for charts.
     */
    private function getMonthlyData(Season $season): array
    {
        $months = [];
        $currentDate = Carbon::now();

        for ($i = 5; $i >= 0; $i--) {
            $date = $currentDate->copy()->subMonths($i);
            $monthStart = $date->copy()->startOfMonth();
            $monthEnd = $date->copy()->endOfMonth();

            $transactions = Transaction::where('season_id', $season->id)
                ->whereBetween('transaction_date', [$monthStart, $monthEnd])
                ->sum('total_amount');

            $payments = Payment::where('season_id', $season->id)
                ->whereBetween('payment_date', [$monthStart, $monthEnd])
                ->sum('amount');

            $expenses = Expense::where('season_id', $season->id)
                ->whereBetween('expense_date', [$monthStart, $monthEnd])
                ->sum('amount');

            $months[] = [
                'month' => $date->format('M Y'),
                'transactions' => $transactions,
                'payments' => $payments,
                'expenses' => $expenses,
                'profit' => $transactions - $expenses,
            ];
        }

        return $months;
    }
}
