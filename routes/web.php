<?php

use App\Http\Controllers\AdditionalIncomeController;
use App\Http\Controllers\CashReportController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use App\Http\Controllers\CustomerController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\ExpenseCategoryController;
use App\Http\Controllers\ExpenseController;
use App\Http\Controllers\FundInputController;
use App\Http\Controllers\SackTypeController;
use App\Http\Controllers\TransactionController;
use App\Http\Controllers\PaymentController;
use App\Http\Controllers\ReportController;

Route::get('/', function () {
    return Inertia::render('welcome');
})->name('home');

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('dashboard', function () {
        return Inertia::render('dashboard');
    })->name('dashboard');
});

Route::resource('funds', FundInputController::class);
Route::resource('expenses', ExpenseController::class);
Route::resource('additional-incomes', AdditionalIncomeController::class);
Route::resource('expense-categories', ExpenseCategoryController::class);



Route::middleware(['auth', 'verified'])->group(function () {
    // Cash Report Routes
    Route::get('/reports/cash', [CashReportController::class, 'index'])->name('cash-report.index');
    Route::get('/reports/cash/export', [CashReportController::class, 'exportExcel'])->name('cash-report.export');
    Route::get('/reports/cash/opening-balance', [CashReportController::class, 'getOpeningBalance'])->name('cash-report.opening-balance');
});

Route::get('/dashboard', [DashboardController::class, 'index'])->name('dashboard');
Route::post('/dashboard/transactions', [DashboardController::class, 'storeTransaction'])->name('dashboard.store-transaction');
Route::post('/dashboard/payments', [DashboardController::class, 'storePayment'])->name('dashboard.payments.store');
Route::post('/dashboard/customers', [DashboardController::class, 'storeCustomer'])->name('dashboard.store-customer');
Route::post('/dashboard/sack-types', [DashboardController::class, 'storeSackType'])->name('dashboard.store-sack-type');

// Customers
Route::resource('customers', CustomerController::class)->except(['show', 'edit']);

// Sack Types
Route::resource('sack-types', SackTypeController::class)->except(['show', 'edit']);

// Transactions
Route::resource('transactions', TransactionController::class)->except(['edit', 'update', 'destroy']);

// Payments
Route::resource('payments', PaymentController::class)->except(['edit', 'update', 'destroy', 'show']);
Route::get('customer/{customer}/payments', [PaymentController::class, 'customerPayments'])->name('customer.payments');

// Reports
Route::get('reports/daily', [ReportController::class, 'daily'])->name('reports.daily');
Route::get('reports/season', [ReportController::class, 'season'])->name('reports.season');
Route::get('reports/customer', [ReportController::class, 'customer'])->name('reports.customer');

require __DIR__ . '/settings.php';
require __DIR__ . '/auth.php';
