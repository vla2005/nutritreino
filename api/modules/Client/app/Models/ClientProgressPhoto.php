<?php

namespace Modules\Client\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ClientProgressPhoto extends Model
{
    use HasFactory;

    protected $fillable = [
        'progress_record_id',
        'type',
        'path',
        'original_name',
        'mime_type',
        'size',
    ];

    protected $hidden = ['id', 'progress_record_id'];

    public function record()
    {
        return $this->belongsTo(ClientProgressRecord::class, 'progress_record_id');
    }
}
