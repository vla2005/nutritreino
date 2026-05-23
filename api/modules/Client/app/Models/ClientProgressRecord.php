<?php

namespace Modules\Client\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Modules\Professional\Models\Professional;

class ClientProgressRecord extends Model
{
    use HasFactory, HasUuids;

    protected $fillable = [
        'uuid',
        'client_id',
        'professional_id',
        'record_date',
        'weight',
        'target_weight',
        'notes',
        'sleep_score',
        'hunger_score',
        'energy_score',
        'diet_adherence_score',
        'training_adherence_score',
        'professional_feedback',
    ];

    protected $hidden = ['id', 'client_id', 'professional_id'];

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
            'record_date' => 'date',
            'weight' => 'decimal:2',
            'target_weight' => 'decimal:2',
        ];
    }

    public function client()
    {
        return $this->belongsTo(Client::class);
    }

    public function professional()
    {
        return $this->belongsTo(Professional::class);
    }

    public function measurements()
    {
        return $this->hasMany(ClientProgressMeasurement::class, 'progress_record_id');
    }

    public function photos()
    {
        return $this->hasMany(ClientProgressPhoto::class, 'progress_record_id');
    }

    public function feedbacks()
    {
        return $this->hasMany(ClientProgressFeedback::class, 'progress_record_id');
    }
}
