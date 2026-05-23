<?php

namespace Modules\Chat\Transformers;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class MessageResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'uuid' => $this->uuid,
            'conversation_uuid' => $this->conversation?->uuid,
            'sender_uuid' => $this->sender?->uuid,
            'sender_name' => $this->sender?->name,
            'body' => $this->body(),
            'type' => $this->type,
            'attachment' => $this->hasAttachment() ? [
                'name' => $this->attachmentName(),
                'mime' => $this->attachment_mime,
                'size' => $this->attachment_size,
                'url' => url('/api/messages/'.$this->uuid.'/attachment'),
            ] : null,
            'read_at' => $this->read_at?->toISOString(),
            'created_at' => $this->created_at?->toISOString(),
            'updated_at' => $this->updated_at?->toISOString(),
        ];
    }
}
