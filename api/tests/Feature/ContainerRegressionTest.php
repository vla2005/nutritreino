<?php

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Facades\Queue;
use Laravel\Sanctum\Sanctum;
use Modules\Client\Models\Client;
use Modules\Professional\Models\Professional;
use Modules\User\Models\User;
use Tests\Fixtures\ContainerQueueProbe;

uses(RefreshDatabase::class);

test('professional registration verification login dashboard and logout work in the container', function (string $speciality, string $dashboard) {
    Notification::fake();
    $this->postJson('/api/user/register', [
        'role' => 'professional', 'name' => 'Docker Regression',
        'email' => 'docker@example.com', 'cpf' => '12345678901',
        'password' => 'ContainerTest123!', 'speciality' => $speciality,
        'registration' => 'DOCKER-123',
    ])->assertCreated();

    $credentials = ['email' => 'docker@example.com', 'password' => 'ContainerTest123!'];
    $this->postJson('/api/login', $credentials)->assertUnauthorized();
    $user = User::where('email', $credentials['email'])->firstOrFail();
    $this->postJson('/api/verify-email', ['token' => $user->uuid])->assertNoContent();
    $token = $this->postJson('/api/login', $credentials)->assertOk()->json('token');
    expect($token)->toBeString()->not->toBeEmpty();
    $this->withToken($token)->getJson('/api/me')->assertOk();
    $this->withToken($token)->getJson('/api/dashboard/'.$dashboard)->assertOk();
    $this->withToken($token)->postJson('/api/logout')->assertOk();
    $this->app['auth']->forgetGuards();
    $this->withToken($token)->getJson('/api/me')->assertUnauthorized();
})->with([
    'nutritionist' => ['nutritionist', 'nutritionist'],
    'trainer' => ['trainer', 'trainer'],
]);

test('AI meal and workout drafts survive the production runtime dependencies', function (string $speciality, string $endpoint, array $context, array $draft) {
    Http::preventStrayRequests();
    config(['services.gemini.key' => 'fake-container-test-key']);
    Http::fake(['generativelanguage.googleapis.com/*' => Http::response([
        'candidates' => [['content' => ['parts' => [['text' => json_encode($draft)]]]]],
    ])]);

    $user = User::create([
        'role' => 'professional', 'name' => 'AI Docker', 'email' => 'ai@example.com',
        'password' => 'ContainerTest123!', 'email_verified_at' => now(),
    ]);
    $professional = Professional::create([
        'user_id' => $user->id, 'speciality' => $speciality, 'registration' => 'AI-123',
    ]);
    $client = Client::create(['name' => 'AI Client', 'email' => 'ai-client@example.com']);
    $client->professionals()->attach($professional->id, ['status' => 'pending_invite']);
    Sanctum::actingAs($user);

    $this->postJson('/api/'.$endpoint.'/ai-suggestion', [
        'client_uuid' => $client->uuid, 'objective' => 'Objetivo de teste', ...$context,
    ])->assertOk()->assertJsonPath('data.title', $draft['title']);
    Http::assertSentCount(1);
})->with([
    'meal' => ['nutritionist', 'mealplans', ['target_calories' => 2000], ['title' => 'Rascunho alimentar', 'meals' => []]],
    'workout' => ['trainer', 'workout-programs', ['weekly_frequency' => 3], ['title' => 'Rascunho de treino', 'days' => []]],
]);

test('a real database queue job is processed and removed without an external service', function () {
    Queue::connection('database')->push(new ContainerQueueProbe, '', 'container-probe');
    expect(DB::table('jobs')->where('queue', 'container-probe')->count())->toBe(1);
    $this->artisan('queue:work', [
        'connection' => 'database', '--queue' => 'container-probe', '--once' => true, '--tries' => 1,
    ])->assertExitCode(0);
    expect(Cache::get('container-queue-probe'))->toBe('processed')
        ->and(DB::table('jobs')->where('queue', 'container-probe')->count())->toBe(0);
});
