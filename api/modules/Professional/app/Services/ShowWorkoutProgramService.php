<?php

namespace Modules\Professional\Services;

use Modules\Professional\Models\WorkoutProgram;
use Modules\User\Exceptions\UserException;
use Modules\User\Models\User;

class ShowWorkoutProgramService
{
    public function handle(User $user, WorkoutProgram $workoutProgram): WorkoutProgram
    {
        $this->ensureUserCanAccessWorkoutProgram($user, $workoutProgram);

        return $workoutProgram->load('client', 'professional.user', 'days.exercises');
    }

    private function ensureUserCanAccessWorkoutProgram(User $user, WorkoutProgram $workoutProgram): void
    {
        $isClient = $user->role === 'client'
            && $user->client
            && $workoutProgram->client_id === $user->client->id;

        $isProfessional = $user->role === 'professional'
            && $user->professional
            && $workoutProgram->professional_id === $user->professional->id;

        if (! $isClient && ! $isProfessional) {
            throw new UserException('User cannot access this workout program');
        }
    }
}
