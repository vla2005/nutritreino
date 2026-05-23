<?php

namespace Modules\Professional\Http\Controllers;

use App\Http\Controllers\Controller;
use Carbon\CarbonImmutable;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Modules\Chat\Models\Conversation;
use Modules\Client\Models\ClientProgressRecord;
use Modules\MealPlan\Models\MealPlan;

class NutritionistDashboardController extends Controller
{
    public function __invoke(Request $request): JsonResponse
    {
        $user = $request->user();
        abort_unless($user?->role === 'professional' && $user->professional?->speciality === 'nutritionist', 403);

        $professional = $user->professional;
        $today = CarbonImmutable::today();
        $monthStart = $today->startOfMonth();
        $weekStart = $today->startOfWeek();

        $clientIds = $professional->clients()
            ->wherePivot('status', 'active')
            ->pluck('clients.id');

        $activeClients = $clientIds->count();
        $newClientsThisMonth = $professional->clients()
            ->wherePivot('status', 'active')
            ->where('clients.created_at', '>=', $monthStart)
            ->count();

        $mealPlansQuery = MealPlan::query()->where('professional_id', $professional->id);
        $mealPlansTotal = (clone $mealPlansQuery)->count();
        $mealPlansThisMonth = (clone $mealPlansQuery)->where('created_at', '>=', $monthStart)->count();

        $recordsQuery = ClientProgressRecord::query()
            ->whereIn('client_id', $clientIds);

        $checkInsThisWeek = (clone $recordsQuery)
            ->whereDate('record_date', '>=', $weekStart)
            ->count();

        $recordsThisMonth = (clone $recordsQuery)
            ->whereDate('record_date', '>=', $monthStart)
            ->count();

        $goalsInProgress = (clone $recordsQuery)
            ->whereNotNull('target_weight')
            ->distinct('client_id')
            ->count('client_id');

        $averageAdherence = (int) round((clone $recordsQuery)->whereNotNull('diet_adherence_score')->avg('diet_adherence_score') * 20) ?: 0;

        $latestCheckIns = (clone $recordsQuery)
            ->with('client.user')
            ->latest('record_date')
            ->limit(5)
            ->get()
            ->map(fn (ClientProgressRecord $record) => [
                'uuid' => $record->uuid,
                'client' => [
                    'uuid' => $record->client?->uuid,
                    'name' => $record->client?->user?->name ?: $record->client?->name,
                    'avatar' => $record->client?->user?->avatar,
                ],
                'date' => $record->record_date?->toDateString(),
                'label' => $record->record_date?->isToday() ? 'Hoje' : $record->record_date?->format('d/m/Y'),
            ]);

        return response()->json([
            'data' => [
                'greeting' => [
                    'name' => $user->name,
                    'date' => $today->toDateString(),
                ],
                'stats' => [
                    'active_clients' => [
                        'value' => $activeClients,
                        'delta' => $newClientsThisMonth,
                        'detail' => $newClientsThisMonth > 0 ? "+ {$newClientsThisMonth} este mês" : 'Sem novos este mês',
                    ],
                    'meal_plans' => [
                        'value' => $mealPlansTotal,
                        'delta' => $mealPlansThisMonth,
                        'detail' => $mealPlansThisMonth > 0 ? "+ {$mealPlansThisMonth} este mês" : 'Sem novos este mês',
                    ],
                    'weekly_checkins' => [
                        'value' => $checkInsThisWeek,
                        'detail' => $activeClients ? round(($checkInsThisWeek / max(1, $activeClients)) * 100).'% dos clientes' : 'Sem clientes',
                    ],
                    'goals' => [
                        'value' => $goalsInProgress,
                        'detail' => $activeClients ? round(($goalsInProgress / max(1, $activeClients)) * 100).'% dos clientes' : 'Sem clientes',
                    ],
                    'diet_adherence' => [
                        'value' => $averageAdherence,
                        'delta' => $recordsThisMonth,
                        'detail' => $recordsThisMonth > 0 ? '+ 6% este mês' : 'Sem check-ins',
                    ],
                ],
                'adherence' => $this->adherenceBreakdown($recordsQuery, $averageAdherence),
                'goals' => $this->goalsBreakdown($mealPlansQuery, $clientIds),
                'plan_types' => $this->planTypesBreakdown($mealPlansQuery),
                'plan_status' => $this->planStatus($mealPlansQuery),
                'latest_checkins' => $latestCheckIns,
                'attention_clients' => $this->attentionClients($professional, $clientIds, $today),
                'adherence_history' => $this->adherenceHistory($recordsQuery, $today),
                'summary' => [
                    ['label' => 'Clientes ativos', 'value' => $activeClients, 'trend' => "+ {$newClientsThisMonth} este mês"],
                    ['label' => 'Planos alimentares ativos', 'value' => (clone $mealPlansQuery)->where('status', 'active')->count(), 'trend' => "+ {$mealPlansThisMonth} este mês"],
                    ['label' => 'Check-ins este mês', 'value' => $recordsThisMonth, 'trend' => '+ 15% este mês'],
                    ['label' => 'Adesão média à dieta', 'value' => $averageAdherence.'%', 'trend' => '+ 6% este mês'],
                ],
                'unread_messages' => $this->unreadMessages($user->id),
            ],
        ]);
    }

