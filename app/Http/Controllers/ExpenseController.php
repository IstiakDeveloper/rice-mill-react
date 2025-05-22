<?php

namespace App\Http\Controllers;

use App\Models\Expense;
use App\Models\ExpenseCategory;
use App\Models\Season;
use App\Models\CashBalance;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\DB;

class ExpenseController extends Controller
{
    public function index()
    {
        $expenses = Expense::with(['category', 'season'])
            ->orderBy('expense_date', 'desc')
            ->paginate(15);

        return Inertia::render('Expenses/Index', [
            'expenses' => $expenses,
            'categories' => ExpenseCategory::all(),
            'seasons' => Season::all()
        ]);
    }

    public function create()
    {
        return Inertia::render('Expenses/Create', [
            'categories' => ExpenseCategory::all(),
            'seasons' => Season::all()
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'expense_category_id' => 'required|exists:expense_categories,id',
            'season_id' => 'required|exists:seasons,id',
            'expense_date' => 'required|date',
            'amount' => 'required|numeric|min:0',
            'description' => 'nullable|string'
        ]);

        DB::transaction(function () use ($validated) {
            // Expense তৈরি করুন
            Expense::create($validated);

            // Cash Balance থেকে বিয়োগ করুন
            $this->updateCashBalance($validated['season_id'], $validated['amount'], 'subtract');
        });

        return redirect()->route('expenses.index')->with('success', 'Expense created successfully');
    }

    public function show(Expense $expense)
    {
        return Inertia::render('Expenses/Show', [
            'expense' => $expense->load(['category', 'season'])
        ]);
    }

    public function edit(Expense $expense)
    {
        return Inertia::render('Expenses/Edit', [
            'expense' => $expense,
            'categories' => ExpenseCategory::all(),
            'seasons' => Season::all()
        ]);
    }

    public function update(Request $request, Expense $expense)
    {
        $validated = $request->validate([
            'expense_category_id' => 'required|exists:expense_categories,id',
            'season_id' => 'required|exists:seasons,id',
            'expense_date' => 'required|date',
            'amount' => 'required|numeric|min:0',
            'description' => 'nullable|string'
        ]);

        DB::transaction(function () use ($validated, $expense) {
            $oldAmount = $expense->amount;
            $oldSeasonId = $expense->season_id;

            // পুরাতন amount ফেরত দিন (যোগ করুন)
            $this->updateCashBalance($oldSeasonId, $oldAmount, 'add');

            // Expense আপডেট করুন
            $expense->update($validated);

            // নতুন amount বিয়োগ করুন
            $this->updateCashBalance($validated['season_id'], $validated['amount'], 'subtract');
        });

        return redirect()->route('expenses.index')->with('success', 'Expense updated successfully');
    }

    public function destroy(Expense $expense)
    {
        DB::transaction(function () use ($expense) {
            // Cash Balance এ ফেরত দিন (যোগ করুন)
            $this->updateCashBalance($expense->season_id, $expense->amount, 'add');

            // Expense ডিলিট করুন
            $expense->delete();
        });

        return redirect()->route('expenses.index')->with('success', 'Expense deleted successfully');
    }

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
