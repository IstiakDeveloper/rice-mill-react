<?php

use App\Http\Controllers\AdditionalIncomeController;
use App\Http\Controllers\CashReportController;
use App\Http\Controllers\CustomerController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\ExpenseCategoryController;
use App\Http\Controllers\ExpenseController;
use App\Http\Controllers\FundInputController;
use App\Http\Controllers\PaymentController;
use App\Http\Controllers\ReportController;
use App\Http\Controllers\SackTypeController;
use App\Http\Controllers\TransactionController;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

// Public Routes (No Authentication Required)
Route::get('/', function () {
    return redirect()->route('login');
})->name('home');

Route::get('/storage-link', function () {
    Artisan::call('storage:link');

    return response()->json(['message' => 'Storage link created successfully.']);
})->name('storage.link');

// Route for running migrations
Route::get('/migrate', function () {
    Artisan::call('migrate');

    return response()->json(['message' => 'Migrations run successfully.']);
})->name('migrate');
// Authenticated Routes (Login Required)
Route::middleware(['auth', 'verified'])->group(function () {

    // Dashboard Routes
    Route::get('/dashboard', [DashboardController::class, 'index'])->name('dashboard');
    Route::post('/dashboard/transactions', [DashboardController::class, 'storeTransaction'])->name('dashboard.store-transaction');
    Route::post('/dashboard/payments', [DashboardController::class, 'storePayment'])->name('dashboard.store-payment');
    Route::post('/dashboard/customers', [DashboardController::class, 'storeCustomer'])->name('dashboard.store-customer');
    Route::post('/dashboard/sack-types', [DashboardController::class, 'storeSackType'])->name('dashboard.store-sack-type');

    // Resource Routes
    Route::resource('funds', FundInputController::class);
    Route::resource('expenses', ExpenseController::class);
    Route::resource('additional-incomes', AdditionalIncomeController::class);
    Route::resource('expense-categories', ExpenseCategoryController::class);
    Route::resource('customers', CustomerController::class)->except(['show', 'edit']);
    Route::resource('sack-types', SackTypeController::class)->except(['show', 'edit']);
    Route::resource('transactions', TransactionController::class);
    Route::resource('payments', PaymentController::class)->except(['edit', 'update', 'destroy', 'show']);

    // Customer Payments
    Route::get('customer/{customer}/payments', [PaymentController::class, 'customerPayments'])->name('customer.payments');

    // Report Routes
    Route::prefix('reports')->name('reports.')->group(function () {
        Route::get('daily', [ReportController::class, 'daily'])->name('daily');
        Route::get('season', [ReportController::class, 'season'])->name('season');
        Route::get('customer', [ReportController::class, 'customer'])->name('customer');

        // Cash Report Routes
        Route::prefix('cash')->name('cash-report.')->group(function () {
            Route::get('/', [CashReportController::class, 'index'])->name('index');
            Route::get('/export', [CashReportController::class, 'exportExcel'])->name('export');
            Route::get('/opening-balance', [CashReportController::class, 'getOpeningBalance'])->name('opening-balance');
        });
    });
});

// Include additional route files
require __DIR__ . '/settings.php';
require __DIR__ . '/auth.php';
