<?php

namespace Modules\Client\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Modules\MealPlan\Models\MealPlan;
use Modules\Professional\Models\Professional;
use Modules\Professional\Models\WorkoutProgram;
use Modules\User\Models\User;

// use Modules\Client\Database\Factories\ClientFactory;

class Client extends Model
{
    use HasFactory, HasUuids;

    /**
     * The attributes that are mass assignable.
     */
    protected $fillable = [
        'user_id',
        'uuid',
        'name',
        'email',
        'phone',
        'cpf',
        'gender',
        'birth_date',
        'height',
        'weight',
    ];

    protected $hidden = ['id', 'user_id'];

    public function uniqueIds(): array
    {
        return ['uuid'];
    }

    public function getRouteKeyName(): string
    {
        return 'uuid';
    }

    protected function casts(): array
    {
        return [
            'birth_date' => 'date',
        ];
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function professionals()
    {
        return $this->belongsToMany(Professional::class)
            ->withPivot([
                'status',
                'invitation_sent_at',
                'invitation_accepted_at',
                'invitation_expires_at',
            ])
            ->withTimestamps();
    }

    public function workoutPrograms()
    {
        return $this->hasMany(WorkoutProgram::class);
    }

    public function mealPlans()
    {
        return $this->hasMany(MealPlan::class);
    }

    public function progressRecords()
    {
        return $this->hasMany(ClientProgressRecord::class);
    }

    public function progressAccesses()
    {
        return $this->hasMany(ClientProgressAccess::class);
    }
}
