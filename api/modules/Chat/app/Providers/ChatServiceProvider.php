<?php

namespace Modules\Chat\Providers;

use Illuminate\Support\Facades\Broadcast;
use Nwidart\Modules\Support\ModuleServiceProvider;
use Modules\Chat\Models\Conversation;
use Modules\Chat\Services\ConversationAccessService;

class ChatServiceProvider extends ModuleServiceProvider
{
    protected string $name = 'Chat';

    protected string $nameLower = 'chat';

    protected array $providers = [
        RouteServiceProvider::class,
    ];

    public function boot(): void
    {
        parent::boot();

        Broadcast::channel('conversations.{conversationUuid}', function ($user, string $conversationUuid): bool {
            $conversation = Conversation::query()
                ->where('uuid', $conversationUuid)
                ->first();

            return $conversation
                ? app(ConversationAccessService::class)->canUseConversation($user, $conversation)
                : false;
        });

        Broadcast::channel('users.online', function ($user): array {
            return [
                'uuid' => $user->uuid,
                'name' => $user->name,
            ];
        });

        Broadcast::channel('users.{userUuid}', function ($user, string $userUuid): bool {
            return $user->uuid === $userUuid;
        });
    }
}
