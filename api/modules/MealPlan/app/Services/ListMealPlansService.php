<?php

namespace Modules\MealPlan\Services;

use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Builder;
use Modules\MealPlan\Models\MealPlan;
use Modules\User\Exceptions\UserException;
use Modules\User\Models\User;

class ListMealPlansService
{
    public function handle(User $user, int $perPage = 10, ?string $clientUuid = null, array $filters = []): LengthAwarePaginator
    {
        return $this->queryFor($user, $clientUuid)
            ->with('client', 'professional.user')
            ->when($filters['search'] ?? null, function (Builder $query, string $search) {
                $query->where(function (Builder $query) use ($search) {
                    $query
                        ->where('title', 'like', "%{$search}%")
                        ->orWhereHas('client', fn (Builder $clientQuery) => $clientQuery->where('name', 'like', "%{$search}%"));
                });
            })
            ->when($filters['status'] ?? null, fn (Builder $query, string $status) => $query->where('status', $status))
            ->latest()
            ->paginate($perPage);
    }

    public function stats(User $user, ?string $clientUuid = null): array
    {
        $query = $this->queryFor($user, $clientUuid);

        return [
            'total' => (clone $query)->count(),
            'active' => (clone $query)->where('status', 'active')->count(),
            'finished' => (clone $query)->where('status', 'finished')->count(),
            'latest_update' => (clone $query)->max('updated_at'),
        ];
    }

    private function queryFor(User $user, ?string $clientUuid = null): Builder
    {
        if ($user->role === 'client' && $user->client) {
            return MealPlan::query()
                ->where('client_id', $user->client->id);
        }

        if ($user->role === 'professional' && $user->professional) {
            return MealPlan::query()
                ->where('professional_id', $user->professional->id)
                ->when($clientUuid, fn ($query) => $query->whereHas('client', fn ($clientQuery) => $clientQuery->where('uuid', $clientUuid)));
        }

        throw new UserException('User cannot access meal plans');
    }
}
