<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('customer_balances', function (Blueprint $table) {
            $table->id();
            $table->foreignId('customer_id')->constrained()->onDelete('cascade');
            $table->foreignId('season_id')->constrained();
            $table->decimal('total_sales', 15, 2)->default(0);
            $table->decimal('total_payments', 15, 2)->default(0);
            $table->decimal('balance', 15, 2)->default(0);
            $table->decimal('advance_payment', 15, 2)->default(0);
            $table->date('last_transaction_date')->nullable();
            $table->date('last_payment_date')->nullable();
            $table->timestamps();

            $table->unique(['customer_id', 'season_id']);
            $table->index(['season_id', 'balance']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('customer_balances');
    }
};
