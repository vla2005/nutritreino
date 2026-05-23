<?php

namespace Modules\Client\Services;

use Illuminate\Support\Facades\DB;
use Modules\Client\Models\Client;
use Modules\Professional\Models\Professional;
use Modules\User\Exceptions\UserException;
use Modules\User\Models\User;

class AcceptClientInvitationService
{
    public function handle(array $data): User
    {
        return DB::transaction(function () use ($data) {
            $relation = DB::table('client_professional')
                ->where('invitation_token', hash('sha256', $data['token']))
                ->first();

            if (! $relation || $relation->status !== 'pending_invite') {
                throw new UserException('Invalid invitation token');
            }

            if ($relation->invitation_expires_at && now()->greaterThan($relation->invitation_expires_at)) {
                throw new UserException('Invitation token expired');
            }

            $client = Client::find($relation->client_id);

            if (! $client) {
                throw new UserException('Invalid invitation token');
            }

            $user = User::where('email', $client->email)->first();

            if ($user && $user->role !== 'client') {
                throw new UserException('This email is already registered with another role');
            }

            if (! $user) {
                if (empty($data['password'])) {
                    throw new UserException('Password is required for new clients');
                }

                $user = User::create([
                    'role' => 'client',
                    'name' => $client->name,
                    'email' => $client->email,
                    'password' => $data['password'],
                    'email_verified_at' => now(),
                    'phone' => $data['phone'] ?? $client->phone,
                    'cpf' => $data['cpf'] ?? $client->cpf,
                ]);
            } elseif (! $user->email_verified_at) {
                $user->update([
                    'email_verified_at' => now(),
                ]);
            }

            $client->update([
                'user_id' => $user->id,
            ]);

            DB::table('client_professional')
                ->where('id', $relation->id)
                ->update([
                    'status' => 'active',
                    'invitation_token' => null,
                    'invitation_accepted_at' => now(),
                    'updated_at' => now(),
                ]);

            $professional = Professional::find($relation->professional_id);

            if ($professional) {
                $client->professionals()->syncWithoutDetaching([
                    $professional->id => [
                        'status' => 'active',
                        'invitation_token' => null,
                        'invitation_accepted_at' => now(),
                    ],
                ]);
            }

            return $user->load('client.professionals');
        });
    }
}
