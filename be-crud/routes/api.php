<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\ItemController;
use App\Http\Controllers\SocialAuthController;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
|
| Here is where you can register API routes for your application. These
| routes are loaded by the RouteServiceProvider and all of them will
| be assigned to the "api" middleware group. Make something great!
|
*/

// Public routes
Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);
Route::post('/forgot-password', [AuthController::class, 'forgotPassword']);
Route::post('/reset-password', [AuthController::class, 'resetPassword']);

// Social authentication public routes
Route::get('/auth/{provider}', [SocialAuthController::class, 'redirectToProvider']);
Route::post('/auth/{provider}/callback', [SocialAuthController::class, 'handleProviderCallback']);

// Protected routes
Route::middleware('auth:sanctum')->group(function () {
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/me', [AuthController::class, 'me']);

    // Social authentication protected routes
    Route::post('/auth/{provider}/link', [SocialAuthController::class, 'linkAccount']);
    Route::delete('/auth/social/unlink', [SocialAuthController::class, 'unlinkAccount']);

    // Items routes (now protected by authentication)
    Route::apiResource('items', ItemController::class);
});
