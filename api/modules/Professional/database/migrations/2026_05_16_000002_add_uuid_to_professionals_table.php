<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('professionals', function (Blueprint $table) {
            if (! Schema::hasColumn('professionals', 'uuid')) {
                $table->uuid('uuid')->nullable()->unique()->after('id');
            }
        });

        DB::table('professionals')
            ->whereNull('uuid')
            ->orderBy('id')
            ->cursor()
            ->each(fn (object $professional) => DB::table('professionals')->where('id', $professional->id)->update([
                'uuid' => (string) Str::uuid(),
            ]));
    }

    public function down(): void
    {
        Schema::table('professionals', function (Blueprint $table) {
            if (Schema::hasColumn('professionals', 'uuid')) {
                $table->dropUnique(['uuid']);
                $table->dropColumn('uuid');
            }
        });
    }
};
