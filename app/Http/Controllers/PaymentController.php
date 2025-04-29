<?php

namespace App\Http\Controllers;

use App\Models\Customer;
use App\Models\Transaction;
use App\Models\Payment;
use App\Models\Season;
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
        $payments = Payment::with(['customer', 'transaction'])
            ->latest()
            ->paginate(10);

        return Inertia::render('Payments/Index', [
            'payments' => $payments
        ]);
    }

    /**
     * Show the form for creating a new payment.
     */
    public function create()
    {
        $customers = Customer::all();

        // Get transactions with due amounts
        $transactions = Transaction::where('due_amount', '>', 0)
            ->with('customer')
            ->get();

        return Inertia::render('Payments/Create', [
            'customers' => $customers,
            'transactions' => $transactions
        ]);
    }

    /**
     * Store a newly created payment.
     */
    public function store(Request $request)
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

        DB::beginTransaction();

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

            DB::commit();

            return redirect()->route('payments.index')->with('success', 'Payment recorded successfully.');

        } catch (\Exception $e) {
            DB::rollBack();
            return redirect()->back()->with('error', 'Failed to record payment: ' . $e->getMessage());
        }
    }

    /**
     * Display payments for a specific customer.
     */
    public function customerPayments(Customer $customer)
    {
        $payments = Payment::where('customer_id', $customer->id)
            ->with('transaction')
            ->latest()
            ->get();

        $totalPaid = $payments->sum('amount');

        $transactions = Transaction::where('customer_id', $customer->id)
            ->latest()
            ->get();

        $totalTransactions = $transactions->sum('total_amount');
        $totalDue = $transactions->sum('due_amount');

        return Inertia::render('Payments/CustomerPayments', [
            'customer' => $customer,
            'payments' => $payments,
            'totalPaid' => $totalPaid,
            'totalTransactions' => $totalTransactions,
            'totalDue' => $totalDue
        ]);
    }
}
