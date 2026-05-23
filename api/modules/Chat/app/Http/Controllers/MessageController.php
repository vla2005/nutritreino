<?php

namespace Modules\Chat\Http\Controllers;

use App\Http\Controllers\Controller;
use Modules\Chat\Http\Requests\StoreMessageRequest;
use Modules\Chat\Models\Conversation;
use Modules\Chat\Services\ConversationAccessService;
use Modules\Chat\Services\MessageService;
use Modules\Chat\Transformers\MessageResource;

class MessageController extends Controller
{
    public function __construct(
        private readonly ConversationAccessService $access,
        private readonly MessageService $messages,
    ) {}

    public function store(StoreMessageRequest $request, Conversation $conversation)
    {
        $this->access->assertCanUseConversation($request->user(), $conversation);

        $message = $this->messages->create(
            $conversation,
            $request->user(),
            $request->string('body')->toString(),
            $request->file('attachment'),
        );

        return response()->json([
            'data' => (new MessageResource($message))->resolve($request),
        ], 201);
    }
}
