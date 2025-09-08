<?php

use App\Http\Controllers\ItemController;
use Illuminate\Support\Facades\Route;

Route::apiResource('items', ItemController::class);

// Or if you want to define them manually:
// Route::get('/items', [ItemController::class, 'index']);
// Route::post('/items', [ItemController::class, 'store']);
// Route::get('/items/{id}', [ItemController::class, 'show']);
// Route::put('/items/{id}', [ItemController::class, 'update']);
// Route::delete('/items/{id}', [ItemController::class, 'destroy']);
