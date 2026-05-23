<?php

namespace Modules\Chat\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Modules\User\Models\User;

class Conversation extends Model
{
    use HasFactory, HasUuids;

    protected $fillable = [
        'uuid',
        'first_user_id',
        'second_user_id',
        'created_by',
        'last_message_at',
    ];

    protected $hidden = ['id', 'first_user_id', 'second_user_id', 'created_by'];

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
            'last_message_at' => 'datetime',
        ];
    }

    public function firstUser()
    {
        return $this->belongsTo(User::class, 'first_user_id');
    }

    public function secondUser()
    {
        return $this->belongsTo(User::class, 'second_user_id');
    }

    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function messages()
    {
        return $this->hasMany(Message::class);
    }

    public function latestMessage()
    {
        return $this->hasOne(Message::class)->latestOfMany();
    }

    public function hasParticipant(User $user): bool
    {
        return $this->first_user_id === $user->id || $this->second_user_id === $user->id;
    }

    public function otherParticipant(User $user): ?User
    {
        if ($this->first_user_id === $user->id) {
            return $this->secondUser;
        }

        if ($this->second_user_id === $user->id) {
            return $this->firstUser;
        }

        return null;
    }
}
