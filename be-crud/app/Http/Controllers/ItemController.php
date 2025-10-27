<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Validator;
use App\Models\Item;

class ItemController extends Controller
{
    public function __construct()
    {
        $this->middleware('auth:sanctum');
    }

    /**
     * Display a listing of the resource.
     */
    public function index(Request $request): JsonResponse
    {
        try {
            $perPage = $request->get('per_page', 15);
            $perPage = min($perPage, 100); // Limit max per page

            $user = $request->user();

            Log::info('Fetching items for user', [
                'user_id' => $user->id,
                'per_page' => $perPage
            ]);

            $items = $user->items()->orderBy('created_at', 'desc')->paginate($perPage);

            return response()->json($items);

        } catch (\Exception $e) {
            Log::error('Failed to fetch items', [
                'user_id' => $request->user()->id ?? null,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            return response()->json([
                'message' => 'Failed to fetch items',
                'error' => config('app.debug') ? $e->getMessage() : 'Internal server error'
            ], 500);
        }
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request): JsonResponse
    {
        try {
            Log::info('Creating item', [
                'user_id' => $request->user()->id ?? null,
                'request_data' => $request->all()
            ]);

            // Validate input - ADDED price validation
            $validator = Validator::make($request->all(), [
                'name' => 'required|string|max:255',
                'description' => 'required|string|max:1000',
                'price' => 'required|numeric|min:0.01|max:999999.99',  // ADDED: Price validation
            ]);

            if ($validator->fails()) {
                Log::warning('Item creation validation failed', [
                    'errors' => $validator->errors(),
                    'request_data' => $request->all()
                ]);

                return response()->json([
                    'message' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 422);
            }

            $user = $request->user();

            // Create the item - ADDED price field
            $item = $user->items()->create([
                'name' => $request->name,
                'description' => $request->description,
                'price' => $request->price,  // ADDED: Include price in creation
            ]);

            Log::info('Item created successfully', [
                'user_id' => $user->id,
                'item_id' => $item->id,
                'item_name' => $item->name,
                'item_price' => $item->price  // ADDED: Log price
            ]);

            return response()->json([
                'message' => 'Item created successfully',
                'data' => $item
            ], 201);

        } catch (\Exception $e) {
            Log::error('Failed to create item', [
                'user_id' => $request->user()->id ?? null,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
                'request_data' => $request->all()
            ]);

            return response()->json([
                'message' => 'Failed to create item',
                'error' => config('app.debug') ? $e->getMessage() : 'Internal server error'
            ], 500);
        }
    }

    /**
     * Display the specified resource.
     */
    public function show(Request $request, Item $item): JsonResponse
    {
        try {
            $user = $request->user();

            // Check if user owns this item
            if ($item->user_id !== $user->id) {
                return response()->json([
                    'message' => 'Item not found'
                ], 404);
            }

            return response()->json([
                'message' => 'Item retrieved successfully',
                'data' => $item
            ]);

        } catch (\Exception $e) {
            Log::error('Failed to fetch item', [
                'user_id' => $request->user()->id ?? null,
                'item_id' => $item->id ?? null,
                'error' => $e->getMessage()
            ]);

            return response()->json([
                'message' => 'Failed to fetch item',
                'error' => config('app.debug') ? $e->getMessage() : 'Internal server error'
            ], 500);
        }
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, Item $item): JsonResponse
    {
        try {
            $user = $request->user();

            // Check if user owns this item
            if ($item->user_id !== $user->id) {
                return response()->json([
                    'message' => 'Item not found'
                ], 404);
            }

            Log::info('Updating item', [
                'user_id' => $user->id,
                'item_id' => $item->id,
                'request_data' => $request->all(),
                'current_item_data' => $item->toArray()
            ]);

            // Validate input - ADDED price validation
            $validator = Validator::make($request->all(), [
                'name' => 'required|string|max:255',
                'description' => 'required|string|max:1000',
                'price' => 'required|numeric|min:0.01|max:999999.99',  // ADDED: Price validation
            ]);

            if ($validator->fails()) {
                Log::warning('Item update validation failed', [
                    'errors' => $validator->errors(),
                    'request_data' => $request->all(),
                    'item_id' => $item->id
                ]);

                return response()->json([
                    'message' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 422);
            }

            // Update the item - ADDED price field
            $item->update([
                'name' => $request->name,
                'description' => $request->description,
                'price' => $request->price,  // ADDED: Include price in update
            ]);

            // Refresh the item from database to get updated data
            $item->refresh();

            Log::info('Item updated successfully', [
                'user_id' => $user->id,
                'item_id' => $item->id,
                'item_name' => $item->name,
                'item_price' => $item->price,  // ADDED: Log updated price
                'updated_item_data' => $item->toArray()
            ]);

            return response()->json([
                'message' => 'Item updated successfully',
                'data' => $item
            ]);

        } catch (\Exception $e) {
            Log::error('Failed to update item', [
                'user_id' => $request->user()->id ?? null,
                'item_id' => $item->id ?? null,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
                'request_data' => $request->all()
            ]);

            return response()->json([
                'message' => 'Failed to update item',
                'error' => config('app.debug') ? $e->getMessage() : 'Internal server error'
            ], 500);
        }
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Request $request, Item $item): JsonResponse
    {
        try {
            $user = $request->user();

            // Check if user owns this item
            if ($item->user_id !== $user->id) {
                return response()->json([
                    'message' => 'Item not found'
                ], 404);
            }

            $itemName = $item->name;
            $item->delete();

            Log::info('Item deleted successfully', [
                'user_id' => $user->id,
                'item_id' => $item->id,
                'item_name' => $itemName
            ]);

            return response()->json([
                'message' => 'Item deleted successfully'
            ]);

        } catch (\Exception $e) {
            Log::error('Failed to delete item', [
                'user_id' => $request->user()->id ?? null,
                'item_id' => $item->id ?? null,
                'error' => $e->getMessage()
            ]);

            return response()->json([
                'message' => 'Failed to delete item',
                'error' => config('app.debug') ? $e->getMessage() : 'Internal server error'
            ], 500);
        }
    }
}
