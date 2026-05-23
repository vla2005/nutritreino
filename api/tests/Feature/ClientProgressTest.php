<?php

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Laravel\Sanctum\Sanctum;
use Modules\Client\Models\Client;
use Modules\Professional\Models\Professional;
use Modules\User\Models\User;

uses(RefreshDatabase::class);

test('a professional can create and view client progress only after client grants access', function () {
    Storage::fake('public');

    $professionalUser = User::create([
        'role' => 'professional',
        'name' => 'Profissional Teste',
        'email' => 'progresso@example.com',
        'password' => 'secret123',
        'email_verified_at' => now(),
    ]);

    $professional = Professional::create([
        'user_id' => $professionalUser->id,
        'speciality' => 'trainer',
        'registration' => 'CREF-PROGRESS',
    ]);

    $clientUser = User::create([
        'role' => 'client',
        'name' => 'Cliente Progresso',
        'email' => 'cliente-progress@example.com',
        'password' => 'secret123',
        'email_verified_at' => now(),
    ]);

    $client = Client::create([
        'user_id' => $clientUser->id,
        'name' => 'Cliente Progresso',
        'email' => 'cliente-progress@example.com',
        'weight' => '80',
    ]);

    DB::table('client_professional')->insert([
        'client_id' => $client->id,
        'professional_id' => $professional->id,
        'status' => 'active',
        'invitation_sent_at' => now(),
        'invitation_accepted_at' => now(),
        'invitation_expires_at' => now()->addDays(7),
        'created_at' => now(),
        'updated_at' => now(),
    ]);

    Sanctum::actingAs($professionalUser);

    $payload = [
        'client_uuid' => $client->uuid,
        'record_date' => '2026-05-20',
        'weight' => '78.4',
        'target_weight' => '75',
        'notes' => 'Treino muito bom hoje.',
        'measurements' => [
            'waist' => 82,
            'hip' => 99,
            'chest' => 102,
        ],
        'sleep_score' => 4,
        'hunger_score' => 3,
        'energy_score' => 4,
        'diet_adherence_score' => 4,
        'training_adherence_score' => 5,
        'photos' => [
            'front' => UploadedFile::fake()->image('front.jpg', 640, 900),
        ],
    ];

    $this->post('/api/progress', $payload)->assertForbidden();

    Sanctum::actingAs($clientUser);

    $this->getJson('/api/progress/access')
        ->assertOk()
        ->assertJsonPath('data.available.0.uuid', $professional->uuid);

    $this->postJson('/api/progress/access', [
        'professional_uuid' => $professional->uuid,
    ])->assertCreated()
        ->assertJsonPath('data.professional.uuid', $professional->uuid);

    Sanctum::actingAs($professionalUser);

    $response = $this->post('/api/progress', $payload);

    $response->assertCreated()
        ->assertJsonPath('data.weight', 78.4)
        ->assertJsonPath('data.measurements.waist', 82);

    expect($client->fresh()->weight)->toBe('78.4');

    $this->getJson('/api/progress?client_uuid='.$client->uuid)
        ->assertOk()
        ->assertJsonPath('data.summary.current_weight', 78.4)
        ->assertJsonPath('data.measurements.0.type', 'waist');

    Sanctum::actingAs($clientUser);

    $this->deleteJson('/api/progress/access/'.$professional->uuid)->assertOk();

    Sanctum::actingAs($professionalUser);

    $this->getJson('/api/progress?client_uuid='.$client->uuid)->assertForbidden();
});
