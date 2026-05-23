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
        Schema::table('clients', function (Blueprint $table) {
            if (! Schema::hasColumn('clients', 'uuid')) {
                $table->uuid('uuid')->nullable()->unique()->after('id');
            }
        });

        DB::table('clients')
            ->whereNull('uuid')
            ->orderBy('id')
            ->cursor()
            ->each(fn (object $client) => DB::table('clients')->where('id', $client->id)->update([
                'uuid' => (string) Str::uuid(),
            ]));
    }

    public function down(): void
    {
        Schema::table('clients', function (Blueprint $table) {
            if (Schema::hasColumn('clients', 'uuid')) {
                $table->dropUnique(['uuid']);
                $table->dropColumn('uuid');
            }
        });
    }
};