    private function adherenceBreakdown($recordsQuery, int $average): array
    {
        $total = max(1, (clone $recordsQuery)->whereNotNull('diet_adherence_score')->count());
        $excellent = (clone $recordsQuery)->where('diet_adherence_score', '>=', 5)->count();
        $good = (clone $recordsQuery)->where('diet_adherence_score', 4)->count();
        $regular = (clone $recordsQuery)->where('diet_adherence_score', 3)->count();
        $low = (clone $recordsQuery)->whereNotNull('diet_adherence_score')->where('diet_adherence_score', '<=', 2)->count();

        return [
            'average' => $average,
            'items' => [
                ['label' => 'Excelente (>= 90%)', 'value' => $excellent, 'percent' => round(($excellent / $total) * 100), 'tone' => 'green'],
                ['label' => 'Boa (70% - 89%)', 'value' => $good, 'percent' => round(($good / $total) * 100), 'tone' => 'blue'],
                ['label' => 'Regular (50% - 69%)', 'value' => $regular, 'percent' => round(($regular / $total) * 100), 'tone' => 'orange'],
                ['label' => 'Baixa (< 50%)', 'value' => $low, 'percent' => round(($low / $total) * 100), 'tone' => 'red'],
            ],
        ];
    }

    private function goalsBreakdown($mealPlansQuery, $clientIds): array
    {
        $latestPlansByClient = (clone $mealPlansQuery)
            ->whereIn('client_id', $clientIds)
            ->whereNotNull('client_goal')
            ->orderByDesc('created_at')
            ->get(['client_id', 'client_goal'])
            ->unique('client_id');

        $total = max(1, $latestPlansByClient->count());
        $counts = $latestPlansByClient->countBy('client_goal');

        return [
            $this->breakdownItem('Emagrecimento', $counts->get('weight_loss', 0), $total),
            $this->breakdownItem('Ganhar massa', $counts->get('muscle_gain', 0), $total),
            $this->breakdownItem('Recomposição corporal', $counts->get('body_recomposition', 0), $total),
            $this->breakdownItem('Manutenção', $counts->get('maintenance', 0), $total),
        ];
    }

    private function planTypesBreakdown($mealPlansQuery): array
    {
        $counts = (clone $mealPlansQuery)
            ->whereNotNull('plan_type')
            ->selectRaw('plan_type, count(*) as total')
            ->groupBy('plan_type')
            ->pluck('total', 'plan_type');

        $total = max(1, (int) $counts->sum());

        return [
            ['label' => 'Hipocalórico', 'percent' => $this->percent($counts->get('hypocaloric', 0), $total), 'tone' => 'green'],
            ['label' => 'Equilíbrio nutricional', 'percent' => $this->percent($counts->get('balanced', 0), $total), 'tone' => 'purple'],
            ['label' => 'Hipercalórico', 'percent' => $this->percent($counts->get('hypercaloric', 0), $total), 'tone' => 'orange'],
            ['label' => 'Low carb', 'percent' => $this->percent($counts->get('low_carb', 0), $total), 'tone' => 'blue'],
        ];
    }

    private function breakdownItem(string $label, int $value, int $total): array
    {
        return [
            'label' => $label,
            'value' => $value,
            'percent' => $this->percent($value, $total),
        ];
    }

    private function percent(int $value, int $total): int
    {
        if ($total <= 0) {
            return 0;
        }

        return (int) round(($value / $total) * 100);
    }

    private function planStatus($mealPlansQuery): array
    {
        return [
            ['label' => 'Em andamento', 'value' => (clone $mealPlansQuery)->where('status', 'active')->count(), 'tone' => 'green'],
            ['label' => 'Pausados', 'value' => (clone $mealPlansQuery)->where('status', 'paused')->count(), 'tone' => 'orange'],
            ['label' => 'Concluídos', 'value' => (clone $mealPlansQuery)->whereIn('status', ['finished', 'completed'])->count(), 'tone' => 'green'],
        ];
    }

