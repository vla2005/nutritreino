<?php

namespace Modules\Chat\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Modules\Chat\Events\MessagesRead;
use Modules\Chat\Models\Conversation;
use Modules\Chat\Services\ConversationAccessService;
use Modules\Chat\Services\ConversationService;
use Modules\Chat\Transformers\ConversationResource;
use Modules\Client\Models\Client;
use Modules\Professional\Models\Professional;

class ConversationController extends Controller
{
    public function __construct(
        private readonly ConversationAccessService $access,
        private readonly ConversationService $conversations,
    ) {}

    public function index(Request $request)
    {
        $validated = $request->validate([
            'page' => ['nullable', 'integer', 'min:1'],
            'per_page' => ['nullable', 'integer', 'min:1', 'max:50'],
        ]);

        $perPage = $this->access->sanitizePerPage((int) ($validated['per_page'] ?? 25));

        $conversations = $this->access->scopedConversationQuery($request->user())
            ->with([
                'firstUser.professional.clients',
                'firstUser.client.professionals',
                'secondUser.professional.clients',
                'secondUser.client.professionals',
                'latestMessage.sender',
                'latestMessage.conversation',
            ])
            ->orderByDesc('last_message_at')
            ->orderByDesc('updated_at')
            ->paginate($perPage);

        $safeConversations = collect($conversations->items())
            ->filter(fn (Conversation $conversation): bool => $this->access->canUseConversation($request->user(), $conversation))
            ->values();

        return response()->json([
            'data' => ConversationResource::collection($safeConversations)->resolve($request),
            'meta' => [
                'current_page' => $conversations->currentPage(),
                'last_page' => $conversations->lastPage(),
                'per_page' => $conversations->perPage(),
                'total' => $conversations->total(),
                'from' => $conversations->firstItem(),
                'to' => $conversations->lastItem(),
            ],
        ]);
    }

    public function storeWithProfessional(Request $request, Professional $professional)
    {
        $professional->load('user');

        $this->access->assertCanStartWithProfessional($request->user(), $professional);

        $conversation = $this->conversations->firstOrCreate($request->user(), $professional->user);
        $conversation->load(['firstUser.professional', 'firstUser.client', 'secondUser.professional', 'secondUser.client', 'latestMessage.sender', 'latestMessage.conversation']);

        return response()->json([
            'data' => (new ConversationResource($conversation))->resolve($request),
        ], 201);
    }

    public function storeWithClient(Request $request, Client $client)
    {
        $client->load('user');

        $this->access->assertCanStartWithClient($request->user(), $client);

        $conversation = $this->conversations->firstOrCreate($request->user(), $client->user);
        $conversation->load(['firstUser.professional', 'firstUser.client', 'secondUser.professional', 'secondUser.client', 'latestMessage.sender', 'latestMessage.conversation']);

        return response()->json([
            'data' => (new ConversationResource($conversation))->resolve($request),
        ], 201);
    }

    public function show(Request $request, Conversation $conversation)
    {
        $validated = $request->validate([
            'messages_page' => ['nullable', 'integer', 'min:1'],
            'messages_per_page' => ['nullable', 'integer', 'min:1', 'max:100'],
        ]);

        $this->access->assertCanUseConversation($request->user(), $conversation);

        $messagesPerPage = $this->access->sanitizePerPage((int) ($validated['messages_per_page'] ?? 50), 50, 100);

        $this->markAsRead($conversation, $request);

        $conversation->load([
            'firstUser.professional',
            'firstUser.client',
            'secondUser.professional',
            'secondUser.client',
        ]);

        $messages = $conversation->messages()
            ->with('sender', 'conversation')
            ->oldest()
            ->paginate($messagesPerPage, ['*'], 'messages_page');

        $conversation->setRelation('messages', collect($messages->items()));

        return response()->json([
            'data' => (new ConversationResource($conversation))->resolve($request),
            'messages_meta' => [
                'current_page' => $messages->currentPage(),
                'last_page' => $messages->lastPage(),
                'per_page' => $messages->perPage(),
                'total' => $messages->total(),
                'from' => $messages->firstItem(),
                'to' => $messages->lastItem(),
            ],
        ]);
    }

    public function markRead(Request $request, Conversation $conversation)
    {
        $this->access->assertCanUseConversation($request->user(), $conversation);

        $read = $this->markAsRead($conversation, $request);

        return response()->json([
            'data' => [
                'read' => count($read['message_uuids']),
                'message_uuids' => $read['message_uuids'],
                'read_at' => $read['read_at'],
            ],
        ]);
    }

    private function markAsRead(Conversation $conversation, Request $request): array
    {
        $messages = $conversation->messages()
            ->where('sender_id', '!=', $request->user()->id)
            ->whereNull('read_at')
            ->get(['id', 'uuid']);

        if ($messages->isEmpty()) {
            return [
                'message_uuids' => [],
                'read_at' => now()->toISOString(),
            ];
        }

        $readAt = now();

        $conversation->messages()
            ->whereIn('id', $messages->pluck('id'))
            ->update(['read_at' => $readAt]);

        $messageUuids = $messages->pluck('uuid')->values()->all();

        broadcast(new MessagesRead(
            conversation: $conversation,
            reader: $request->user(),
            messageUuids: $messageUuids,
            readAt: $readAt->toISOString(),
        ))->toOthers();

        return [
            'message_uuids' => $messageUuids,
            'read_at' => $readAt->toISOString(),
        ];
    }
}
