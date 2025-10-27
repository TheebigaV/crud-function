<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\ItemController;
use App\Http\Controllers\PaymentController; // Changed from App\Http\Controllers\Api\PaymentController

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
*/

// Debug route to test API connection
Route::get('/debug', function (Request $request) {
    return response()->json([
        'message' => 'API is working',
        'timestamp' => now(),
        'method' => $request->method(),
        'headers' => $request->headers->all(),
        'cors_working' => true,
    ]);
});

// Test route for CORS
Route::options('/{any}', function () {
    return response()->json(['message' => 'OPTIONS request handled']);
})->where('any', '.*');

// Public routes
Route::post('/register', [AuthController::class, 'register'])->name('api.register');
Route::post('/login', [AuthController::class, 'login'])->name('api.login');
Route::post('/forgot-password', [AuthController::class, 'forgotPassword'])->name('api.forgot-password');
Route::post('/reset-password', [AuthController::class, 'resetPassword'])->name('api.reset-password');

// Social authentication routes (public)
Route::get('/auth/{provider}/url', [AuthController::class, 'getSocialAuthUrl'])
     ->where('provider', 'google|facebook|github')
     ->name('api.social.url');

// FIXED: This should handle both GET and POST for OAuth callback
Route::match(['get', 'post'], '/auth/{provider}/callback', [AuthController::class, 'handleSocialCallback'])
     ->where('provider', 'google|facebook|github')
     ->name('api.social.callback');

// Stripe webhook (no auth required) - FIXED path to match frontend
Route::post('/payments/webhook', [PaymentController::class, 'handleWebhook'])->name('api.payments.webhook');

// Protected routes
Route::middleware('auth:sanctum')->group(function () {
    // Debug route for authenticated users
    Route::get('/debug/auth', function (Request $request) {
        return response()->json([
            'message' => 'Authentication working',
            'user' => $request->user(),
            'token_name' => $request->user()->currentAccessToken()->name ?? 'unknown',
            'token_id' => $request->user()->currentAccessToken()->id ?? 'unknown',
        ]);
    });

    // Auth routes
    Route::get('/user', function (Request $request) {
        return response()->json([
            'user' => $request->user()
        ]);
    })->name('api.user');

    Route::post('/logout', [AuthController::class, 'logout'])->name('api.logout');
    Route::post('/refresh', [AuthController::class, 'refresh'])->name('api.refresh');
    Route::get('/me', [AuthController::class, 'me'])->name('api.me');

    // CRUD routes for items
    Route::apiResource('items', ItemController::class, ['as' => 'api']);

    // Payment routes
    Route::prefix('payments')->name('api.payments.')->group(function () {
        Route::post('/create-intent', [PaymentController::class, 'createPaymentIntent'])->name('create-intent');
        Route::post('/confirm', [PaymentController::class, 'confirmPayment'])->name('confirm');
        Route::get('/history', [PaymentController::class, 'getPaymentHistory'])->name('history');
        Route::get('/test-stripe', [PaymentController::class, 'testStripeConnection'])->name('test-stripe');
        Route::get('/{id}', [PaymentController::class, 'getPaymentDetails'])->name('details');
    });
});
