<?php

namespace Modules\Client\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ClientProgressMeasurement extends Model
{
    use HasFactory;

    protected $fillable = [
        'progress_record_id',
        'type',
        'value',
    ];

    protected $hidden = ['id', 'progress_record_id'];

    protected function casts(): array
    {
        return [
            'value' => 'decimal:2',
        ];
    }

    public function record()
    {
        return $this->belongsTo(ClientProgressRecord::class, 'progress_record_id');
    }
}
