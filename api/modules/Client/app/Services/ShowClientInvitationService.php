<?php

namespace Modules\Client\Services;

use Illuminate\Support\Facades\DB;
use Modules\Client\Models\Client;
use Modules\Client\Transformers\ClientResource;
use Modules\Professional\Models\Professional;
use Modules\Professional\Transformers\ProfessionalResource;
use Modules\User\Exceptions\UserException;
use Modules\User\Models\User;

class ShowClientInvitationService
{
    public function handle(string $token): array
    {
        $relation = DB::table('client_professional')
            ->where('invitation_token', hash('sha256', $token))
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

        $professional = Professional::with('user')->find($relation->professional_id);
        $existingUser = User::where('email', $client->email)->first();

        return [
            'client' => (new ClientResource($client))->resolve(request()),
            'professional' => $professional ? (new ProfessionalResource($professional))->resolve(request()) : null,
            'requires_password' => ! $existingUser,
            'expires_at' => $relation->invitation_expires_at,
        ];
    }
}
