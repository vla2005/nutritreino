<?php

namespace Modules\Professional\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Modules\Client\Models\Client;

class WorkoutProgram extends Model
{
    use HasFactory, HasUuids;

    protected $fillable = [
        'uuid',
        'professional_id',
        'client_id',
        'title',
        'goal',
        'level',
        'start_date',
        'end_date',
        'status',
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

    public function professional()
    {
        return $this->belongsTo(Professional::class);
    }

    public function client()
    {
        return $this->belongsTo(Client::class);
    }

    public function days()
    {
        return $this->hasMany(WorkoutDay::class)->orderBy('order');
    }
}
