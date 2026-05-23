<?php

namespace Modules\Client\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Modules\Professional\Models\Professional;

class ClientProgressAccess extends Model
{
    use HasFactory;

    protected $fillable = [
        'client_id',
        'professional_id',
        'granted_at',
        'revoked_at',
    ];

    protected function casts(): array
    {
        return [
            'granted_at' => 'datetime',
            'revoked_at' => 'datetime',
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
}
