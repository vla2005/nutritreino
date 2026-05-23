<?php

namespace Modules\MealPlan\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
// use Modules\MealPlan\Database\Factories\MealFoodFactory;

class MealFood extends Model
{
    use HasFactory, HasUuids;

    protected $table = 'meal_foods';

    /**
     * The attributes that are mass assignable.
     */
    protected $fillable = [
        'uuid',
        'meal_id',
        'name',
        'amount',
        'unit',
    ];

    protected $hidden = ['id', 'meal_id'];

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
            'amount' => 'decimal:2',
        ];
    }

    // protected static function newFactory(): MealFoodFactory
    // {
    //     // return MealFoodFactory::new();
    // }

    public function meal()
    {
        return $this->belongsTo(Meal::class);
    }
}
