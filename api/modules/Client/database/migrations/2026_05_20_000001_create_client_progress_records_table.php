<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('client_progress_records', function (Blueprint $table) {
            $table->id();
            $table->uuid('uuid')->unique();
            $table->foreignId('client_id')->constrained('clients')->cascadeOnDelete();
            $table->foreignId('professional_id')->nullable()->constrained('professionals')->nullOnDelete();
            $table->date('record_date');
            $table->decimal('weight', 6, 2);
            $table->decimal('target_weight', 6, 2)->nullable();
            $table->text('notes')->nullable();
            $table->unsignedTinyInteger('sleep_score')->nullable();
            $table->unsignedTinyInteger('hunger_score')->nullable();
            $table->unsignedTinyInteger('energy_score')->nullable();
            $table->unsignedTinyInteger('diet_adherence_score')->nullable();
            $table->unsignedTinyInteger('training_adherence_score')->nullable();
            $table->text('professional_feedback')->nullable();
            $table->timestamps();

            $table->index(['client_id', 'record_date']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('client_progress_records');
    }
};
