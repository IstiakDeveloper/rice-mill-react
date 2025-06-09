<?php

namespace App\Http\Controllers;

use App\Models\Customer;
use App\Models\Season;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class CustomerController extends Controller
{
    /**
     * Display a listing of customers with their transaction summary.
     */
    public function index()
    {
        $currentSeason = Season::latest()->first();

        $customers = Customer::with([
            'customerBalances' => function ($query) use ($currentSeason) {
                if ($currentSeason) {
                    $query->where('season_id', $currentSeason->id);
                }
            },
            'transactions' => function ($query) use ($currentSeason) {
                if ($currentSeason) {
                    $query->where('season_id', $currentSeason->id)
                        ->with(['transactionItems.sackType']);
                }
            },
            'payments' => function ($query) use ($currentSeason) {
                if ($currentSeason) {
                    $query->where('season_id', $currentSeason->id);
                }
            }
        ])
            ->get()
            ->map(function ($customer) use ($currentSeason) {
                $balance = $customer->customerBalances->first();

                // Calculate total sacks purchased
                $totalSacks = $customer->transactions->flatMap(function ($transaction) {
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
                    'advance_payment' => $advancePayment,
                    'last_transaction_date' => $latestTransaction ? $latestTransaction->transaction_date : null,
                    'last_payment_date' => $latestPayment ? $latestPayment->payment_date : null,
                    'payment_status' => $this->getPaymentStatus($remainingBalance, $advancePayment),
                    'transaction_count' => $customer->transactions->count(),
                    'payment_count' => $customer->payments->count(),
                ];
            });

        $seasons = Season::orderBy('name')->get();

        $existingAreas = Customer::distinct()
            ->whereNotNull('area')
            ->where('area', '!=', '')
            ->pluck('area')
            ->filter()
            ->sort()
            ->values();

        return Inertia::render('Customers/Index', [
            'customers' => $customers,
            'seasons' => $seasons,
            'currentSeason' => $currentSeason,
            'existingAreas' => $existingAreas,

        ]);
    }

    /**
     * Show the form for creating a new customer.
     */
    public function create()
    {
        return Inertia::render('Customers/Create');
    }

    /**
     * Store a newly created customer.
     */
    public function store(Request $request)
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

        return redirect()->route('customers.index')
            ->with('success', 'Customer created successfully.');
    }

    /**
     * Display the specified customer with detailed information.
     */
    public function show(Customer $customer)
    {
        $seasons = Season::orderBy('name')->get();
        $currentSeason = Season::latest()->first();

        $customerData = $customer->load([
            'customerBalances.season',
            'transactions' => function ($query) {
                $query->with(['season', 'transactionItems.sackType'])
                    ->orderBy('transaction_date', 'desc');
            },
            'payments' => function ($query) {
                $query->with('season')
                    ->orderBy('payment_date', 'desc');
            }
        ]);

        // Get season-wise summary
        $seasonSummary = $customer->customerBalances->map(function ($balance) {
            return [
                'season_id' => $balance->season_id,
                'season_name' => $balance->season->name,
                'total_sales' => $balance->total_sales,
                'total_payments' => $balance->total_payments,
                'balance' => $balance->balance,
                'advance_payment' => $balance->advance_payment,
                'last_transaction_date' => $balance->last_transaction_date,
                'last_payment_date' => $balance->last_payment_date,
            ];
        });

        return Inertia::render('Customers/Show', [
            'customer' => $customerData,
            'seasons' => $seasons,
            'currentSeason' => $currentSeason,
            'seasonSummary' => $seasonSummary
        ]);
    }

    /**
     * Show the form for editing the specified customer.
     */
    public function edit(Customer $customer)
    {
        return Inertia::render('Customers/Edit', [
            'customer' => $customer
        ]);
    }

    /**
     * Update the specified customer.
     */
    public function update(Request $request, Customer $customer)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'area' => 'required|string|max:255',
            'phone_number' => 'required|string|max:20',
            'image' => 'nullable|image|max:2048',
        ]);

        if ($request->hasFile('image')) {
            // Delete old image if exists
            if ($customer->image) {
                \Storage::disk('public')->delete($customer->image);
            }
            $validated['image'] = $request->file('image')->store('customers', 'public');
        }

        $customer->update($validated);

        return redirect()->route('customers.index')
            ->with('success', 'Customer updated successfully.');
    }

    /**
     * Remove the specified customer.
     */
    public function destroy(Customer $customer)
    {
        // Delete image if exists
        if ($customer->image) {
            \Storage::disk('public')->delete($customer->image);
        }

        $customer->delete();

        return redirect()->route('customers.index')
            ->with('success', 'Customer deleted successfully.');
    }

    /**
     * Get customers by season for filtering.
     */
    public function getBySeason(Request $request)
    {
        $seasonId = $request->get('season_id');

        if (!$seasonId) {
            return $this->index();
        }

        $customers = Customer::with([
            'customerBalances' => function ($query) use ($seasonId) {
                $query->where('season_id', $seasonId);
            },
            'transactions' => function ($query) use ($seasonId) {
                $query->where('season_id', $seasonId)
                    ->with(['transactionItems.sackType']);
            },
            'payments' => function ($query) use ($seasonId) {
                $query->where('season_id', $seasonId);
            }
        ])
            ->get()
            ->map(function ($customer) {
                $balance = $customer->customerBalances->first();

                $totalSacks = $customer->transactions->flatMap(function ($transaction) {
                    return $transaction->transactionItems;
                })->sum('quantity');

                $latestTransaction = $customer->transactions->sortByDesc('transaction_date')->first();
                $latestPayment = $customer->payments->sortByDesc('payment_date')->first();

                $totalSales = $balance ? $balance->total_sales : 0;
                $totalPayments = $balance ? $balance->total_payments : 0;
                $remainingBalance = $balance ? $balance->balance : 0;
                $advancePayment = $balance ? $balance->advance_payment : 0;

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
                    'advance_payment' => $advancePayment,
                    'last_transaction_date' => $latestTransaction ? $latestTransaction->transaction_date : null,
                    'last_payment_date' => $latestPayment ? $latestPayment->payment_date : null,
                    'payment_status' => $this->getPaymentStatus($remainingBalance, $advancePayment),
                    'transaction_count' => $customer->transactions->count(),
                    'payment_count' => $customer->payments->count(),
                ];
            });

        $seasons = Season::orderBy('name')->get();
        $currentSeason = Season::find($seasonId);

        return response()->json([
            'customers' => $customers,
            'seasons' => $seasons,
            'currentSeason' => $currentSeason
        ]);
    }

    /**
     * Determine payment status based on balance and advance payment.
     */
    private function getPaymentStatus($balance, $advancePayment)
    {
        if ($balance == 0 && $advancePayment == 0) {
            return 'settled';
        } elseif ($balance > 0) {
            return 'due';
        } elseif ($advancePayment > 0) {
            return 'advance';
        } else {
            return 'settled';
        }
    }
}
