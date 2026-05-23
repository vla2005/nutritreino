<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('client_professional')) {
            return;
        }

        if ($this->hasForeignKey('clients', 'clients_user_id_foreign')) {
            Schema::table('clients', function (Blueprint $table) {
                $table->dropForeign('clients_user_id_foreign');
            });
        }

        if ($this->hasIndex('clients', 'clients_user_id_unique')) {
            Schema::table('clients', function (Blueprint $table) {
                $table->dropUnique('clients_user_id_unique');
            });
        }

        Schema::table('clients', function (Blueprint $table) {
            if (Schema::hasColumn('clients', 'user_id')) {
                $table->foreignId('user_id')->nullable()->change();
            }

            if (! Schema::hasColumn('clients', 'professional_id')) {
                $table->foreignId('professional_id')->nullable()->after('user_id')->constrained()->cascadeOnDelete();
            }

            if (! Schema::hasColumn('clients', 'name')) {
                $table->string('name')->nullable()->after('professional_id');
            }

            if (! Schema::hasColumn('clients', 'email')) {
                $table->string('email')->nullable()->after('name');
            }

            if (! Schema::hasColumn('clients', 'status')) {
                $table->string('status')->default('pending_invite')->after('weight');
            }

            if (! Schema::hasColumn('clients', 'invitation_token')) {
                $table->string('invitation_token')->nullable()->unique()->after('status');
            }

            if (! Schema::hasColumn('clients', 'invitation_sent_at')) {
                $table->timestamp('invitation_sent_at')->nullable()->after('invitation_token');
            }

            if (! Schema::hasColumn('clients', 'invitation_accepted_at')) {
                $table->timestamp('invitation_accepted_at')->nullable()->after('invitation_sent_at');
            }

            if (! Schema::hasColumn('clients', 'invitation_expires_at')) {
                $table->timestamp('invitation_expires_at')->nullable()->after('invitation_accepted_at');
            }
        });

        if (! $this->hasIndex('clients', 'clients_professional_id_email_unique')) {
            Schema::table('clients', function (Blueprint $table) {
                $table->unique(['professional_id', 'email']);
            });
        }

        if (! $this->hasForeignKey('clients', 'clients_user_id_foreign')) {
            Schema::table('clients', function (Blueprint $table) {
                $table->foreign('user_id')->references('id')->on('users')->nullOnDelete();
            });
        }
    }

    public function down(): void
    {
        Schema::table('clients', function (Blueprint $table) {
            if ($this->hasIndex('clients', 'clients_professional_id_email_unique')) {
                $table->dropUnique('clients_professional_id_email_unique');
            }

            foreach ([
                'invitation_expires_at',
                'invitation_accepted_at',
                'invitation_sent_at',
                'invitation_token',
                'status',
                'email',
                'name',
                'professional_id',
            ] as $column) {
                if (Schema::hasColumn('clients', $column)) {
                    $table->dropColumn($column);
                }
            }
        });
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
