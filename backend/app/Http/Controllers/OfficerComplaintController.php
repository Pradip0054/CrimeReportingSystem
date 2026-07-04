<?php
namespace App\Http\Controllers;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Schema;
class OfficerComplaintController extends Controller
{
    public function __construct()
    {
        $this->middleware('auth:sanctum');
    }

    /**
     * Fetch complaints scoped to the authenticated officer's station jurisdiction.
     */
    public function index()
    {
        $user = auth()->user(); 

        if (!$user) {
            return response()->json(['success' => false, 'error' => 'Unauthorized'], 401);
        }

        try {
            // Core query builder mapping regional relations
            $query = DB::table('complaints')
                ->leftJoin('police_stations', 'complaints.police_station_id', '=', 'police_stations.id')
                ->leftJoin('complaint_types', 'complaints.complaint_type_id', '=', 'complaint_types.id');

            // Enforce station boundary scoping
            if (Schema::hasColumn('complaints', 'officer_id')) {
                $query->where(function($q) use ($user) {
                    $q->where('complaints.officer_id', $user->id)
                      ->orWhere('complaints.police_station_id', $user->police_station_id);
                });
            } else {
                $query->where('complaints.police_station_id', $user->police_station_id);
            }

            // Standardize field selection aliases
            $stationColumn = Schema::hasColumn('police_stations', 'station_name') ? 'police_stations.station_name' : 'police_stations.name';
            
            $complaints = $query->select([
                    'complaints.*',
                    DB::raw("COALESCE($stationColumn, 'General Jurisdiction') as station"),
                    DB::raw("COALESCE(complaint_types.name, 'General Case') as type")
                ])
                ->orderBy('complaints.id', 'desc')
                ->get();

            $pendingCount = 0;
            $underProgressCount = 0;
            $resolvedCount = 0;

            // Compute statistics and append nested chronological history logs
            foreach ($complaints as $complaint) {
                $complaint->status = $complaint->status ?? 'Pending';
                $statusLower = strtolower(trim($complaint->status));

                $complaint->investigation_logs = DB::table('investigation_logs')
                    ->where('complaint_id', $complaint->id)
                    ->orderBy('id', 'asc')
                    ->get();

                if (str_contains($statusLower, 'pending')) {
                    $pendingCount++;
                } elseif (str_contains($statusLower, 'assigned') || str_contains($statusLower, 'investigation') || str_contains($statusLower, 'progress')) {
                    $underProgressCount++;
                } elseif (str_contains($statusLower, 'resolved') || str_contains($statusLower, 'closed') || str_contains($statusLower, 'solved')) {
                    $resolvedCount++;
                }
            }

            return response()->json([
                'success' => true,
                'stats' => [
                    'pending'        => $pendingCount,
                    'under_progress' => $underProgressCount, 
                    'resolved'       => $resolvedCount
                ],
                'complaints' => $complaints,
                'data' => $complaints
            ], 200);

        } catch (\Exception $e) {
            Log::error("Officer Dashboard Fetch Error: " . $e->getMessage());
            
            return response()->json([
                'success' => false,
                'message' => 'Database SQL Error: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Map variable input strings to uniform relational database states.
     */
    private function normalizeStatus($rawStatus)
    {
        $statusLower = strtolower(trim($rawStatus));

        if (str_contains($statusLower, 'investigation')) {
            return 'Under Investigation';
        } elseif (str_contains($statusLower, 'resolved')) {
            return 'Resolved';
        } elseif (str_contains($statusLower, 'pending')) {
            return 'Pending';
        }

        return $rawStatus;
    }

    /**
     * Insert tracking mutations into the investigation registry.
     */
    private function logInvestigation($complaintId, $officerId, $beforeStatus, $afterStatus, $logEntry)
    {
        DB::table('investigation_logs')->insert([
            'complaint_id'  => $complaintId,
            'officer_id'    => $officerId,
            'status_before' => $beforeStatus,
            'status_after'  => $afterStatus,
            'log_entry'     => $logEntry,
            'created_at'    => now(),
            'updated_at'    => now(),
        ]);
    }

    /**
     * Update active case data safely within a managed database transaction database block.
     */
    public function updateStatus(Request $request, $id)
    {
        $officerId = auth()->id();

        if (!$officerId) {
            return response()->json(['success' => false, 'error' => 'Unauthorized'], 401);
        }

        $request->validate([
            'status'            => 'required|string',
            'investigation_log' => 'required|string|min:10'
        ]);

        DB::beginTransaction();

        try {
            $currentComplaint = DB::table('complaints')->where('id', $id)->first();

            if (!$currentComplaint) {
                return response()->json(['success' => false, 'message' => 'Complaint docket context record not found.'], 404);
            }

            $newStatus = $this->normalizeStatus($request->status);

            $this->logInvestigation(
                $id, 
                $officerId, 
                $currentComplaint->status ?? 'Pending', 
                $newStatus, 
                $request->investigation_log
            );

            $updateFields = [
                'status'     => $newStatus, 
                'updated_at' => now()
            ];

            if (Schema::hasColumn('complaints', 'officer_id')) {
                $updateFields['officer_id'] = $officerId;
            }

            DB::table('complaints')->where('id', $id)->update($updateFields);

            DB::commit();
            return response()->json([
                'success' => true,
                'message' => 'Investigation workflow matrix updated successfully.'
            ], 200);

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error("Officer Status Update Error: " . $e->getMessage());
            return response()->json([
                'success' => false,
                'error' => 'Internal Application Processing Error.'
            ], 500);
        }
    }
}