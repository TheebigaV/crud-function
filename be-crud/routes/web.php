<?php

use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Web Routes
|--------------------------------------------------------------------------
|
| Here is where you can register web routes for your application. These
| routes are loaded by the RouteServiceProvider and all of them will
| be assigned to the "web" middleware group. Make something great!
|
*/

Route::get('/', function () {
    return response()->json([
        'message' => 'Laravel API is running',
        'timestamp' => now(),
    ]);
});

// Named login route (required by Laravel auth system)
Route::get('/login', function () {
    return response()->json([
        'message' => 'Please authenticate via the API endpoints',
        'login_url' => '/api/login'
    ], 401);
})->name('login');

// Fallback for SPA
Route::get('/{any}', function () {
    return response()->json([
        'message' => 'API endpoint not found. Check /api/ routes.'
    ], 404);
})->where('any', '.*');
