<?php

use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Modules\Professional\Models\Professional;
use Modules\User\Models\User;

uses(RefreshDatabase::class);

test('an authenticated user can see a professional profile', function () {
    $viewer = User::create([
        'role' => 'client',
        'name' => 'Cliente Teste',
        'email' => 'cliente@example.com',
        'cpf' => '12345678901',
        'password' => 'secret123',
        'email_verified_at' => now(),
    ]);

    $professionalUser = User::create([
        'role' => 'professional',
        'name' => 'Dra Ana',
        'email' => 'ana@example.com',
        'phone' => '61999998888',
        'cpf' => '98765432100',
        'password' => 'secret123',
        'email_verified_at' => now(),
    ]);

    $professional = Professional::create([
        'user_id' => $professionalUser->id,
        'speciality' => 'nutritionist',
        'registration' => 'CRN123',
        'bio' => 'Especialista em acompanhamento nutricional.',
    ]);

    Sanctum::actingAs($viewer);

    $response = $this->getJson("/api/professionals/{$professional->uuid}");

    $response->assertOk()
        ->assertJsonPath('data.uuid', $professional->uuid)
        ->assertJsonPath('data.name', 'Dra Ana')
        ->assertJsonPath('data.email', 'ana@example.com')
        ->assertJsonPath('data.phone', '61999998888')
        ->assertJsonPath('data.speciality', 'nutritionist')
        ->assertJsonPath('data.registration', 'CRN123')
        ->assertJsonPath('data.bio', 'Especialista em acompanhamento nutricional.');
});
