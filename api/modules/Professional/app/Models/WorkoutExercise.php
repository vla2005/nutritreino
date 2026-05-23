<?php

namespace Modules\Professional\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class WorkoutExercise extends Model
{
    use HasFactory, HasUuids;

    protected $fillable = [
        'uuid',
        'workout_day_id',
        'name',
        'sets',
        'reps',
        'rest_seconds',
        'notes',
        'order',
    ];

    protected $hidden = ['id', 'workout_day_id'];

    public function uniqueIds(): array
    {
        return ['uuid'];
    }

    public function getRouteKeyName(): string
    {
        return 'uuid';
    }

    public function workoutDay()
    {
        return $this->belongsTo(WorkoutDay::class);
    }
}
