<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\ItemController;
use App\Http\Controllers\PaymentController;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
*/

// Public routes
Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);
Route::post('/forgot-password', [AuthController::class, 'forgotPassword']);
Route::post('/reset-password', [AuthController::class, 'resetPassword']);

// Social authentication routes (public)
Route::get('/auth/{provider}/url', [AuthController::class, 'getSocialAuthUrl']);
Route::post('/auth/{provider}/callback', [AuthController::class, 'handleSocialCallback']);

// Stripe webhook (no auth required)
Route::post('/payments/webhook', [PaymentController::class, 'handleWebhook']);

// Protected routes
Route::middleware('auth:sanctum')->group(function () {
    // Auth routes
    Route::get('/user', function (Request $request) {
        return response()->json([
            'user' => $request->user()
        ]);
    });
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::post('/refresh', [AuthController::class, 'refresh']);
    Route::get('/me', [AuthController::class, 'me']);

    // Social account management routes (protected)
    Route::prefix('auth')->group(function () {
        Route::get('/{provider}/link', [AuthController::class, 'linkSocialAccount']);
        Route::post('/unlink', [AuthController::class, 'unlinkSocialAccount']);
    });

    // CRUD routes for items
    Route::apiResource('items', ItemController::class);

    // Payment routes
    Route::prefix('payments')->group(function () {
        Route::post('/create-intent', [PaymentController::class, 'createIntent']);
        Route::post('/confirm', [PaymentController::class, 'confirmPayment']);
        Route::get('/history', [PaymentController::class, 'getHistory']);
        Route::get('/stats', [PaymentController::class, 'getStats']);
        Route::get('/{payment}', [PaymentController::class, 'getPayment']);
    });
});
