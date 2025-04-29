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

class DashboardController extends Controller
{
    /**
     * Display the dashboard.
     */
    public function index()
    {
        // Get current season
        $currentSeason = Season::getCurrentSeason();

        // Today's transactions and payments
        $today = Carbon::today();
        $todayTransactions = Transaction::whereDate('transaction_date', $today)->sum('total_amount');
        $todayPayments = Payment::whereDate('payment_date', $today)->sum('amount');

        // Season totals
        $seasonTransactions = Transaction::where('season_id', $currentSeason->id)->sum('total_amount');
        $seasonPayments = Payment::where('season_id', $currentSeason->id)->sum('amount');
        $seasonDue = Transaction::where('season_id', $currentSeason->id)->sum('due_amount');

        // Recent transactions
        $recentTransactions = Transaction::with('customer')
            ->latest()
            ->take(5)
            ->get();

        // Recent payments
        $recentPayments = Payment::with('customer')
            ->latest()
            ->take(5)
            ->get();

        // Customers with due
        $customersWithDue = Customer::whereHas('transactions', function ($query) {
            $query->where('due_amount', '>', 0);
        })
            ->withSum('transactions as total_due', 'due_amount')
            ->orderByDesc('total_due')
            ->take(5)
            ->get();

        // Get all customers, sack types for modal forms
        $customers = Customer::all();
        $sackTypes = SackType::all();

        return Inertia::render('Dashboard', [
            'currentSeason' => $currentSeason,
            'todayTransactions' => $todayTransactions,
            'todayPayments' => $todayPayments,
            'seasonTransactions' => $seasonTransactions,
            'seasonPayments' => $seasonPayments,
            'seasonDue' => $seasonDue,
            'recentTransactions' => $recentTransactions,
            'recentPayments' => $recentPayments,
            'customersWithDue' => $customersWithDue,
            'customers' => $customers,
            'sackTypes' => $sackTypes,
        ]);
    }

    /**
     * Store a transaction directly from dashboard.
     */
    public function storeTransaction(Request $request)
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

        \DB::beginTransaction();

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
                $transaction->items()->create([
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

            \DB::commit();

            return redirect()->route('dashboard')->with('success', 'লেনদেন সফলভাবে সম্পন্ন হয়েছে');

        } catch (\Exception $e) {
            \DB::rollBack();
            return redirect()->back()->with('error', 'লেনদেন সম্পন্ন করতে ত্রুটি: ' . $e->getMessage());
        }
    }

    /**
     * Store a payment directly from dashboard.
     */
    public function storePayment(Request $request)
    {
        $request->validate([
            'customer_id' => 'required|exists:customers,id',
            'transaction_id' => 'nullable|exists:transactions,id',
            'payment_date' => 'required|date',
            'amount' => 'required|numeric|min:0.01',
            'notes' => 'nullable|string',
        ]);

        // Get current season
        $season = Season::getCurrentSeason();

        \DB::beginTransaction();

        try {
            // Create payment
            $payment = Payment::create([
                'customer_id' => $request->customer_id,
                'transaction_id' => $request->transaction_id,
                'season_id' => $season->id,
                'payment_date' => $request->payment_date,
                'amount' => $request->amount,
                'notes' => $request->notes,
            ]);

            // Update transaction if linked
            if ($request->transaction_id) {
                $transaction = Transaction::find($request->transaction_id);
                $transaction->paid_amount += $request->amount;
                $transaction->due_amount = $transaction->total_amount - $transaction->paid_amount;

                // Update payment status
                if ($transaction->due_amount <= 0) {
                    $transaction->payment_status = 'paid';
                } else {
                    $transaction->payment_status = 'partial';
                }

                $transaction->save();
            }

            \DB::commit();

            return redirect()->route('dashboard')->with('success', 'পেমেন্ট সফলভাবে সম্পন্ন হয়েছে');

        } catch (\Exception $e) {
            \DB::rollBack();
            return redirect()->back()->with('error', 'পেমেন্ট সম্পন্ন করতে ত্রুটি: ' . $e->getMessage());
        }
    }

    /**
     * Store a customer directly from dashboard.
     */
    public function storeCustomer(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'area' => 'required|string|max:255',
            'phone_number' => 'required|string|max:20',
            'image' => 'nullable|image|max:2048',
        ]);

        if ($request->hasFile('image')) {
            $validated['image'] = $request->file('image')->store('customers', 'public');
        }

        Customer::create($validated);

        return redirect()->route('dashboard')->with('success', 'গ্রাহক সফলভাবে যোগ করা হয়েছে');
    }

    /**
     * Store a sack type directly from dashboard.
     */
    public function storeSackType(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'price' => 'required|numeric|min:0',
        ]);

        SackType::create($validated);

        return redirect()->route('dashboard')->with('success', 'বস্তার ধরন সফলভাবে যোগ করা হয়েছে');
    }
}
