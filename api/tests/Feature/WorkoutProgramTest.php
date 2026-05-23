<?php

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Laravel\Sanctum\Sanctum;
use Modules\Client\Models\Client;
use Modules\Professional\Models\Professional;
use Modules\User\Models\User;

uses(RefreshDatabase::class);

test('a trainer can create a workout program for a client with a pending invite', function () {
    $trainerUser = User::create([
        'role' => 'professional',
        'name' => 'Treinador Teste',
        'email' => 'trainer@example.com',
        'password' => 'secret123',
        'email_verified_at' => now(),
    ]);

    $trainer = Professional::create([
        'user_id' => $trainerUser->id,
        'speciality' => 'trainer',
        'registration' => 'CREF123',
    ]);

    $client = Client::create([
        'name' => 'Aluno Pendente',
        'email' => 'aluno@example.com',
    ]);

    DB::table('client_professional')->insert([
        'client_id' => $client->id,
        'professional_id' => $trainer->id,
        'status' => 'pending_invite',
        'invitation_sent_at' => now(),
        'invitation_expires_at' => now()->addDays(7),
        'created_at' => now(),
        'updated_at' => now(),
    ]);

    Sanctum::actingAs($trainerUser);

    $response = $this->postJson('/api/workout-programs', [
        'title' => 'Treino Inicial',
        'client_uuid' => $client->uuid,
        'goal' => 'Hipertrofia',
        'level' => 'Iniciante',
        'start_date' => now()->toDateString(),
        'end_date' => now()->addMonth()->toDateString(),
        'status' => 'active',
        'days' => [
            [
                'name' => 'Dia A',
                'week_days' => 'Segunda',
                'exercises' => [
                    [
                        'name' => 'Agachamento',
                        'sets' => 3,
                        'reps' => 10,
                        'rest_seconds' => 60,
                    ],
                ],
            ],
        ],
    ]);

    $response->assertCreated()
        ->assertJsonPath('data.client.uuid', $client->uuid)
        ->assertJsonPath('data.title', 'Treino Inicial');
});
