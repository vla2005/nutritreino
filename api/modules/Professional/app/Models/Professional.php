<?php

namespace Modules\Professional\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Modules\Client\Models\Client;
use Modules\Client\Models\ClientProgressAccess;
use Modules\MealPlan\Models\MealPlan;
use Modules\User\Models\User;

// use Modules\Professional\Database\Factories\ProfessionalFactory;

class Professional extends Model
{
    use HasFactory, HasUuids;

    /**
     * The attributes that are mass assignable.
     */
    protected $fillable = ['user_id', 'uuid', 'speciality', 'registration', 'bio'];

    protected $hidden = ['id', 'user_id'];

    public function uniqueIds(): array
    {
        return ['uuid'];
    }

    public function getRouteKeyName(): string
    {
        return 'uuid';
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function clients()
    {
        return $this->belongsToMany(Client::class)
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

    public function clientProgressAccesses()
    {
        return $this->hasMany(ClientProgressAccess::class);
    }
}
