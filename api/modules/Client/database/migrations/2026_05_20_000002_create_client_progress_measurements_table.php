<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('client_progress_measurements', function (Blueprint $table) {
            $table->id();
            $table->foreignId('progress_record_id')->constrained('client_progress_records')->cascadeOnDelete();
            $table->string('type', 40);
            $table->decimal('value', 6, 2);
            $table->timestamps();

            $table->unique(['progress_record_id', 'type']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('client_progress_measurements');
    }
};
