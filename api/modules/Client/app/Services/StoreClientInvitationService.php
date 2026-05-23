<?php

namespace Modules\Client\Services;

use Illuminate\Support\Arr;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Str;
use Modules\Client\Models\Client;
use Modules\Client\Notifications\ClientInvitationNotification;
use Modules\User\Exceptions\UserException;
use Modules\User\Models\User;

class StoreClientInvitationService
{
    public function handle(User $professionalUser, array $data): Client
    {
        if ($professionalUser->role !== 'professional' || ! $professionalUser->professional) {
            throw new UserException('Only professionals can invite clients');
        }

        return DB::transaction(function () use ($professionalUser, $data) {
            $client = Client::where('email', $data['email'])->first();

            $this->ensureContactDataIsAvailable($client, $data);

            $existingRelation = $client
                ? DB::table('client_professional')
                    ->where('client_id', $client->id)
                    ->where('professional_id', $professionalUser->professional->id)
                    ->first()
                : null;

            if ($existingRelation?->status === 'active') {
                throw new UserException('Client is already active for this professional');
            }

            $plainToken = Str::random(64);
            $clientData = [
                'name' => $data['name'],
                'email' => $data['email'],
                ...Arr::only($data, [
                    'phone',
                    'cpf',
                    'gender',
                    'birth_date',
                    'height',
                    'weight',
                ]),
            ];

            $client = $client
                ? tap($client)->update($clientData)
                : Client::create($clientData);

            DB::table('client_professional')->updateOrInsert(
                [
                    'client_id' => $client->id,
                    'professional_id' => $professionalUser->professional->id,
                ],
                [
                    'status' => 'pending_invite',
                    'invitation_token' => hash('sha256', $plainToken),
                    'invitation_sent_at' => now(),
                    'invitation_accepted_at' => null,
                    'invitation_expires_at' => now()->addDays(7),
                    'created_at' => $existingRelation->created_at ?? now(),
                    'updated_at' => now(),
                ]
            );

            $requiresPassword = ! User::where('email', $client->email)->exists();

            Notification::route('mail', $client->email)
                ->notify(new ClientInvitationNotification($client, $plainToken, $professionalUser, $requiresPassword));

            return $client->load('professionals');
        });
    }

    private function ensureContactDataIsAvailable(?Client $client, array $data): void
    {
        foreach (['phone', 'cpf'] as $field) {
            if (empty($data[$field])) {
                continue;
            }

            $clientConflict = Client::where($field, $data[$field])
                ->when($client, fn ($query) => $query->whereKeyNot($client->id))
                ->exists();

            $userConflict = User::where($field, $data[$field])
                ->where('email', '!=', $data['email'])
                ->exists();

            if ($clientConflict || $userConflict) {
                throw new UserException("This {$field} is already in use");
            }
        }
    }
}
