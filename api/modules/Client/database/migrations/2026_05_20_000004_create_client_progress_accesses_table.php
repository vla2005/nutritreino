<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('client_progress_accesses', function (Blueprint $table) {
            $table->id();
            $table->foreignId('client_id')->constrained('clients')->cascadeOnDelete();
            $table->foreignId('professional_id')->constrained('professionals')->cascadeOnDelete();
            $table->timestamp('granted_at')->nullable();
            $table->timestamp('revoked_at')->nullable();
            $table->timestamps();

            $table->unique(['client_id', 'professional_id']);
            $table->index(['client_id', 'revoked_at']);
            $table->index(['professional_id', 'revoked_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('client_progress_accesses');
    }
};
