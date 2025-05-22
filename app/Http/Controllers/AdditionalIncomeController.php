<?php

namespace App\Http\Controllers;

use App\Models\AdditionalIncome;
use App\Models\Season;
use App\Models\CashBalance;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\DB;

class AdditionalIncomeController extends Controller
{
    public function index()
    {
        $incomes = AdditionalIncome::with('season')
            ->orderBy('date', 'desc')
            ->paginate(15);

        return Inertia::render('AdditionalIncomes/Index', [
            'incomes' => $incomes,
            'seasons' => Season::all()
        ]);
    }

    public function create()
    {
        return Inertia::render('AdditionalIncomes/Create', [
            'seasons' => Season::all()
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'income_source' => 'required|string|max:255',
            'season_id' => 'required|exists:seasons,id',
            'date' => 'required|date',
            'amount' => 'required|numeric|min:0',
            'description' => 'nullable|string'
        ]);

        DB::transaction(function () use ($validated) {
            // Additional Income তৈরি করুন
            AdditionalIncome::create($validated);

            // Cash Balance এ যোগ করুন
            $this->updateCashBalance($validated['season_id'], $validated['amount'], 'add');
        });

        return redirect()->route('additional-incomes.index')->with('success', 'Additional income created successfully');
    }

    public function show(AdditionalIncome $additionalIncome)
    {
        return Inertia::render('AdditionalIncomes/Show', [
            'income' => $additionalIncome->load('season')
        ]);
    }

    public function edit(AdditionalIncome $additionalIncome)
    {
        return Inertia::render('AdditionalIncomes/Edit', [
            'income' => $additionalIncome,
            'seasons' => Season::all()
        ]);
    }

    public function update(Request $request, AdditionalIncome $additionalIncome)
    {
        $validated = $request->validate([
            'income_source' => 'required|string|max:255',
            'season_id' => 'required|exists:seasons,id',
            'date' => 'required|date',
            'amount' => 'required|numeric|min:0',
            'description' => 'nullable|string'
        ]);

        DB::transaction(function () use ($validated, $additionalIncome) {
            $oldAmount = $additionalIncome->amount;
            $oldSeasonId = $additionalIncome->season_id;

            // পুরাতন amount বিয়োগ করুন
            $this->updateCashBalance($oldSeasonId, $oldAmount, 'subtract');

            // Additional Income আপডেট করুন
            $additionalIncome->update($validated);

            // নতুন amount যোগ করুন
            $this->updateCashBalance($validated['season_id'], $validated['amount'], 'add');
        });

        return redirect()->route('additional-incomes.index')->with('success', 'Additional income updated successfully');
    }

    public function destroy(AdditionalIncome $additionalIncome)
    {
        DB::transaction(function () use ($additionalIncome) {
            // Cash Balance থেকে বিয়োগ করুন
            $this->updateCashBalance($additionalIncome->season_id, $additionalIncome->amount, 'subtract');

            // Additional Income ডিলিট করুন
            $additionalIncome->delete();
        });

        return redirect()->route('additional-incomes.index')->with('success', 'Additional income deleted successfully');
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
