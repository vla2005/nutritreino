<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Modules\Client\Models\Client;
use Modules\User\Exceptions\UserException;

class GeminiPlanSuggestionService
{
    public function mealPlan(Client $client, array $context): array
    {
        return $this->generate('meal_plan', $client, $context, $this->mealPlanSchema());
    }

    public function workoutProgram(Client $client, array $context): array
    {
        return $this->generate('workout_program', $client, $context, $this->workoutSchema());
    }

    private function generate(string $type, Client $client, array $context, array $schema): array
    {
        $apiKey = config('services.gemini.key');
        $model = config('services.gemini.model', 'gemini-2.5-flash');

        if (! $apiKey) {
            throw new UserException('Gemini API key is not configured');
        }

        $response = Http::timeout(60)
            ->retry(1, 300)
            ->withHeaders([
                'x-goog-api-key' => $apiKey,
                'Content-Type' => 'application/json',
            ])
            ->post("https://generativelanguage.googleapis.com/v1beta/models/{$model}:generateContent", [
                'contents' => [[
                    'parts' => [[
                        'text' => $this->prompt($type, $client, $context, $schema),
                    ]],
                ]],
                'generationConfig' => [
                    'temperature' => 0.45,
                    'responseMimeType' => 'application/json',
                ],
            ]);

        if ($response->failed()) {
            throw new UserException($response->json('error.message') ?: 'Gemini did not generate a suggestion');
        }

        $text = data_get($response->json(), 'candidates.0.content.parts.0.text');
        $data = $this->decodeJson($text);

        if (! is_array($data)) {
            throw new UserException('Gemini returned an invalid suggestion');
        }

        return $data;
    }

    private function prompt(string $type, Client $client, array $context, array $schema): string
    {
        $kind = $type === 'meal_plan' ? 'plano alimentar' : 'programa de treino';

        return implode("\n", [
            "Voce e um assistente para profissionais de saude e treino. Gere apenas um rascunho de {$kind} para revisao do profissional.",
            'Nao diagnostique doencas, nao prometa resultados e respeite limitacoes informadas.',
            'Leve obrigatoriamente em consideracao sexo/genero, idade, peso, altura, objetivo, calorias alvo, preferencias e limitacoes do paciente/aluno.',
            'Ajuste porcoes, volume de treino, intensidade e observacoes conforme esses dados. Se algum dado estiver ausente, mencione cautela nas orientacoes gerais.',
            'Responda somente JSON valido, sem markdown, sem texto fora do JSON.',
            'Use portugues do Brasil.',
            'O JSON deve seguir exatamente este formato:',
            json_encode($schema, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT),
            'Para plano alimentar, use a unidade adequada para cada alimento. Valores permitidos em foods[].unit: "g", "ml", "un", "colheres", "fatias".',
            'Exemplos de unidade correta: agua/suco/leite em "ml"; banana/ovo/maca em "un"; arroz/frango/aveia em "g"; pasta de amendoim/azeite em "colheres"; pao/queijo em "fatias".',
            'Nao coloque tudo em gramas se outra unidade fizer mais sentido.',
            'Dados do paciente/aluno:',
            json_encode([
                'name' => $client->name,
                'gender' => $client->gender,
                'birth_date' => $client->birth_date?->toDateString(),
                'age' => $client->birth_date?->age,
                'height_cm' => $client->height,
                'weight_kg' => $client->weight,
            ], JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT),
            'Preferencias, objetivo, calorias, limitacoes e observacoes do profissional:',
            json_encode($context, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT),
            'Se current_draft e adjustment_request forem enviados, ajuste o rascunho atual em vez de criar um plano totalmente novo. Preserve o que nao foi pedido para mudar.',
            'Ao ajustar um plano alimentar existente, preserve a ordem cronologica das refeicoes pelo horario. Nao reordene refeicoes sem pedido explicito.',
        ]);
    }

    private function decodeJson(?string $text): ?array
    {
        if (! $text) {
            return null;
        }

        $clean = trim($text);
        $clean = preg_replace('/^```(?:json)?\s*/i', '', $clean);
        $clean = preg_replace('/\s*```$/', '', $clean);

        $decoded = json_decode($clean, true);

        return json_last_error() === JSON_ERROR_NONE ? $decoded : null;
    }

    private function mealPlanSchema(): array
    {
        return [
            'title' => 'Plano alimentar gerado por IA',
            'general_notes' => 'Orientacoes gerais para o profissional revisar.',
            'meals' => [[
                'name' => 'Cafe da manha',
                'time' => '08:00',
                'instructions' => 'Observacoes da refeicao.',
                'foods' => [[
                    'name' => 'Alimento',
                    'amount' => 100,
                    'unit' => 'g',
                ], [
                    'name' => 'Agua',
                    'amount' => 300,
                    'unit' => 'ml',
                ], [
                    'name' => 'Banana',
                    'amount' => 1,
                    'unit' => 'un',
                ], [
                    'name' => 'Pasta de amendoim',
                    'amount' => 1,
                    'unit' => 'colheres',
                ], [
                    'name' => 'Pao integral',
                    'amount' => 2,
                    'unit' => 'fatias',
                ]],
            ]],
        ];
    }

    private function workoutSchema(): array
    {
        return [
            'title' => 'Programa de treino gerado por IA',
            'goal' => 'Hipertrofia',
            'level' => 'Intermediario',
            'general_notes' => 'Orientacoes gerais para o profissional revisar.',
            'days' => [[
                'name' => 'Treino A',
                'week_days' => 'Segunda e quinta',
                'exercises' => [[
                    'name' => 'Exercicio',
                    'sets' => 3,
                    'reps' => 10,
                    'rest_seconds' => 60,
                    'notes' => 'Observacoes do exercicio.',
                ]],
            ]],
        ];
    }
}
