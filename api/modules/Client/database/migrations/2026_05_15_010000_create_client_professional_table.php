<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('client_professional')) {
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

        if (Schema::hasColumn('clients', 'professional_id')) {
            DB::table('clients')
                ->whereNotNull('professional_id')
                ->orderBy('id')
                ->each(function (object $client): void {
                    DB::table('client_professional')->updateOrInsert(
                        [
                            'client_id' => $client->id,
                            'professional_id' => $client->professional_id,
                        ],
                        [
                            'status' => $client->status ?? 'pending_invite',
                            'invitation_token' => $client->invitation_token ?? null,
                            'invitation_sent_at' => $client->invitation_sent_at ?? null,
                            'invitation_accepted_at' => $client->invitation_accepted_at ?? null,
                            'invitation_expires_at' => $client->invitation_expires_at ?? null,
                            'created_at' => $client->created_at ?? now(),
                            'updated_at' => $client->updated_at ?? now(),
                        ]
                    );
                });

            Schema::table('clients', function (Blueprint $table) {
                if ($this->hasForeignKey('clients', 'clients_professional_id_foreign')) {
                    $table->dropForeign('clients_professional_id_foreign');
                }

                if ($this->hasIndex('clients', 'clients_professional_id_email_unique')) {
                    $table->dropUnique('clients_professional_id_email_unique');
                }

                $table->dropColumn('professional_id');
            });
        }

        Schema::table('clients', function (Blueprint $table) {
            if ($this->hasIndex('clients', 'clients_invitation_token_unique')) {
                $table->dropUnique('clients_invitation_token_unique');
            }

            foreach ([
                'invitation_expires_at',
                'invitation_accepted_at',
                'invitation_sent_at',
                'invitation_token',
                'status',
            ] as $column) {
                if (Schema::hasColumn('clients', $column)) {
                    $table->dropColumn($column);
                }
            }
        });

        if (! $this->hasIndex('clients', 'clients_email_unique')) {
            Schema::table('clients', function (Blueprint $table) {
                $table->unique('email');
            });
        }

        if (! $this->hasIndex('clients', 'clients_user_id_unique')) {
            Schema::table('clients', function (Blueprint $table) {
                $table->unique('user_id');
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('client_professional');
    }

    private function hasIndex(string $table, string $indexName): bool
    {
        return collect(Schema::getIndexes($table))
            ->contains(fn (array $index): bool => $index['name'] === $indexName);
    }

    private function hasForeignKey(string $table, string $foreignKeyName): bool
    {
        return collect(Schema::getForeignKeys($table))
            ->contains(fn (array $foreignKey): bool => $foreignKey['name'] === $foreignKeyName);
    }
};
