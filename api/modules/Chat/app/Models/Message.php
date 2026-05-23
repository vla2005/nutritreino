<?php

namespace Modules\Chat\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Contracts\Encryption\DecryptException;
use Illuminate\Support\Facades\Crypt;
use Modules\User\Models\User;

class Message extends Model
{
    use HasFactory, HasUuids;

    protected $fillable = [
        'uuid',
        'conversation_id',
        'sender_id',
        'encrypted_body',
        'type',
        'attachment_disk',
        'attachment_path',
        'encrypted_attachment_name',
        'attachment_mime',
        'attachment_size',
        'read_at',
    ];

    protected $hidden = [
        'id',
        'conversation_id',
        'sender_id',
        'encrypted_body',
        'attachment_disk',
        'attachment_path',
        'encrypted_attachment_name',
    ];

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
            'read_at' => 'datetime',
        ];
    }

    public function conversation()
    {
        return $this->belongsTo(Conversation::class);
    }

    public function sender()
    {
        return $this->belongsTo(User::class, 'sender_id');
    }

    public function body(): ?string
    {
        if (! $this->encrypted_body) {
            return null;
        }

        try {
            return Crypt::decryptString($this->encrypted_body);
        } catch (DecryptException) {
            return null;
        }
    }

    public function attachmentName(): ?string
    {
        if (! $this->encrypted_attachment_name) {
            return null;
        }

        try {
            return Crypt::decryptString($this->encrypted_attachment_name);
        } catch (DecryptException) {
            return null;
        }
    }

    public function hasAttachment(): bool
    {
        return filled($this->attachment_path);
    }
}
