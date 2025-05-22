<?php

namespace App\Http\Controllers;

use App\Models\ExpenseCategory;
use Illuminate\Http\Request;
use Inertia\Inertia;

class ExpenseCategoryController extends Controller
{
    public function index()
    {
        $categories = ExpenseCategory::withCount('expenses')
            ->orderBy('name')
            ->paginate(15);

        return Inertia::render('ExpenseCategories/Index', [
            'categories' => $categories
        ]);
    }

    public function create()
    {
        return Inertia::render('ExpenseCategories/Create');
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255|unique:expense_categories,name',
            'description' => 'nullable|string'
        ]);

        $category = ExpenseCategory::create($validated);

        // For AJAX requests (modal)
        if ($request->expectsJson()) {
            return response()->json([
                'success' => true,
                'category' => $category,
                'message' => 'Category created successfully'
            ]);
        }

        return redirect()->back()->with('success', 'Category created successfully');
    }

    public function show(ExpenseCategory $expenseCategory)
    {
        return Inertia::render('ExpenseCategories/Show', [
            'category' => $expenseCategory->load('expenses')
        ]);
    }

    public function edit(ExpenseCategory $expenseCategory)
    {
        return Inertia::render('ExpenseCategories/Edit', [
            'category' => $expenseCategory
        ]);
    }

    public function update(Request $request, ExpenseCategory $expenseCategory)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255|unique:expense_categories,name,' . $expenseCategory->id,
            'description' => 'nullable|string'
        ]);

        $expenseCategory->update($validated);

        return redirect()->route('expense-categories.index')->with('success', 'Category updated successfully');
    }

    public function destroy(ExpenseCategory $expenseCategory)
    {
        // Check if category has expenses
        if ($expenseCategory->expenses()->count() > 0) {
            return redirect()->route('expense-categories.index')
                ->with('error', 'Cannot delete category that has expenses');
        }

        $expenseCategory->delete();

        return redirect()->route('expense-categories.index')->with('success', 'Category deleted successfully');
    }
}
