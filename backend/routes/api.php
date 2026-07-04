<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AdminController;
use App\Http\Controllers\Auth\OtpController;
use App\Http\Controllers\ComplaintController;
use App\Http\Controllers\DropdownController;
use App\Http\Controllers\OfficerComplaintController; 

/*
|--------------------------------------------------------------------------
| Public Routes
|--------------------------------------------------------------------------
*/
/**
 * 1. Define unsecured endpoints for OTP-based authentication and metadata drop-downs.
 */
Route::post('/send-otp', [OtpController::class, 'sendOtp']);
Route::post('/verify-otp', [OtpController::class, 'verifyOtp']);

Route::get('/police-unit-types', [DropdownController::class, 'unitTypes']);
Route::get('/police-units/{type}', [DropdownController::class, 'unitsByType']);
Route::get('/police-stations/{unitId}', [DropdownController::class, 'policeStations']);
Route::get('/complaint-types', [DropdownController::class, 'complaintTypes']);

/*
|--------------------------------------------------------------------------
| Protected Routes
|--------------------------------------------------------------------------
*/
Route::middleware(['auth:sanctum'])->group(function () {

    Route::get('/user', function (Request $request) {
        return $request->user();
    });

    /**
     * 2. Core application routes accessible by authenticated citizens and general officers.
     */
    Route::get('/citizen/dashboard', [ComplaintController::class, 'getCitizenDashboardStats']);
    Route::post('/complaint', [ComplaintController::class, 'store']);
    Route::get('/my-complaints', [ComplaintController::class, 'myComplaints']);
    Route::get('/complaint/{id}', [ComplaintController::class, 'show']);
    Route::post('/complaint/voice', [ComplaintController::class, 'processVoice']); 

    Route::get('/officer/complaints', [OfficerComplaintController::class, 'index']); 
    Route::post('/officer/complaints/{id}/update', [OfficerComplaintController::class, 'updateStatus']); 

    /**
     * 3. Administration sub-group restricted to authorized system administrators.
     */
    Route::middleware('role:admin')->group(function () {
        Route::get('/admin/dashboard', [AdminController::class, 'index']);
        Route::get('/admin/police-list', [AdminController::class, 'policeList']); 
        Route::post('/admin/create-police', [AdminController::class, 'storePolice']);  
        Route::get('/all-police-stations', [AdminController::class, 'getAllPoliceStations']);
        Route::get('/admin/all-complaints', [AdminController::class, 'allComplaints']); 
        Route::get('/admin/complaints/{id}/eligible-officers', [AdminController::class, 'getOfficersByComplaint']);
        Route::post('/admin/assign/{id}', [AdminController::class, 'assignOfficer']); 
    });

    /**
     * 4. Role-based fallback wrappers providing legacy entry gateways for police and citizens.
     */
    Route::middleware('role:police')->group(function () {
        Route::get('/police-dashboard', function () {
            return response()->json(['message' => 'Police Dashboard Base Route OK']);
        });
        Route::get('/assigned-cases', [ComplaintController::class, 'assignedCases']);
    });

    Route::middleware('role:citizen')->group(function () {
        Route::get('/citizen-dashboard', function () {
            return response()->json(['message' => 'Citizen Dashboard']);
        });
    });
});