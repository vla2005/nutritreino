<?php

namespace Modules\Professional\Services;

use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Builder;
use Modules\Professional\Models\WorkoutProgram;
use Modules\User\Exceptions\UserException;
use Modules\User\Models\User;

class ListWorkoutProgramsService
{
    public function handle(User $user, int $perPage = 10, ?string $clientUuid = null, array $filters = []): LengthAwarePaginator
    {
        return $this->queryFor($user, $clientUuid)
            ->with('client', 'professional.user')
            ->when($filters['search'] ?? null, function (Builder $query, string $search) {
                $query->where(function (Builder $query) use ($search) {
                    $query
                        ->where('title', 'like', "%{$search}%")
                        ->orWhere('goal', 'like', "%{$search}%")
                        ->orWhereHas('client', fn (Builder $clientQuery) => $clientQuery->where('name', 'like', "%{$search}%"));
                });
            })
            ->when($filters['status'] ?? null, fn (Builder $query, string $status) => $query->where('status', $status))
            ->when($filters['goal'] ?? null, fn (Builder $query, string $goal) => $query->where('goal', $goal))
            ->latest()
            ->paginate($perPage);
    }

    public function goals(User $user, ?string $clientUuid = null): array
    {
        return $this->queryFor($user, $clientUuid)
            ->whereNotNull('goal')
            ->where('goal', '!=', '')
            ->distinct()
            ->orderBy('goal')
            ->pluck('goal')
            ->values()
            ->all();
    }

    public function stats(User $user, ?string $clientUuid = null): array
    {
        $query = $this->queryFor($user, $clientUuid);
        $total = (clone $query)->count();
        $withGoal = (clone $query)->whereNotNull('goal')->where('goal', '!=', '')->count();

        return [
            'total' => $total,
            'active' => (clone $query)->where('status', 'active')->count(),
            'latest_update' => (clone $query)->max('updated_at'),
            'goal_completion_percent' => $total > 0 ? (int) round(($withGoal / $total) * 100) : 0,
        ];
    }

    private function queryFor(User $user, ?string $clientUuid = null): Builder
    {
        if ($user->role === 'client' && $user->client) {
            return WorkoutProgram::query()
                ->where('client_id', $user->client->id);
        }

        if ($user->role === 'professional' && $user->professional) {
            return WorkoutProgram::query()
                ->where('professional_id', $user->professional->id)
                ->when($clientUuid, fn ($query) => $query->whereHas('client', fn ($clientQuery) => $clientQuery->where('uuid', $clientUuid)));
        }

        throw new UserException('User cannot access workout programs');
    }
}
