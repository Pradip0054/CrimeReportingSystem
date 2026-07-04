<?php

namespace App\Exceptions;

use Illuminate\Foundation\Exceptions\Handler as ExceptionHandler;
use Illuminate\Auth\AuthenticationException; // 👈 এপিআই সানক্টাম ক্র্যাশ প্রোটেকশন
use Throwable;

class Handler extends ExceptionHandler
{
    /**
     * A list of the exception types that are not reported.
     *
     * @var array<int, class-string<Throwable>>
     */
    protected $dontReport = [
        //
    ];

    /**
     * A list of the inputs that are never flashed for validation exceptions.
     *
     * @var array<int, string>
     */
    protected $dontFlash = [
        'current_password',
        'password',
        'password_confirmation',
    ];

    /**
     * Register the exception handling callbacks for the application.
     */
    public function register(): void
    {
        $this->reportable(function (Throwable $e) {
            //
        });

        /* |--------------------------------------------------------------------------
        | 🎯 সানক্টাম রিডাইরেক্ট বাগ ফিক্স (Enforce Pure API JSON Response)
        |--------------------------------------------------------------------------
        | টোকেন না মিললে বা এক্সপায়ার হলে ল্যারাভেল যেন Route[login] খুঁজতে গিয়ে ক্র্যাশ 
        | না করে সরাসরি ফ্রন্টএন্ডকে জেসন ফরম্যাটে ৪০১ এরর মেসেজ পাঠায়।
        */
        $this->renderable(function (AuthenticationException $e, $request) {
            if ($request->is('api/*') || $request->expectsJson()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Unauthenticated or Invalid Token Context.'
                ], 401);
            }
        });
    }
}