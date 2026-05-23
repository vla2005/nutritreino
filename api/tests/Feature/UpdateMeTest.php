<?php

use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Modules\Client\Models\Client;
use Modules\Professional\Models\Professional;
use Modules\User\Models\User;

uses(RefreshDatabase::class);

test('a client can update own profile and client data', function () {
    $user = User::create([
        'role' => 'client',
        'name' => 'Cliente Antigo',
        'email' => 'cliente-old@example.com',
        'cpf' => '11122233344',
        'password' => 'secret123',
        'email_verified_at' => now(),
    ]);

    $client = Client::create([
        'user_id' => $user->id,
        'name' => 'Cliente Antigo',
        'email' => 'cliente-old@example.com',
        'cpf' => '11122233344',
        'height' => '170',
        'weight' => '80',
    ]);

    Sanctum::actingAs($user);

    $this->putJson('/api/me', [
        'name' => 'Cliente Novo',
        'email' => 'cliente-new@example.com',
        'cpf' => '99988877766',
        'phone' => '(61) 99999-1111',
        'gender' => 'male',
        'birth_date' => '2000-01-10',
        'height' => '178',
        'weight' => '76',
    ])->assertOk()
        ->assertJsonPath('data.name', 'Cliente Novo')
        ->assertJsonPath('data.client.weight', '76');

    expect($user->fresh()->email)->toBe('cliente-new@example.com')
        ->and($client->fresh()->email)->toBe('cliente-new@example.com')
        ->and($client->fresh()->weight)->toBe('76');
});

test('a professional can update own profile and professional data', function () {
    $user = User::create([
        'role' => 'professional',
        'name' => 'Prof Antigo',
        'email' => 'prof-old@example.com',
        'cpf' => '11122233344',
        'password' => 'secret123',
        'email_verified_at' => now(),
    ]);

    $professional = Professional::create([
        'user_id' => $user->id,
        'speciality' => 'trainer',
        'registration' => 'OLD-123',
        'bio' => 'Bio antiga',
    ]);

    Sanctum::actingAs($user);

    $this->putJson('/api/me', [
        'name' => 'Prof Novo',
        'email' => 'prof-new@example.com',
        'cpf' => '99988877766',
        'phone' => '(61) 98888-2222',
        'speciality' => 'nutritionist',
        'registration' => 'NEW-456',
        'bio' => 'Bio nova',
    ])->assertOk()
        ->assertJsonPath('data.name', 'Prof Novo')
        ->assertJsonPath('data.professional.speciality', 'nutritionist');

    expect($user->fresh()->email)->toBe('prof-new@example.com')
        ->and($professional->fresh()->registration)->toBe('NEW-456')
        ->and($professional->fresh()->bio)->toBe('Bio nova');
});
