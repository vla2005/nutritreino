<?php

namespace Modules\Professional\Services;

use Illuminate\Support\Arr;
use Illuminate\Support\Facades\DB;
use Modules\Client\Models\Client;
use Modules\Professional\Models\WorkoutProgram;
use Modules\User\Exceptions\UserException;
use Modules\User\Models\User;

class StoreWorkoutProgramService
{
    public function handle(User $user, array $data): WorkoutProgram
    {
        $this->ensureUserIsTrainer($user);

        return DB::transaction(function () use ($user, $data) {
            $client = Client::where('uuid', $data['client_uuid'])->firstOrFail();

            $this->ensureClientBelongsToProfessional($client, $user);

            $workoutProgram = WorkoutProgram::create([
                'professional_id' => $user->professional->id,
                'client_id' => $client->id,
                ...Arr::only($data, [
                    'title',
                    'goal',
                    'level',
                    'start_date',
                    'end_date',
                    'status',
                    'general_notes',
                ]),
            ]);

            foreach ($data['days'] as $dayIndex => $dayData) {
                $day = $workoutProgram->days()->create([
                    ...Arr::only($dayData, [
                        'name',
                        'week_days',
                    ]),
                    'order' => $dayData['order'] ?? $dayIndex,
                ]);

                foreach ($dayData['exercises'] as $exerciseIndex => $exerciseData) {
                    $day->exercises()->create([
                        ...Arr::only($exerciseData, [
                            'name',
                            'sets',
                            'reps',
                            'rest_seconds',
                            'notes',
                        ]),
                        'order' => $exerciseData['order'] ?? $exerciseIndex,
                    ]);
                }
            }

            return $workoutProgram->load('client', 'professional.user', 'days.exercises');
        });
    }

    private function ensureUserIsTrainer(User $user): void
    {
        if (
            $user->role !== 'professional'
            || ! $user->professional
            || $user->professional->speciality !== 'trainer'
        ) {
            throw new UserException('Only trainers can create workout programs');
        }
    }

    private function ensureClientBelongsToProfessional(Client $client, User $user): void
    {
        $belongsToProfessional = $client->professionals()
            ->where('professionals.id', $user->professional->id)
            ->wherePivotIn('status', ['active', 'pending_invite'])
            ->exists();

        if (! $belongsToProfessional) {
            throw new UserException('Client does not belong to this trainer');
        }
    }
}
