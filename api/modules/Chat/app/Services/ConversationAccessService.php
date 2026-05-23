<?php

namespace Modules\Chat\Services;

use Illuminate\Database\Eloquent\Builder;
use Modules\Chat\Models\Conversation;
use Modules\Client\Models\Client;
use Modules\Professional\Models\Professional;
use Modules\User\Models\User;

class ConversationAccessService
{
    public function assertCanUseConversation(User $user, Conversation $conversation): void
    {
        abort_unless($this->canUseConversation($user, $conversation), 403, 'Você não tem acesso a esta conversa.');
    }

    public function canUseConversation(User $user, Conversation $conversation): bool
    {
        if (! in_array($user->role, ['client', 'professional'], true)) {
            return false;
        }

        $conversation->loadMissing([
            'firstUser.client.professionals',
            'firstUser.professional.clients',
            'secondUser.client.professionals',
            'secondUser.professional.clients',
        ]);

        if (! $conversation->hasParticipant($user)) {
            return false;
        }

        if ($conversation->first_user_id === $conversation->second_user_id) {
            return false;
        }

        $first = $conversation->firstUser;
        $second = $conversation->secondUser;

        if (! $first || ! $second) {
            return false;
        }

        if ($first->role === $second->role) {
            return false;
        }

        $client = $first->client ?: $second->client;
        $professional = $first->professional ?: $second->professional;

        if (! $client || ! $professional) {
            return false;
        }

        return $this->isActiveClientProfessionalPair($client, $professional);
    }

    public function assertCanStartWithProfessional(User $user, Professional $professional): void
    {
        if ($user->id === $professional->user_id) {
            abort(422, 'Você não pode iniciar conversa com seu próprio perfil.');
        }

        if ($user->role === 'client') {
            $client = $user->client;
            abort_unless($client, 403, 'Cliente não encontrado.');
            abort_unless($this->isActiveClientProfessionalPair($client, $professional), 403, 'Você só pode conversar com profissionais vinculados ao seu acompanhamento.');
            return;
        }

        if ($user->role === 'professional') {
            $ownProfessional = $user->professional;
            abort_unless($ownProfessional, 403, 'Profissional não encontrado.');
            abort_unless($ownProfessional->id === $professional->id, 403, 'Profissionais só podem abrir conversas pelo perfil dos seus pacientes.');
            return;
        }

        abort(403, 'Perfil sem permissão para iniciar conversa.');
    }

    public function assertCanStartWithClient(User $user, Client $client): void
    {
        if ($user->id === $client->user_id) {
            abort(422, 'Você não pode iniciar conversa com seu próprio perfil.');
        }

        if ($user->role !== 'professional') {
            abort(403, 'Somente profissionais podem abrir conversa pelo perfil do cliente.');
        }

        $ownProfessional = $user->professional;
        abort_unless($ownProfessional, 403, 'Profissional não encontrado.');
        abort_unless($client->user, 422, 'Este cliente ainda não possui acesso ativo à plataforma.');
        abort_unless($this->isActiveClientProfessionalPair($client, $ownProfessional), 403, 'Você só pode conversar com clientes vinculados ao seu acompanhamento.');
    }

    public function assertCanStartWithUser(User $user, User $otherUser): void
    {
        if ($user->id === $otherUser->id) {
            abort(422, 'Você não pode iniciar conversa com você mesmo.');
        }

        $user->loadMissing(['client', 'professional']);
        $otherUser->loadMissing(['client', 'professional']);

        if ($user->client && $otherUser->professional) {
            abort_unless($this->isActiveClientProfessionalPair($user->client, $otherUser->professional), 403, 'Conversa não autorizada.');
            return;
        }

        if ($user->professional && $otherUser->client) {
            abort_unless($this->isActiveClientProfessionalPair($otherUser->client, $user->professional), 403, 'Conversa não autorizada.');
            return;
        }

        abort(403, 'Conversa permitida apenas entre cliente e profissional vinculados.');
    }

    private function isActiveClientProfessionalPair(Client $client, Professional $professional): bool
    {
        return $client->professionals()
            ->where('professionals.id', $professional->id)
            ->wherePivot('status', 'active')
            ->exists();
    }

    public function scopedConversationQuery(User $user): Builder
    {
        return Conversation::query()
            ->where(function (Builder $query) use ($user): void {
                $query->where('first_user_id', $user->id)
                    ->orWhere('second_user_id', $user->id);
            });
    }

    public function sanitizePerPage(int $value, int $default = 25, int $max = 50): int
    {
        if ($value < 1) {
            return $default;
        }

        return min($value, $max);
    }
}
