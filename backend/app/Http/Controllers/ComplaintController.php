<?php

namespace App\Http\Controllers;

use App\Models\Complaint;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class ComplaintController extends Controller
{
    public function __construct()
    {
        $this->middleware('auth:sanctum');
    }

    /**
     * 1. Validate and store a new complaint with an optional evidence file upload.
     */
    public function store(Request $request)
    {
        $userId = auth()->id();

        if (!$userId) {
            return response()->json(['error' => 'Login required'], 401);
        }

        $request->validate([
            'name' => 'required|string',
            'phone' => 'required',
            'address' => 'required',
            'city' => 'required',
            'state' => 'required',
            'zip' => 'required',
            'police_unit_id' => 'required',
            'police_station_id' => 'required',
            'complaint_type_id' => 'required',
            'description' => 'required',
            'incident_date' => 'required|date',
            'incident_time' => 'required',
            'incident_location' => 'required',
            'evidence' => 'nullable|file|mimes:jpg,png,pdf,mp4|max:20480',
        ]);

        $evidencePath = null;
        if ($request->hasFile('evidence')) {
            $evidencePath = $request->file('evidence')->store('evidence', 'public');
        }

        // SECURITY LAYER: Hardens user ownership to token auth metrics
        Complaint::create([
            'user_id' => $userId,
            'name' => $request->name,
            'phone' => $request->phone,
            'address' => $request->address,
            'city' => $request->city,
            'state' => $request->state,
            'zip' => $request->zip,
            'accused_names' => $request->accused_names,
            'incident_date' => $request->incident_date,
            'incident_time' => $request->incident_time,
            'incident_location' => $request->incident_location,
            'police_unit_id' => $request->police_unit_id,
            'police_station_id' => $request->police_station_id,
            'complaint_type_id' => $request->complaint_type_id,
            'description' => $request->description,
            'evidence_path' => $evidencePath,
            'status' => 'Pending',
        ]);

        return response()->json(['message' => 'Complaint registered successfully!'], 201);
    }

    /**
     * 2. Forward recorded voice input to an external Python AI service for NLP transcription.
     */
    public function processVoice(Request $request)
    {
        $request->validate([
            'audio' => 'required|file|max:10240',
        ]);

        try {
            $audio = $request->file('audio');

            $response = Http::timeout(300)
                ->attach(
                    'audio',
                    fopen($audio->getRealPath(), 'r'),
                    'voice.webm'
                )
                ->post('http://172.17.0.1:8001/api/process-voice/');

            Log::info("DJANGO RAW: " . $response->body());

            if ($response->failed()) {
                return response()->json([
                    'error' => 'AI processing failed',
                    'details' => $response->body()
                ], 500);
            }

            $json = $response->json();

            if (!is_array($json) || (!isset($json['text']) && !isset($json['translated_text']))) {
                return response()->json([
                    'error' => 'Invalid AI response',
                    'raw' => $response->body()
                ], 500);
            }

            $transcribedText = $json['text'] ?? $json['translated_text'] ?? '';
            $extractedLocation = $json['extracted_data']['location'] ?? $json['location'] ?? 'Not Specified';

            return response()->json([
                'success' => true,
                'text' => $transcribedText,
                'description' => $transcribedText,
                'location' => ($extractedLocation !== "Unknown" && $extractedLocation !== "Not Specified") ? $extractedLocation : ""
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'error' => 'Connection failed',
                'message' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * 3. Fetch all complaints filed by the currently authenticated citizen.
     */
    public function myComplaints()
    {
        $userId = auth()->id();

        $complaints = Complaint::join('police_stations', 'complaints.police_station_id', '=', 'police_stations.id')
            ->join('complaint_types', 'complaints.complaint_type_id', '=', 'complaint_types.id')
            ->select(
                'complaints.*',
                'complaints.id as id', // Explicit alias protection
                'police_stations.station_name as station',
                'complaint_types.name as type'
            )
            ->where('complaints.user_id', $userId)
            ->orderBy('complaints.created_at', 'desc')
            ->get();

        return response()->json($complaints);
    }

    /**
     * 4. Retrieve single complaint details ensuring it belongs strictly to the authenticated user.
     */
    public function show($id)
    {
        $userId = auth()->id();

        $complaint = Complaint::join('police_stations', 'complaints.police_station_id', '=', 'police_stations.id')
            ->join('complaint_types', 'complaints.complaint_type_id', '=', 'complaint_types.id')
            ->select(
                'complaints.*',
                'complaints.id as id', // Explicit alias protection
                'police_stations.station_name as station',
                'complaint_types.name as type'
            )
            ->where('complaints.id', $id)
            ->where('complaints.user_id', $userId)
            ->first();

        if (!$complaint) {
            return response()->json(['message' => 'Complaint not found'], 404);
        }

        return response()->json($complaint);
    }

    /**
     * 5. Generate performance statistics grouped by custom string statuses for the citizen dashboard view.
     */
    public function getCitizenDashboardStats()
    {
        try {
            $userId = auth()->id();

            $totalFiled = Complaint::where('user_id', $userId)->count();

            $pending = Complaint::where('user_id', $userId)
                ->where(function($query) {
                    $query->where(DB::raw('LOWER(status)'), 'LIKE', '%pending%')
                          ->orWhere(DB::raw('LOWER(status)'), 'LIKE', '%new%')
                          ->orWhere(DB::raw('LOWER(status)'), 'LIKE', '%filed%');
                })
                ->count();

           $underProgress = Complaint::where('user_id', $userId)
                ->where(function($query) {
                    $query->where(DB::raw('LOWER(status)'), 'LIKE', '%assign%')
                          ->orWhere(DB::raw('LOWER(status)'), 'LIKE', '%progress%')
                          ->orWhere(DB::raw('LOWER(status)'), 'LIKE', '%investig%')
                          ->orWhere(DB::raw('LOWER(status)'), 'LIKE', '%under%');
                })
                ->count();

            $resolved = Complaint::where('user_id', $userId)
                ->where(function($query) {
                    $query->where(DB::raw('LOWER(status)'), 'LIKE', '%resolved%')
                          ->orWhere(DB::raw('LOWER(status)'), 'LIKE', '%closed%')
                          ->orWhere(DB::raw('LOWER(status)'), 'LIKE', '%solved%');
                })
                ->count();

            $recentComplaints = Complaint::leftJoin('police_stations', 'complaints.police_station_id', '=', 'police_stations.id')
                ->leftJoin('complaint_types', 'complaints.complaint_type_id', '=', 'complaint_types.id')
                ->select(
                    'complaints.*',
                    'complaints.id as id',          // 🎯 THE FIX: Locks complaint ID from getting overwritten by joined tables' auto-incrementing IDs
                    'complaints.status as status',  // Guarantees explicit alias protection trap for status string
                    DB::raw('COALESCE(police_stations.station_name, "Sabang PS") as station'),
                    DB::raw('COALESCE(complaint_types.name, "General Case") as type')
                )
                ->where('complaints.user_id', $userId)
                ->orderBy('complaints.id', 'desc')
                ->get();

            return response()->json([
                'success' => true,
                'stats' => [
                    'total_filed'    => $totalFiled,
                    'pending'        => $pending,
                    'under_progress' => $underProgress, 
                    'resolved'       => $resolved
                ],
                'recent_complaints' => $recentComplaints,
                'data' => $recentComplaints
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'ComplaintController Citizen Bridge Error: ' . $e->getMessage()
            ], 500);
        }
    }
}