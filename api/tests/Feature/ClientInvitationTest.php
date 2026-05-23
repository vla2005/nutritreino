<?php

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Notification;
use Laravel\Sanctum\Sanctum;
use Modules\Client\Models\Client;
use Modules\Client\Notifications\ClientInvitationNotification;
use Modules\Client\Services\AcceptClientInvitationService;
use Modules\Professional\Models\Professional;
use Modules\User\Models\User;

uses(RefreshDatabase::class);

test('a professional can invite a client and the client can create a password', function () {
    Notification::fake();

    $professionalUser = User::create([
        'role' => 'professional',
        'name' => 'Dra Ana',
        'email' => 'ana@example.com',
        'password' => 'secret123',
        'email_verified_at' => now(),
    ]);

    Professional::create([
        'user_id' => $professionalUser->id,
        'speciality' => 'nutrition',
        'registration' => 'CRN123',
    ]);

    Sanctum::actingAs($professionalUser);

    $inviteResponse = $this->postJson('/api/clients/invite', [
        'name' => 'Joao Cliente',
        'email' => 'joao@example.com',
        'phone' => '(61) 99999-8888',
        'cpf' => '12345678901',
        'gender' => 'male',
    ]);

    $inviteResponse->assertCreated()
        ->assertJsonPath('data.email', 'joao@example.com');

    $client = Client::where('email', 'joao@example.com')->first();
    $relation = DB::table('client_professional')
        ->where('client_id', $client->id)
        ->where('professional_id', $professionalUser->professional->id)
        ->first();

    expect($client)
        ->not->toBeNull()
        ->and($client->user_id)->toBeNull()
        ->and($client->phone)->toBe('61999998888')
        ->and($client->cpf)->toBe('12345678901')
        ->and($relation->status)->toBe('pending_invite')
        ->and($relation->invitation_token)->not->toBeNull();

    Notification::assertSentOnDemand(ClientInvitationNotification::class);

    $acceptResponse = $this->postJson('/api/clients/accept-invite', [
        'token' => 'invalid-token-for-first-check',
        'password' => 'secret123',
        'password_confirmation' => 'secret123',
    ]);

    $acceptResponse->assertStatus(400);

    $user = app(AcceptClientInvitationService::class)->handle([
        'token' => recoverInvitationTokenForTest($relation->id),
        'password' => 'secret123',
    ]);

    $client->refresh();
    $relation = DB::table('client_professional')->where('id', $relation->id)->first();

    expect($user->role)->toBe('client')
        ->and($user->email)->toBe('joao@example.com')
        ->and($user->phone)->toBe('61999998888')
        ->and($user->cpf)->toBe('12345678901')
        ->and($user->id)->toBeInt()
        ->and($user->uuid)->not->toBeNull()
        ->and($client->user_id)->toBe($user->id)
        ->and($relation->status)->toBe('active')
        ->and($relation->invitation_token)->toBeNull();
});

test('an existing client user can accept a new professional invite without creating a password', function () {
    $professionalUser = User::create([
        'role' => 'professional',
        'name' => 'Treinador Bruno',
        'email' => 'bruno@example.com',
        'password' => 'secret123',
        'email_verified_at' => now(),
    ]);

    Professional::create([
        'user_id' => $professionalUser->id,
        'speciality' => 'trainer',
        'registration' => 'CREF123',
    ]);

    $clientUser = User::create([
        'role' => 'client',
        'name' => 'Joao Cliente',
        'email' => 'joao@example.com',
        'password' => 'old-secret',
        'email_verified_at' => now(),
    ]);

    $client = Client::create([
        'user_id' => $clientUser->id,
        'name' => 'Joao Cliente',
        'email' => 'joao@example.com',
    ]);

    DB::table('client_professional')->insert([
        'client_id' => $client->id,
        'professional_id' => $professionalUser->professional->id,
        'status' => 'pending_invite',
        'invitation_token' => hash('sha256', 'existing-user-token'),
        'invitation_sent_at' => now(),
        'invitation_expires_at' => now()->addDays(7),
        'created_at' => now(),
        'updated_at' => now(),
    ]);

    $showResponse = $this->getJson('/api/clients/invite?token=existing-user-token');

    $showResponse->assertOk()
        ->assertJsonPath('data.requires_password', false);

    $acceptResponse = $this->postJson('/api/clients/accept-invite', [
        'token' => 'existing-user-token',
    ]);

    $acceptResponse->assertCreated()
        ->assertJsonPath('data.email', 'joao@example.com');

    $relation = DB::table('client_professional')
        ->where('client_id', $client->id)
        ->where('professional_id', $professionalUser->professional->id)
        ->first();

    expect($relation->status)->toBe('active')
        ->and($relation->invitation_token)->toBeNull();
});

function recoverInvitationTokenForTest(int $relationId): string
{
    $plainToken = 'test-token';

    DB::table('client_professional')
        ->where('id', $relationId)
        ->update(['invitation_token' => hash('sha256', $plainToken)]);

    return $plainToken;
}
