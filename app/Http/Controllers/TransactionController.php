<?php

namespace App\Http\Controllers;

use App\Models\Customer;
use App\Models\SackType;
use App\Models\Season;
use App\Models\Transaction;
use App\Models\TransactionItem;
use App\Models\Payment;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;

class TransactionController extends Controller
{
    /**
     * Display a listing of transactions.
     */
    public function index()
    {
        $transactions = Transaction::with(['customer', 'items.sackType'])
            ->latest()
            ->paginate(10);

        return Inertia::render('Transactions/Index', [
            'transactions' => $transactions
        ]);
    }

    /**
     * Show the form for creating a new transaction.
     */
    public function create()
    {
        $customers = Customer::all();
        $sackTypes = SackType::all();
        $currentSeason = Season::getCurrentSeason();

        return Inertia::render('Transactions/Create', [
            'customers' => $customers,
            'sackTypes' => $sackTypes,
            'currentSeason' => $currentSeason
        ]);
    }

    /**
     * Store a newly created transaction.
     */
    public function store(Request $request)
    {
        $request->validate([
            'customer_id' => 'required|exists:customers,id',
            'transaction_date' => 'required|date',
            'paid_amount' => 'required|numeric|min:0',
            'notes' => 'nullable|string',
            'items' => 'required|array|min:1',
            'items.*.sack_type_id' => 'required|exists:sack_types,id',
            'items.*.quantity' => 'required|integer|min:1',
            'items.*.unit_price' => 'required|numeric|min:0',
        ]);

        // Get current season
        $season = Season::getCurrentSeason();

        // Calculate totals
        $totalAmount = 0;
        foreach ($request->items as $item) {
            $totalAmount += $item['quantity'] * $item['unit_price'];
        }

        $paidAmount = $request->paid_amount;
        $dueAmount = $totalAmount - $paidAmount;

        // Set payment status
        $paymentStatus = 'due';
        if ($dueAmount <= 0) {
            $paymentStatus = 'paid';
        } elseif ($paidAmount > 0) {
            $paymentStatus = 'partial';
        }

        DB::beginTransaction();

        try {
            // Create transaction
            $transaction = Transaction::create([
                'customer_id' => $request->customer_id,
                'season_id' => $season->id,
                'transaction_date' => $request->transaction_date,
                'total_amount' => $totalAmount,
                'paid_amount' => $paidAmount,
                'due_amount' => $dueAmount,
                'payment_status' => $paymentStatus,
                'notes' => $request->notes,
            ]);

            // Create transaction items
            foreach ($request->items as $item) {
                TransactionItem::create([
                    'transaction_id' => $transaction->id,
                    'sack_type_id' => $item['sack_type_id'],
                    'quantity' => $item['quantity'],
                    'unit_price' => $item['unit_price'],
                    'total_price' => $item['quantity'] * $item['unit_price'],
                ]);
            }

            // Create payment record if paid amount is greater than 0
            if ($paidAmount > 0) {
                Payment::create([
                    'customer_id' => $request->customer_id,
                    'transaction_id' => $transaction->id,
                    'season_id' => $season->id,
                    'payment_date' => $request->transaction_date,
                    'amount' => $paidAmount,
                    'notes' => 'Payment made during transaction',
                ]);
            }

            DB::commit();

            return redirect()->route('transactions.index')->with('success', 'Transaction created successfully.');

        } catch (\Exception $e) {
            DB::rollBack();
            return redirect()->back()->with('error', 'Failed to create transaction: ' . $e->getMessage());
        }
    }

    /**
     * Display the specified transaction.
     */
    public function show(Transaction $transaction)
    {
        $transaction->load(['customer', 'items.sackType', 'payments']);

        return Inertia::render('Transactions/Show', [
            'transaction' => $transaction
        ]);
    }
}
