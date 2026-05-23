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
        Schema::create('clients', function (Blueprint $table) {
            $table->id();
            $table->uuid('uuid')->unique();
            $table->foreignId('user_id')->nullable()->unique()->constrained()->nullOnDelete();
            $table->string('name');
            $table->string('email')->unique();
            $table->string('phone')->nullable()->unique();
            $table->string('cpf')->nullable()->unique();
            $table->string('gender')->nullable();
            $table->date('birth_date')->nullable();
            $table->string('height')->nullable();
            $table->string('weight')->nullable();
            $table->timestamps();
        });

        Schema::create('client_professional', function (Blueprint $table) {
            $table->id();
            $table->foreignId('client_id')->constrained()->cascadeOnDelete();
            $table->foreignId('professional_id')->constrained()->cascadeOnDelete();
            $table->string('status')->default('pending_invite');
            $table->string('invitation_token')->nullable()->unique();
            $table->timestamp('invitation_sent_at')->nullable();
            $table->timestamp('invitation_accepted_at')->nullable();
            $table->timestamp('invitation_expires_at')->nullable();
            $table->timestamps();

            $table->unique(['client_id', 'professional_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('client_professional');
        Schema::dropIfExists('clients');
    }
};
