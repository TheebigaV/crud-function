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
        Schema::create('payments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->nullable()->constrained()->onDelete('cascade');
            $table->string('stripe_payment_intent_id')->unique();
            $table->integer('amount'); // Amount in cents
            $table->string('currency', 3)->default('usd');
            $table->string('status');
            $table->string('description')->nullable();
            $table->json('metadata')->nullable();
            $table->timestamps();

            // Indexes for better performance
            $table->index(['user_id', 'created_at']);
            $table->index(['status']);
            $table->index(['stripe_payment_intent_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('payments');
    }
};
