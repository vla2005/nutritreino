<?php

namespace Modules\Professional\Http\Controllers;

use App\Http\Controllers\Controller;
use Carbon\CarbonImmutable;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Modules\Chat\Models\Conversation;
use Modules\Client\Models\ClientProgressRecord;
use Modules\Professional\Models\WorkoutProgram;

class TrainerDashboardController extends Controller
{
    public function __invoke(Request $request): JsonResponse
    {
        $user = $request->user();
        abort_unless($user?->role === 'professional' && $user->professional?->speciality === 'trainer', 403);

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

        $programsQuery = WorkoutProgram::query()->where('professional_id', $professional->id);
        $programsTotal = (clone $programsQuery)->count();
        $programsThisMonth = (clone $programsQuery)->where('created_at', '>=', $monthStart)->count();
        $activePrograms = (clone $programsQuery)->where('status', 'active')->count();
        $activeProgramsThisMonth = (clone $programsQuery)->where('status', 'active')->where('created_at', '>=', $monthStart)->count();

        $recordsQuery = ClientProgressRecord::query()
            ->whereIn('client_id', $clientIds);

        $checkInsThisWeek = (clone $recordsQuery)
            ->whereDate('record_date', '>=', $weekStart)
            ->count();

        $recordsThisMonth = (clone $recordsQuery)
            ->whereDate('record_date', '>=', $monthStart)
            ->count();

        $averageAdherence = (int) round((clone $recordsQuery)->whereNotNull('training_adherence_score')->avg('training_adherence_score') * 20) ?: 0;

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
                    'workout_programs' => [
                        'value' => $programsTotal,
                        'delta' => $programsThisMonth,
                        'detail' => $programsThisMonth > 0 ? "+ {$programsThisMonth} este mês" : 'Sem novos este mês',
                    ],
                    'active_workouts' => [
                        'value' => $activePrograms,
                        'delta' => $activeProgramsThisMonth,
                        'detail' => $activeProgramsThisMonth > 0 ? "+ {$activeProgramsThisMonth} este mês" : 'Sem novos este mês',
                    ],
                    'weekly_checkins' => [
                        'value' => $checkInsThisWeek,
                        'detail' => $activeClients ? round(($checkInsThisWeek / max(1, $activeClients)) * 100).'% dos alunos' : 'Sem alunos',
                    ],
                ],
                'adherence' => $this->adherenceBreakdown($recordsQuery, $averageAdherence),
                'goals' => $this->goalsBreakdown($programsQuery, $clientIds),
                'program_status' => $this->programStatus($programsQuery),
                'latest_checkins' => $latestCheckIns,
                'attention_students' => $this->attentionStudents($professional, $clientIds, $today),
                'adherence_history' => $this->adherenceHistory($recordsQuery, $today),
                'summary' => [
                    ['label' => 'Alunos ativos', 'value' => $activeClients, 'trend' => "+ {$newClientsThisMonth} este mês"],
                    ['label' => 'Treinos ativos', 'value' => $activePrograms, 'trend' => "+ {$activeProgramsThisMonth} este mês"],
                    ['label' => 'Check-ins do mês', 'value' => $recordsThisMonth, 'trend' => '+ 20 este mês'],
                    ['label' => 'Adesão média aos treinos', 'value' => $averageAdherence.'%', 'trend' => '+ 5% este mês'],
                ],
                'unread_messages' => $this->unreadMessages($user->id),
            ],
        ]);
    }

    private function adherenceBreakdown($recordsQuery, int $average): array
    {
        $total = max(1, (clone $recordsQuery)->whereNotNull('training_adherence_score')->count());
        $excellent = (clone $recordsQuery)->where('training_adherence_score', '>=', 5)->count();
        $good = (clone $recordsQuery)->where('training_adherence_score', 4)->count();
        $regular = (clone $recordsQuery)->where('training_adherence_score', 3)->count();
        $low = (clone $recordsQuery)->whereNotNull('training_adherence_score')->where('training_adherence_score', '<=', 2)->count();

        return [
            'average' => $average,
            'items' => [
                ['label' => 'Excelente', 'value' => $excellent, 'percent' => $this->percent($excellent, $total), 'tone' => 'green'],
                ['label' => 'Boa', 'value' => $good, 'percent' => $this->percent($good, $total), 'tone' => 'blue'],
                ['label' => 'Regular', 'value' => $regular, 'percent' => $this->percent($regular, $total), 'tone' => 'orange'],
                ['label' => 'Baixa', 'value' => $low, 'percent' => $this->percent($low, $total), 'tone' => 'red'],
            ],
        ];
    }

    private function goalsBreakdown($programsQuery, $clientIds): array
    {
        $latestProgramsByClient = (clone $programsQuery)
            ->whereIn('client_id', $clientIds)
            ->whereNotNull('goal')
            ->orderByDesc('created_at')
            ->get(['client_id', 'goal'])
            ->unique('client_id');

        $total = max(1, $latestProgramsByClient->count());
        $counts = $latestProgramsByClient
            ->map(fn ($program) => $this->goalCategory($program->goal))
            ->countBy();

        return [
            $this->breakdownItem('Hipertrofia', $counts->get('Hipertrofia', 0), $total),
            $this->breakdownItem('Emagrecimento', $counts->get('Emagrecimento', 0), $total),
            $this->breakdownItem('Força', $counts->get('Força', 0), $total),
            $this->breakdownItem('Condicionamento físico', $counts->get('Condicionamento físico', 0), $total),
        ];
    }

    private function programStatus($programsQuery): array
    {
        return [
            ['label' => 'Em andamento', 'value' => (clone $programsQuery)->where('status', 'active')->count(), 'tone' => 'green'],
            ['label' => 'Pausados', 'value' => (clone $programsQuery)->whereIn('status', ['paused', 'inactive'])->count(), 'tone' => 'orange'],
            ['label' => 'Concluídos', 'value' => (clone $programsQuery)->whereIn('status', ['finished', 'completed'])->count(), 'tone' => 'blue'],
        ];
    }

    private function attentionStudents($professional, $clientIds, CarbonImmutable $today): array
    {
        $students = $professional->clients()
            ->wherePivot('status', 'active')
            ->with('user')
            ->get();

        if ($students->isEmpty()) {
            return [];
        }

        $activeProgramsByClient = WorkoutProgram::query()
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

        return $students
            ->map(function ($student) use ($activeProgramsByClient, $latestRecordsByClient, $today) {
                $program = $activeProgramsByClient->get($student->id)?->first();
                $record = $latestRecordsByClient->get($student->id);
                $candidate = null;

                if (! $program) {
                    $candidate = ['priority' => 10, 'reason' => 'Sem treino ativo', 'detail' => 'Crie ou reative um programa de treino.', 'action' => 'program'];
                } elseif ($program->end_date?->lt($today)) {
                    $candidate = ['priority' => 20, 'reason' => 'Treino vencido', 'detail' => 'O programa passou da data final.', 'action' => 'program'];
                } elseif (! $record) {
                    $candidate = ['priority' => 30, 'reason' => 'Ainda sem check-in', 'detail' => 'Peça o primeiro registro de progresso.', 'action' => 'progress'];
                } elseif ($record->record_date?->lt($today->subDays(7))) {
                    $days = (int) $record->record_date->diffInDays($today);
                    $candidate = ['priority' => 40, 'reason' => "Sem check-in há {$days} dias", 'detail' => 'Vale chamar o aluno para atualizar o acompanhamento.', 'action' => 'progress'];
                } elseif ($record->training_adherence_score !== null && (int) $record->training_adherence_score <= 2) {
                    $candidate = ['priority' => 50, 'reason' => 'Baixa adesão ao treino', 'detail' => 'Revise frequência, carga ou dificuldades relatadas.', 'action' => 'progress'];
                } elseif (! $record->professional_feedback && (int) $record->feedbacks_count === 0 && $record->record_date?->gte($today->subDays(7))) {
                    $candidate = ['priority' => 60, 'reason' => 'Feedback pendente', 'detail' => 'O último check-in ainda não recebeu retorno.', 'action' => 'progress'];
                } elseif ($program->end_date?->betweenIncluded($today, $today->addDays(7))) {
                    $days = max(0, (int) $today->diffInDays($program->end_date));
                    $candidate = ['priority' => 70, 'reason' => $days === 0 ? 'Treino vence hoje' : "Treino vence em {$days} dias", 'detail' => 'Prepare a renovação ou ajustes do treino.', 'action' => 'program'];
                }

                if (! $candidate) {
                    return null;
                }

                return [
                    ...$candidate,
                    'student' => [
                        'uuid' => $student->uuid,
                        'name' => $student->user?->name ?: $student->name,
                        'avatar' => $student->user?->avatar,
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
            ->whereNotNull('training_adherence_score')
            ->whereDate('record_date', '>=', $today->subDays(30))
            ->orderBy('record_date')
            ->get()
            ->groupBy(fn (ClientProgressRecord $record) => $record->record_date?->toDateString())
            ->map(fn ($items, $date) => [
                'date' => $date,
                'value' => (int) round($items->avg('training_adherence_score') * 20),
            ])
            ->values();

        return $records->all();
    }

    private function breakdownItem(string $label, int $value, int $total): array
    {
        return ['label' => $label, 'value' => $value, 'percent' => $this->percent($value, $total)];
    }

    private function percent(int $value, int $total): int
    {
        if ($total <= 0) {
            return 0;
        }

        return (int) round(($value / $total) * 100);
    }

    private function goalCategory(?string $goal): string
    {
        $normalized = mb_strtolower((string) $goal);

        if (str_contains($normalized, 'emagrec')) return 'Emagrecimento';
        if (str_contains($normalized, 'for')) return 'Força';
        if (str_contains($normalized, 'condicion')) return 'Condicionamento físico';

        return 'Hipertrofia';
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
