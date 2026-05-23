<?php

namespace Modules\Professional\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Modules\Professional\Models\Professional;
use Modules\Professional\Transformers\ProfessionalResource;

class ProfessionalController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        return view('professional::index');
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create()
    {
        return view('professional::create');
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request) {}

    /**
     * Show the specified resource.
     */
    public function show(Request $request, Professional $professional)
    {
        $professional
            ->load('user')
            ->loadCount([
                'clients as active_clients_count' => fn ($query) => $query->where('client_professional.status', 'active'),
                'workoutPrograms',
                'mealPlans',
            ]);

        return response()->json([
            'data' => (new ProfessionalResource($professional))->resolve($request),
        ]);
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit($id)
    {
        return view('professional::edit');
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, $id) {}

    /**
     * Remove the specified resource from storage.
     */
    public function destroy($id) {}
}
