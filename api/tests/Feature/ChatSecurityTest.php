<?php

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Laravel\Sanctum\Sanctum;
use Modules\Chat\Models\Conversation;
use Modules\Chat\Services\MessageService;
use Modules\Client\Models\Client;
use Modules\Professional\Models\Professional;
use Modules\User\Models\User;

uses(RefreshDatabase::class);

test('a user cannot read a conversation they do not participate in', function () {
    [$clientUser, $professionalUser] = chatUsersWithRelation('active');
    $intruder = User::create([
        'role' => 'client',
        'name' => 'Intruso',
        'email' => 'intruso@example.com',
        'password' => 'secret123',
        'email_verified_at' => now(),
    ]);

    $conversation = Conversation::create([
        'first_user_id' => min($clientUser->id, $professionalUser->id),
        'second_user_id' => max($clientUser->id, $professionalUser->id),
        'created_by' => $clientUser->id,
    ]);

    Sanctum::actingAs($intruder);

    $this->getJson('/api/conversations/'.$conversation->uuid)->assertForbidden();
});

test('an inactive client professional relation cannot read an old conversation', function () {
    [$clientUser, $professionalUser] = chatUsersWithRelation('inactive');

    $conversation = Conversation::create([
        'first_user_id' => min($clientUser->id, $professionalUser->id),
        'second_user_id' => max($clientUser->id, $professionalUser->id),
        'created_by' => $clientUser->id,
    ]);

    Sanctum::actingAs($clientUser);

    $this->getJson('/api/conversations/'.$conversation->uuid)->assertForbidden();
});

test('only a conversation participant can download an encrypted attachment', function () {
    [$clientUser, $professionalUser] = chatUsersWithRelation('active');
    $intruder = User::create([
        'role' => 'client',
        'name' => 'Outro cliente',
        'email' => 'outro@example.com',
        'password' => 'secret123',
        'email_verified_at' => now(),
    ]);

    $conversation = Conversation::create([
        'first_user_id' => min($clientUser->id, $professionalUser->id),
        'second_user_id' => max($clientUser->id, $professionalUser->id),
        'created_by' => $clientUser->id,
    ]);

    $message = app(MessageService::class)->create(
        $conversation,
        $clientUser,
        null,
        UploadedFile::fake()->image('foto.png')
    );

    Sanctum::actingAs($intruder);
    $this->getJson('/api/messages/'.$message->uuid.'/attachment')->assertForbidden();

    Sanctum::actingAs($professionalUser);
    $this->getJson('/api/messages/'.$message->uuid.'/attachment')->assertOk();
});

function chatUsersWithRelation(string $status): array
{
    $professionalUser = User::create([
        'role' => 'professional',
        'name' => 'Dra Chat',
        'email' => 'chat-prof@example.com',
        'password' => 'secret123',
        'email_verified_at' => now(),
    ]);

    $professional = Professional::create([
        'user_id' => $professionalUser->id,
        'speciality' => 'nutritionist',
        'registration' => 'CRN123',
    ]);

    $clientUser = User::create([
        'role' => 'client',
        'name' => 'Cliente Chat',
        'email' => 'chat-client@example.com',
        'password' => 'secret123',
        'email_verified_at' => now(),
    ]);

    $client = Client::create([
        'user_id' => $clientUser->id,
        'name' => 'Cliente Chat',
        'email' => 'chat-client@example.com',
    ]);

    DB::table('client_professional')->insert([
        'client_id' => $client->id,
        'professional_id' => $professional->id,
        'status' => $status,
        'created_at' => now(),
        'updated_at' => now(),
    ]);

    return [$clientUser, $professionalUser];
}
