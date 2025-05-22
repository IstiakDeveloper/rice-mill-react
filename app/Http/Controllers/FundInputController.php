<?php

namespace App\Http\Controllers;

use App\Models\FundInput;
use App\Models\Season;
use App\Models\CashBalance;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\DB;

class FundInputController extends Controller
{
    public function index()
    {
        $funds = FundInput::with('season')
            ->orderBy('date', 'desc')
            ->paginate(15);

        return Inertia::render('Funds/Index', [
            'funds' => $funds,
            'seasons' => Season::all()
        ]);
    }

    public function create()
    {
        return Inertia::render('Funds/Create', [
            'seasons' => Season::all()
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'source' => 'required|string|max:255',
            'season_id' => 'required|exists:seasons,id',
            'date' => 'required|date',
            'amount' => 'required|numeric|min:0',
            'description' => 'nullable|string'
        ]);

        DB::transaction(function () use ($validated) {
            // Fund Input তৈরি করুন
            FundInput::create($validated);

            // Cash Balance আপডেট করুন
            $this->updateCashBalance($validated['season_id'], $validated['amount'], 'add');
        });

        return redirect()->route('funds.index')->with('success', 'Fund input created successfully');
    }

    public function show(FundInput $fund)
    {
        return Inertia::render('Funds/Show', [
            'fund' => $fund->load('season')
        ]);
    }

    public function edit(FundInput $fund)
    {
        return Inertia::render('Funds/Edit', [
            'fund' => $fund,
            'seasons' => Season::all()
        ]);
    }

    public function update(Request $request, FundInput $fund)
    {
        $validated = $request->validate([
            'source' => 'required|string|max:255',
            'season_id' => 'required|exists:seasons,id',
            'date' => 'required|date',
            'amount' => 'required|numeric|min:0',
            'description' => 'nullable|string'
        ]);

        DB::transaction(function () use ($validated, $fund) {
            $oldAmount = $fund->amount;
            $oldSeasonId = $fund->season_id;

            // পুরাতন amount বিয়োগ করুন
            $this->updateCashBalance($oldSeasonId, $oldAmount, 'subtract');

            // Fund Input আপডেট করুন
            $fund->update($validated);

            // নতুন amount যোগ করুন
            $this->updateCashBalance($validated['season_id'], $validated['amount'], 'add');
        });

        return redirect()->route('funds.index')->with('success', 'Fund input updated successfully');
    }

    public function destroy(FundInput $fund)
    {
        DB::transaction(function () use ($fund) {
            // Cash Balance থেকে বিয়োগ করুন
            $this->updateCashBalance($fund->season_id, $fund->amount, 'subtract');

            // Fund Input ডিলিট করুন
            $fund->delete();
        });

        return redirect()->route('funds.index')->with('success', 'Fund input deleted successfully');
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
