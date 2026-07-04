<?php
namespace App\Http\Controllers\Auth;
use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Otp;
use App\Models\User;
use App\Mail\OtpMail;
use Illuminate\Support\Facades\Mail;
use Carbon\Carbon;

class OtpController extends Controller
{
public function sendOtp(Request $request)
{
    $request->validate(['email' => 'required|email']);

    $otp = rand(100000, 999999);

    // This part tests the Database
    \App\Models\Otp::updateOrCreate(
        ['email' => $request->email],
        ['otp' => $otp, 'expires_at' => \Carbon\Carbon::now()->addMinutes(5)]
    );

    // --- COMMENT THIS OUT FOR TESTING ---
    \Illuminate\Support\Facades\Mail::to($request->email)->queue(new \App\Mail\OtpMail($otp));

    return response()->json([
        'success' => true,
        'otp' => $otp, // Temporarily send the OTP in the response so you can see it
        'message' => 'OTP generated successfully (Email Bypassed).'
    ]);
}

    // Verify OTP and authenticate user
    public function verifyOtp(Request $request)
    {
        // Validate request
        $request->validate([
            'email'  => 'required|email',
            'name'   => 'nullable|string',
            'mobile' => 'nullable|string',
            'otp'    => 'required'
        ]);

        // Find matching OTP record
        $record = Otp::where('email', $request->email)
                     ->where('otp', $request->otp)
                     ->first();

        // Check OTP validity and expiration
        if (!$record || Carbon::now()->gt($record->expires_at)) {
            return response()->json([
                'success' => false,
                'message' => 'Invalid or expired OTP.'
            ], 401);
        }

        // Get existing user (if any)
        $existingUser = User::where('email', $request->email)->first();

        // Create or update user
        $user = User::updateOrCreate(
            ['email' => $request->email],
            [
                'name'   => $request->name ?? ($existingUser->name ?? 'User'),
                'mobile' => $request->mobile ?? ($existingUser->mobile ?? null),
                'role'   => $existingUser ? $existingUser->role : 'citizen',
            ]
        );
        $user->tokens()->delete();

        // Generate API token
        $token = $user->createToken('auth_token')->plainTextToken;

        // Remove OTP after successful verification
        $record->delete();

        return response()->json([
            'success' => true,
            'token'   => $token,
            'user'    => $user
        ]);
    }
}