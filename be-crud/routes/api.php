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
Route::post('/register', [AuthController::class, 'register'])->name('api.register');
Route::post('/login', [AuthController::class, 'login'])->name('api.login');
Route::post('/forgot-password', [AuthController::class, 'forgotPassword'])->name('api.forgot-password');
Route::post('/reset-password', [AuthController::class, 'resetPassword'])->name('api.reset-password');

// Social authentication routes (public)
Route::get('/auth/{provider}/url', [AuthController::class, 'getSocialAuthUrl'])
     ->where('provider', 'google|facebook|github')
     ->name('api.social.url');
Route::post('/auth/{provider}/callback', [AuthController::class, 'handleSocialCallback'])
     ->where('provider', 'google|facebook|github')
     ->name('api.social.callback');

// Stripe webhook (no auth required)
Route::post('/payments/webhook', [PaymentController::class, 'handleWebhook'])->name('api.payments.webhook');

// Protected routes
Route::middleware('auth:sanctum')->group(function () {
    // Auth routes
    Route::get('/user', function (Request $request) {
        return response()->json([
            'user' => $request->user()
        ]);
    })->name('api.user');

    Route::post('/logout', [AuthController::class, 'logout'])->name('api.logout');
    Route::post('/refresh', [AuthController::class, 'refresh'])->name('api.refresh');
    Route::get('/me', [AuthController::class, 'me'])->name('api.me');

    // Social account management routes (protected)
    Route::prefix('auth')->group(function () {
        Route::get('/{provider}/link', [AuthController::class, 'linkSocialAccount'])
             ->where('provider', 'google|facebook|github')
             ->name('api.social.link');
        Route::post('/unlink', [AuthController::class, 'unlinkSocialAccount'])
             ->name('api.social.unlink');
    });

    // CRUD routes for items
    Route::apiResource('items', ItemController::class, ['as' => 'api']);

    // Payment routes
    Route::prefix('payments')->name('api.payments.')->group(function () {
        Route::post('/create-intent', [PaymentController::class, 'createIntent'])->name('create-intent');
        Route::post('/confirm', [PaymentController::class, 'confirmPayment'])->name('confirm');
        Route::get('/history', [PaymentController::class, 'getHistory'])->name('history');
        Route::get('/stats', [PaymentController::class, 'getStats'])->name('stats');
        Route::get('/{payment}', [PaymentController::class, 'getPayment'])->name('show');
    });
});
