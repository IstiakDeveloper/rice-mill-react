<?php

namespace App\Http\Controllers;

use App\Models\SackType;
use Illuminate\Http\Request;
use Inertia\Inertia;

class SackTypeController extends Controller
{
    /**
     * Display a listing of sack types.
     */
    public function index()
    {
        $sackTypes = SackType::all();

        return Inertia::render('SackTypes/Index', [
            'sackTypes' => $sackTypes
        ]);
    }

    /**
     * Store a newly created sack type.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'price' => 'required|numeric|min:0',
        ]);

        SackType::create($validated);

        return redirect()->route('sack-types.index');
    }

    /**
     * Update the specified sack type.
     */
    public function update(Request $request, SackType $sackType)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'price' => 'required|numeric|min:0',
        ]);

        $sackType->update($validated);

        return redirect()->route('sack-types.index');
    }

    /**
     * Remove the specified sack type.
     */
    public function destroy(SackType $sackType)
    {
        $sackType->delete();

        return redirect()->route('sack-types.index');
    }
}
