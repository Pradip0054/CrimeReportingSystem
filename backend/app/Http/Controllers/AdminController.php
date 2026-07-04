<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Models\Complaint;
use App\Models\PoliceStation; 
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\DB;  
use Illuminate\Support\Facades\Schema;

class AdminController extends Controller
{
    /**
     * Get overview statistics and recent complaints for the admin dashboard.
     */
    public function index()
    {
        try {
            $totalComplaints = DB::table('complaints')->count();
            $totalPolice = DB::table('users')->where('role', 'police')->count();
            $pendingAssignment = DB::table('complaints')->where('status', 'Pending')->count();
            
            $totalCitizens = DB::table('users')->where('role', 'citizen')->count();
            if ($totalCitizens == 0) {
                $totalCitizens = DB::table('complaints')->distinct('phone')->count();
            }

            $stats = [
                'total_complaints'   => $totalComplaints,
                'pending_assignment' => $pendingAssignment,
                'total_police'       => $totalPolice,
                'total_citizens'     => $totalCitizens
            ];

            $recent = DB::table('complaints')
                ->orderBy('id', 'desc')
                ->take(5)
                ->get()
                ->map(function($complaint) {
                    $complaint->status = $complaint->status ?? 'Pending';
                    $complaint->name = $complaint->name ?? "Citizen Report";
                    return $complaint;
                });

            return response()->json([
                'success' => true,
                'stats'   => $stats,
                'recent_complaints' => $recent
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Dashboard Core Error: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Retrieve a list of all police officers along with their assigned stations.
     */
    public function policeList()
    {
        try {
            $police = User::where('role', 'police')
                ->leftJoin('police_stations', 'users.police_station_id', '=', 'police_stations.id')
                ->select(
                    'users.*', 
                    DB::raw('COALESCE(police_stations.station_name, police_stations.name, "Unknown Station") as station_name')
                )
                ->latest('users.created_at')
                ->get();

            return response()->json([
                'success' => true,
                'data'    => $police
            ]);

        } catch (\Exception $e) {
            $policeFallback = User::where('role', 'police')->latest()->get();
            return response()->json([
                'success' => true,
                'data'    => $policeFallback
            ]);
        }
    }

    /**
     * Store a newly created police officer in the system.
     */
    public function storePolice(Request $request)
    {
        $request->validate([
            'name'              => 'required|string|max:255',
            'email'             => 'required|email|unique:users,email',
            'mobile'            => 'required|string',
            'password'          => 'required|min:6',
            'police_station_id' => 'required|integer', 
        ]);

        try {
            $police = User::create([
                'name'              => $request->name,
                'email'             => $request->email,
                'mobile'            => $request->mobile,
                'password'          => Hash::make($request->password),
                'role'              => 'police',
                'police_station_id' => $request->police_station_id, 
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Police Officer created successfully!',
                'data'    => $police
            ]);
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'message' => $e->getMessage()], 500);
        }
    }

    /**
     * Fetch all complaints formatted with their respective station names and complaint types.
     */
    public function allComplaints()
    {
        try {
            $complaints = DB::table('complaints')
                ->orderBy('id', 'desc')
                ->get()
                ->map(function($c) {
                    $c->status = $c->status ?? 'Pending';

                    if (!empty($c->police_station_id)) {
                        $station = DB::table('police_stations')->where('id', $c->police_station_id)->first();
                        $c->station = $station ? ($station->station_name ?? $station->name) : "Station ID: " . $c->police_station_id;
                    } else {
                        $c->station = "General Jurisdiction";
                    }

                    if (!empty($c->complaint_type_id)) {
                        $type = DB::table('complaint_types')->where('id', $c->complaint_type_id)->first();
                        $c->type = $type ? $type->name : "General Case";
                    } else {
                        $c->type = "General Case";
                    }

                    $c->citizen_name = $c->name ?? "Citizen Report"; 

                    return $c;
                });

            return response()->json([
                'success' => true,
                'data'    => $complaints 
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Complaints Fetch Error: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Assign a police officer to a specific complaint based on the available database schema columns.
     */
    public function assignOfficer(Request $request, $id)
    {
        $request->validate([
            'officer_id' => 'required|exists:users,id'
        ]);

        try {
            $updateData = [
                'status'     => 'assigned', 
                'updated_at' => now()
            ];

            if (Schema::hasColumn('complaints', 'officer_id')) {
                $updateData['officer_id'] = $request->officer_id;
            } else {
                $updateData['user_id'] = $request->officer_id;
            }

            DB::table('complaints')->where('id', $id)->update($updateData);

            return response()->json([
                'success' => true,
                'message' => 'Complaint assigned successfully!'
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Assignment failed: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Fetch eligible police officers belonging to the jurisdiction/station of the specified complaint.
     */
    public function getOfficersByComplaint($complaintId)
    {
        try {
            $complaint = DB::table('complaints')->where('id', $complaintId)->first();

            if (!$complaint) {
                return response()->json(['success' => false, 'message' => 'Complaint not found'], 404);
            }

            $stationId = $complaint->police_station_id;
            $stationName = '';

            if (!empty($complaint->station)) {
                $stationName = $complaint->station;
            } elseif ($stationId) {
                $station = DB::table('police_stations')->where('id', $stationId)->first();
                if ($station) {
                    $stationName = $station->station_name ?? $station->name ?? '';
                }
            }

            if (empty($stationName)) {
                $stationName = 'Sabang'; 
            }

            $eligibleOfficers = User::where('role', 'police')
                                    ->where('police_station_id', $stationId) 
                                    ->latest()
                                    ->get();

            if ($eligibleOfficers->isEmpty() && !empty($stationName)) {
                $cleanName = trim(str_replace(['PS', 'ps', 'Police Station', 'police station', 'station', 'Station', 'Unknown Station'], '', $stationName));
                
                if (empty($cleanName)) {
                    $cleanName = 'Sabang';
                }

                $eligibleOfficers = User::where('role', 'police')
                                    ->where(function($query) use ($cleanName) {
                                        $query->where('name', 'LIKE', '%' . $cleanName . '%')
                                              ->orWhere('email', 'LIKE', '%' . $cleanName . '%')
                                              ->orWhere('mobile', 'LIKE', '%' . $cleanName . '%');
                                    })
                                    ->latest()
                                    ->get();
            }

            return response()->json([
                'success'           => true,
                'police_station_id' => $stationId,
                'station_name'      => !empty($stationName) ? $stationName : 'Sabang PS',
                'officers'          => $eligibleOfficers,
                'data'              => $eligibleOfficers 
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error filtering location officers: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get a formatted list of all police stations for selection dropdowns.
     */
    public function getAllPoliceStations()
    {
        try {
            if (Schema::hasTable('police_stations')) {
                $stations = DB::table('police_stations')->get();
                
                $formattedStations = $stations->map(function($item) {
                    return [
                        'id'   => $item->id,
                        'name' => $item->station_name ?? $item->name ?? 'Unknown Station'
                    ];
                });
                
                return response()->json(['success' => true, 'data' => $formattedStations], 200);
            }

            $fallback = [
                ['id' => 1, 'name' => 'Chinsurah PS'],
                ['id' => 2, 'name' => 'Chandannagar PS'],
                ['id' => 3, 'name' => 'Serampore PS'],
                ['id' => 4, 'name' => 'Uttarpara PS'],
            ];
            
            return response()->json(['success' => true, 'data' => $fallback], 200);

        } catch (\Exception $e) {
            return response()->json(['success' => false, 'message' => 'Dropdown Error: ' . $e->getMessage()], 500);
        }
    }
}