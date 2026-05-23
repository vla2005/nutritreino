<?php

namespace Modules\Professional\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class WorkoutDay extends Model
{
    use HasFactory, HasUuids;

    protected $fillable = [
        'uuid',
        'workout_program_id',
        'name',
        'week_days',
        'order',
    ];

    protected $hidden = ['id', 'workout_program_id'];

    public function uniqueIds(): array
    {
        return ['uuid'];
    }

    public function getRouteKeyName(): string
    {
        return 'uuid';
    }

    public function workoutProgram()
    {
        return $this->belongsTo(WorkoutProgram::class);
    }

    public function exercises()
    {
        return $this->hasMany(WorkoutExercise::class)->orderBy('order');
    }
}
