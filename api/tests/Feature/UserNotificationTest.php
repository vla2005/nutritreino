<?php

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Notification;
use Modules\User\Models\User;
use Modules\User\Notifications\WelcomeNotification;

uses(RefreshDatabase::class);

test('a welcome verification email is sent with the NutriTreino notification', function () {
    Notification::fake();

    $response = $this->postJson('/api/user/register', [
        'role' => 'professional',
        'name' => 'Dra Ana',
        'email' => 'ana@example.com',
        'cpf' => '12345678901',
        'password' => 'secret123',
        'speciality' => 'nutritionist',
        'registration' => 'CRN123',
    ]);

    $response->assertCreated();

    $user = User::where('email', 'ana@example.com')->firstOrFail();

    Notification::assertSentTo($user, WelcomeNotification::class);
});
