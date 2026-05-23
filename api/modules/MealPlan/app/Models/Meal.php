<?php

namespace Modules\MealPlan\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
// use Modules\MealPlan\Database\Factories\MealFactory;

class Meal extends Model
{
    use HasFactory, HasUuids;

    /**
     * The attributes that are mass assignable.
     */
    protected $fillable = [
        'uuid',
        'meal_plan_id',
        'name',
        'time',
        'instructions',
    ];

    protected $hidden = ['id', 'meal_plan_id'];

    public function uniqueIds(): array
    {
        return ['uuid'];
    }

    public function getRouteKeyName(): string
    {
        return 'uuid';
    }

    // protected static function newFactory(): MealFactory
    // {
    //     // return MealFactory::new();
    // }

    public function mealPlan()
    {
        return $this->belongsTo(MealPlan::class);
    }

    public function foods()
    {
        return $this->hasMany(MealFood::class);
    }
}
