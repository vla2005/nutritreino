<?php

namespace Modules\Client\Services;

use Illuminate\Http\Request;
use Modules\Client\Models\Client;
use Modules\User\Exceptions\UserException;
use Modules\User\Models\User;

class ClientProgressAccessService
{
    public function resolveClient(User $user, Request $request): Client
    {
        if ($user->role === 'client' && $user->client) {
            return $user->client;
        }

        if ($user->role === 'professional' && $user->professional) {
            if ($request->filled('client_uuid')) {
                $client = Client::where('uuid', $request->string('client_uuid')->toString())->firstOrFail();
                $this->authorizeClient($user, $client);

                return $client;
            }

            $professionalId = $user->professional->id;

            $query = $user->professional->clients()
                ->wherePivotIn('status', ['active', 'pending_invite'])
                ->whereExists(function ($query) use ($professionalId) {
                    $query->selectRaw('1')
                        ->from('client_progress_accesses')
                        ->whereColumn('client_progress_accesses.client_id', 'clients.id')
                        ->where('client_progress_accesses.professional_id', $professionalId)
                        ->whereNull('client_progress_accesses.revoked_at');
                });

            if ($request->filled('client_uuid')) {
                $query->where('clients.uuid', $request->string('client_uuid')->toString());
            }

            $client = $query->first();

            if ($client) {
                return $client;
            }

            abort(403, 'Acesso ao progresso não autorizado pelo cliente.');
        }

        throw new UserException('Cliente não encontrado para acompanhamento de progresso.');
    }

    public function authorizeClient(User $user, Client $client): void
    {
        if ($user->role === 'client' && $user->client?->is($client)) {
            return;
        }

        if ($user->role === 'professional' && $user->professional) {
            $professionalId = $user->professional->id;

            $isLinked = $this->professionalHasClientLink($user, $client);

            $hasAccess = $client->progressAccesses()
                ->where('professional_id', $professionalId)
                ->whereNull('revoked_at')
                ->exists();

            if ($isLinked && $hasAccess) {
                return;
            }

            abort(403, 'Acesso ao progresso não autorizado pelo cliente.');
        }

        throw new UserException('Cliente não encontrado para acompanhamento de progresso.');
    }

    private function professionalHasClientLink(User $user, Client $client): bool
    {
        $professionalId = $user->professional?->id;

        if (! $professionalId) {
            return false;
        }

        $hasRelationship = $user->professional->clients()
            ->where('clients.id', $client->id)
            ->wherePivotIn('status', ['active', 'pending_invite'])
            ->exists();

        if ($hasRelationship) {
            return true;
        }

        $hasWorkout = $client->workoutPrograms()
            ->where('professional_id', $professionalId)
            ->exists();

        if ($hasWorkout) {
            return true;
        }

        return $client->mealPlans()
            ->where('professional_id', $professionalId)
            ->exists();
    }
}
