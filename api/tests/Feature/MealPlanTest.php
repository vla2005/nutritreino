<?php

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Laravel\Sanctum\Sanctum;
use Modules\Client\Models\Client;
use Modules\Professional\Models\Professional;
use Modules\User\Models\User;

uses(RefreshDatabase::class);

test('a nutritionist can create and update a meal plan for a client with a pending invite', function () {
    $nutritionistUser = User::create([
        'role' => 'professional',
        'name' => 'Nutricionista Teste',
        'email' => 'nutritionist@example.com',
        'password' => 'secret123',
        'email_verified_at' => now(),
    ]);

    $nutritionist = Professional::create([
        'user_id' => $nutritionistUser->id,
        'speciality' => 'nutritionist',
        'registration' => 'CRN123',
    ]);

    $client = Client::create([
        'name' => 'Paciente Pendente',
        'email' => 'paciente@example.com',
    ]);

    DB::table('client_professional')->insert([
        'client_id' => $client->id,
        'professional_id' => $nutritionist->id,
        'status' => 'pending_invite',
        'invitation_sent_at' => now(),
        'invitation_expires_at' => now()->addDays(7),
        'created_at' => now(),
        'updated_at' => now(),
    ]);

    Sanctum::actingAs($nutritionistUser);

    $payload = [
        'title' => 'Plano Inicial',
        'client_uuid' => $client->uuid,
        'start_date' => '2026-09-26',
        'end_date' => '2026-10-26',
        'client_goal' => 'weight_loss',
        'plan_type' => 'balanced',
        'general_notes' => 'Plano criado antes do aceite do convite.',
        'meals' => [
            [
                'name' => 'Café da manhã',
                'time' => '08:00',
                'instructions' => 'Consumir pela manhã.',
                'foods' => [
                    [
                        'name' => 'Aveia',
                        'amount' => 50,
                        'unit' => 'g',
                    ],
                ],
            ],
        ],
    ];

    $created = $this->postJson('/api/mealplans', $payload)
        ->assertCreated()
        ->assertJsonPath('data.client.uuid', $client->uuid)
        ->assertJsonPath('data.title', 'Plano Inicial');

    expect($client->user_id)->toBeNull();

    $payload['title'] = 'Plano Atualizado';
    $payload['general_notes'] = 'Plano atualizado antes do aceite do convite.';

    $this->putJson('/api/mealplans/'.$created->json('data.uuid'), $payload)
        ->assertOk()
        ->assertJsonPath('data.title', 'Plano Atualizado')
        ->assertJsonPath('data.general_notes', 'Plano atualizado antes do aceite do convite.');
});
