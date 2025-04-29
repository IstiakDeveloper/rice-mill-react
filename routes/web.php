<?php

use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use App\Http\Controllers\CustomerController;
use App\Http\Controllers\DashboardController;
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


Route::get('/dashboard', [DashboardController::class, 'index'])->name('dashboard');
Route::post('/dashboard/transactions', [DashboardController::class, 'storeTransaction'])->name('dashboard.transactions.store');
Route::post('/dashboard/payments', [DashboardController::class, 'storePayment'])->name('dashboard.payments.store');
Route::post('/dashboard/customers', [DashboardController::class, 'storeCustomer'])->name('dashboard.customers.store');
Route::post('/dashboard/sack-types', [DashboardController::class, 'storeSackType'])->name('dashboard.sack-types.store');

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
