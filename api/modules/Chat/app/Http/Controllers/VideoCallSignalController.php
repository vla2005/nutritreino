<?php

namespace Modules\Chat\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Modules\Chat\Events\VideoCallSignal;
use Modules\Chat\Models\Conversation;
use Modules\Chat\Services\ConversationAccessService;

class VideoCallSignalController extends Controller
{
    public function __construct(private readonly ConversationAccessService $access) {}

    public function store(Request $request, Conversation $conversation)
    {
        $this->access->assertCanUseConversation($request->user(), $conversation);

        $validated = $request->validate([
            'call_id' => ['required', 'string', 'max:80'],
            'type' => [
                'required',
                'string',
                Rule::in([
                    'invite',
                    'accepted',
                    'rejected',
                    'offer',
                    'answer',
                    'ice-candidate',
                    'ended',
                    'screen-started',
                    'screen-stopped',
                ]),
            ],
            'payload' => ['nullable', 'array'],
        ]);

        $conversation->loadMissing([
            'firstUser.professional',
            'firstUser.client',
            'secondUser.professional',
            'secondUser.client',
        ]);

        $target = $conversation->otherParticipant($request->user());
        abort_unless($target, 404, 'Participante da chamada nÃ£o encontrado.');

        broadcast(new VideoCallSignal(
            conversation: $conversation,
            from: $request->user()->loadMissing(['professional', 'client']),
            to: $target,
            callId: $validated['call_id'],
            type: $validated['type'],
            payload: $validated['payload'] ?? [],
        ))->toOthers();

        return response()->json(['data' => ['sent' => true]]);
    }
}
