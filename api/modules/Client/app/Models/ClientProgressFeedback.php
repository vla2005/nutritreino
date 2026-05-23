<?php

namespace Modules\Client\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Modules\Professional\Models\Professional;

class ClientProgressFeedback extends Model
{
    use HasFactory, HasUuids;

    protected $table = 'client_progress_feedbacks';

    protected $fillable = [
        'uuid',
        'progress_record_id',
        'professional_id',
        'feedback',
    ];

    protected $hidden = ['id', 'progress_record_id', 'professional_id'];

    public function uniqueIds(): array
    {
        return ['uuid'];
    }

    public function getRouteKeyName(): string
    {
        return 'uuid';
    }

    public function record()
    {
        return $this->belongsTo(ClientProgressRecord::class, 'progress_record_id');
    }

    public function professional()
    {
        return $this->belongsTo(Professional::class);
    }
}
