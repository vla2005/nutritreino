<?php

namespace Modules\Chat\Services;

use Modules\Chat\Models\Conversation;
use Modules\User\Models\User;

class ConversationService
{
    public function firstOrCreate(User $currentUser, User $otherUser): Conversation
    {
        [$firstUserId, $secondUserId] = collect([$currentUser->id, $otherUser->id])->sort()->values()->all();

        return Conversation::query()->firstOrCreate(
            [
                'first_user_id' => $firstUserId,
                'second_user_id' => $secondUserId,
            ],
            [
                'created_by' => $currentUser->id,
            ]
        );
    }
}
