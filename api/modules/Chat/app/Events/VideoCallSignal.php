<?php

namespace Modules\Chat\Events;

use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;
use Modules\Chat\Models\Conversation;
use Modules\User\Models\User;

class VideoCallSignal implements ShouldBroadcastNow
{
    use Dispatchable, SerializesModels;

    public function __construct(
        public Conversation $conversation,
        public User $from,
        public User $to,
        public string $callId,
        public string $type,
        public array $payload = [],
    ) {}

    public function broadcastOn(): PrivateChannel
    {
        return new PrivateChannel('users.'.$this->to->uuid);
    }

    public function broadcastAs(): string
    {
        return 'call.signal';
    }

    public function broadcastWith(): array
    {
        return [
            'call_id' => $this->callId,
            'conversation_uuid' => $this->conversation->uuid,
            'type' => $this->type,
            'payload' => $this->payload,
            'from' => [
                'uuid' => $this->from->uuid,
                'name' => $this->from->name,
                'avatar' => $this->from->avatar,
                'role' => $this->from->role,
                'professional_uuid' => $this->from->professional?->uuid,
                'client_uuid' => $this->from->client?->uuid,
                'speciality' => $this->from->professional?->speciality,
            ],
        ];
    }
}
