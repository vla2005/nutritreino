<?php

namespace Modules\Chat\Transformers;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Modules\User\Models\User;

class ConversationResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $currentUser = $request->user();
        $other = $this->otherParticipant($currentUser);

        return [
            'uuid' => $this->uuid,
            'participant' => $other ? $this->participant($other) : null,
            'unread_count' => $this->unreadCountFor($currentUser),
            'last_message_at' => $this->last_message_at?->toISOString(),
            'latest_message' => $this->whenLoaded('latestMessage', fn () => $this->latestMessage ? (new MessageResource($this->latestMessage))->resolve($request) : null),
            'messages' => $this->whenLoaded('messages', fn () => MessageResource::collection($this->messages)->resolve($request)),
            'created_at' => $this->created_at?->toISOString(),
            'updated_at' => $this->updated_at?->toISOString(),
        ];
    }

    private function participant(User $user): array
    {
        $user->loadMissing(['professional', 'client']);

        return [
            'uuid' => $user->uuid,
            'name' => $user->name,
            'avatar' => $user->avatar,
            'role' => $user->role,
            'is_online' => false,
            'professional_uuid' => $user->professional?->uuid,
            'client_uuid' => $user->client?->uuid,
            'speciality' => $user->professional?->speciality,
        ];
    }

    private function unreadCountFor(User $user): int
    {
        return (int) $this->messages()
            ->where('sender_id', '!=', $user->id)
            ->whereNull('read_at')
            ->count();
    }
}