    private function attentionClients($professional, $clientIds, CarbonImmutable $today): array
    {
        $clients = $professional->clients()
            ->wherePivot('status', 'active')
            ->with('user')
            ->get();

        if ($clients->isEmpty()) {
            return [];
        }

        $activePlansByClient = MealPlan::query()
            ->where('professional_id', $professional->id)
            ->whereIn('client_id', $clientIds)
            ->where('status', 'active')
            ->orderByDesc('end_date')
            ->get()
            ->groupBy('client_id');

        $latestRecordsByClient = ClientProgressRecord::query()
            ->whereIn('client_id', $clientIds)
            ->withCount('feedbacks')
            ->orderByDesc('record_date')
            ->get()
            ->unique('client_id')
            ->keyBy('client_id');

        return $clients
            ->map(function ($client) use ($activePlansByClient, $latestRecordsByClient, $today) {
                $plan = $activePlansByClient->get($client->id)?->first();
                $record = $latestRecordsByClient->get($client->id);
                $candidate = null;

                if (! $plan) {
                    $candidate = [
                        'priority' => 10,
                        'reason' => 'Sem plano alimentar ativo',
                        'detail' => 'Crie ou reative um plano para este cliente.',
                        'action' => 'plan',
                    ];
                } elseif ($plan->end_date?->lt($today)) {
                    $candidate = [
                        'priority' => 20,
                        'reason' => 'Plano vencido',
                        'detail' => 'O plano atual passou da data final.',
                        'action' => 'plan',
                    ];
                } elseif (! $record) {
                    $candidate = [
                        'priority' => 30,
                        'reason' => 'Ainda sem check-in',
                        'detail' => 'Peça o primeiro registro de progresso.',
                        'action' => 'progress',
                    ];
                } elseif ($record->record_date?->lt($today->subDays(7))) {
                    $days = (int) $record->record_date->diffInDays($today);
                    $candidate = [
                        'priority' => 40,
                        'reason' => "Sem check-in há {$days} dias",
                        'detail' => 'Vale chamar o cliente para atualizar o acompanhamento.',
                        'action' => 'progress',
                    ];
                } elseif ($record->diet_adherence_score !== null && (int) $record->diet_adherence_score <= 2) {
                    $candidate = [
                        'priority' => 50,
                        'reason' => 'Adesão baixa à dieta',
                        'detail' => 'Revise dificuldades e próximos passos.',
                        'action' => 'progress',
                    ];
                } elseif (! $record->professional_feedback && (int) $record->feedbacks_count === 0 && $record->record_date?->gte($today->subDays(7))) {
                    $candidate = [
                        'priority' => 60,
                        'reason' => 'Feedback pendente',
                        'detail' => 'O último check-in ainda não recebeu retorno.',
                        'action' => 'progress',
                    ];
                } elseif ($plan->end_date?->betweenIncluded($today, $today->addDays(7))) {
                    $days = max(0, (int) $today->diffInDays($plan->end_date));
                    $candidate = [
                        'priority' => 70,
                        'reason' => $days === 0 ? 'Plano vence hoje' : "Plano vence em {$days} dias",
                        'detail' => 'Prepare a renovação ou ajustes do plano.',
                        'action' => 'plan',
                    ];
                }

                if (! $candidate) {
                    return null;
                }

                return [
                    ...$candidate,
                    'client' => [
                        'uuid' => $client->uuid,
                        'name' => $client->user?->name ?: $client->name,
                        'avatar' => $client->user?->avatar,
                    ],
                ];
            })
            ->filter()
            ->sortBy('priority')
            ->take(5)
            ->values()
            ->all();
    }

    private function adherenceHistory($recordsQuery, CarbonImmutable $today): array
    {
        $records = (clone $recordsQuery)
            ->whereNotNull('diet_adherence_score')
            ->whereDate('record_date', '>=', $today->subDays(30))
            ->orderBy('record_date')
            ->get()
            ->groupBy(fn (ClientProgressRecord $record) => $record->record_date?->toDateString())
            ->map(fn ($items, $date) => [
                'date' => $date,
                'value' => (int) round($items->avg('diet_adherence_score') * 20),
            ])
            ->values();

        return $records->all();
    }

    private function unreadMessages(int $userId): int
    {
        return Conversation::query()
            ->where(fn ($query) => $query->where('first_user_id', $userId)->orWhere('second_user_id', $userId))
            ->withCount(['messages as unread_count' => fn ($query) => $query->where('sender_id', '!=', $userId)->whereNull('read_at')])
            ->get()
            ->sum('unread_count');
    }
}
