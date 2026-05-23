<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::dropIfExists('client_progress_feedbacks');

        Schema::create('client_progress_feedbacks', function (Blueprint $table) {
            $table->id();
            $table->uuid('uuid')->unique();
            $table->foreignId('progress_record_id')->constrained('client_progress_records')->cascadeOnDelete();
            $table->foreignId('professional_id')->constrained('professionals')->cascadeOnDelete();
            $table->text('feedback');
            $table->timestamps();

            $table->unique(['progress_record_id', 'professional_id'], 'cpf_record_prof_unique');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('client_progress_feedbacks');
    }
};
