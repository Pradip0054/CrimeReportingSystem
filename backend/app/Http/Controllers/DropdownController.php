<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class DropdownController extends Controller
{
    /**
     * 1. Retrieve the structural classification types for administrative police units.
     */
    public function unitTypes()
    {
        return response()->json(['Commissionerate', 'District']);
    }

    /**
     * 2. Filter and retrieve underlying police units belonging to a specific classification type.
     */
    public function unitsByType($type)
    {
        $units = DB::table('police_units')
            ->where('type', $type)
            ->select('id', 'name')
            ->orderBy('name')
            ->get();
            
        return response()->json($units);
    }

    /**
     * 3. Fetch jurisdictions/stations bound strictly to a target parent police unit.
     */
    public function policeStations($unitId)
    {
        $stations = DB::table('police_stations')
            ->where('police_unit_id', $unitId)
            ->select('id', 'station_name')
            ->orderBy('station_name')
            ->get();
            
        return response()->json($stations);
    }

    public function complaintTypes()
    {
        $types = DB::table('complaint_types')
            ->select('id', 'name')
            ->orderBy('name')
            ->get();
            
        return response()->json($types);
    }

    /**
     * 4. Compile a standardized dataset of all stations formatted for frontend consumption.
     */
    public function getAllStationsForAdmin()
    {
        try {
            $stations = DB::table('police_stations')
                ->select('id', 'station_name')
                ->orderBy('station_name', 'asc')
                ->get();

            $formattedStations = $stations->map(function($item) {
                return [
                    'id'   => $item->id,
                    'name' => $item->station_name
                ];
            });

            return response()->json([
                'success' => true,
                'data'    => $formattedStations
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to stream dataset: ' . $e->getMessage()
            ], 500);
        }
    }
}
