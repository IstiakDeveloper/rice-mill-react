<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('sack_types', function (Blueprint $table) {
            $table->id();
            $table->string('name'); // Feed, Gom, Chot, Vushi, etc.
            $table->decimal('price', 10, 2); // Current price
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('sack_types');
    }
};
