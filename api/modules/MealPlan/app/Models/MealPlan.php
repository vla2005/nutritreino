<?php

namespace Modules\MealPlan\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Modules\Client\Models\Client;
use Modules\Professional\Models\Professional;
// use Modules\MealPlan\Database\Factories\MealPlanFactory;

class MealPlan extends Model
{
    use HasFactory, HasUuids;

    /**
     * The attributes that are mass assignable.
     */
    protected $fillable = [
        'uuid',
        'professional_id',
        'client_id',
        'title',
        'start_date',
        'end_date',
        'status',
        'client_goal',
        'plan_type',
        'general_notes',
    ];

    protected $hidden = ['id', 'professional_id', 'client_id'];

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
            'start_date' => 'date',
            'end_date' => 'date',
        ];
    }

    // protected static function newFactory(): MealPlanFactory
    // {
    //     // return MealPlanFactory::new();
    // }

    public function professional()
    {
        return $this->belongsTo(Professional::class);
    }

    public function client()
    {
        return $this->belongsTo(Client::class);
    }

    public function meals()
    {
        return $this->hasMany(Meal::class);
    }
}
