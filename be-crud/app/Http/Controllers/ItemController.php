<?php

namespace App\Http\Controllers;

use App\Models\Item;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class ItemController extends Controller
{
    /**
     * Display a listing of items
     */
    public function index(Request $request)
    {
        $query = Item::query();

        // If user is authenticated, show only their items
        if ($request->user()) {
            $query->where('user_id', $request->user()->id);
        }

        $items = $query->latest()->get();

        return response()->json($items);
    }

    /**
     * Store a newly created item
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'description' => 'required|string|max:1000',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        $item = Item::create([
            'name' => $request->name,
            'description' => $request->description,
            'user_id' => $request->user() ? $request->user()->id : null,
        ]);

        return response()->json($item, 201);
    }

    /**
     * Display the specified item
     */
    public function show(Request $request, Item $item)
    {
        // Check if user owns the item (if authenticated)
        if ($request->user() && $item->user_id !== $request->user()->id) {
            return response()->json([
                'message' => 'Unauthorized'
            ], 403);
        }

        return response()->json($item);
    }

    /**
     * Update the specified item
     */
    public function update(Request $request, Item $item)
    {
        // Check if user owns the item (if authenticated)
        if ($request->user() && $item->user_id !== $request->user()->id) {
            return response()->json([
                'message' => 'Unauthorized'
            ], 403);
        }

        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'description' => 'required|string|max:1000',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        $item->update([
            'name' => $request->name,
            'description' => $request->description,
        ]);

        return response()->json($item);
    }

    /**
     * Remove the specified item
     */
    public function destroy(Request $request, Item $item)
    {
        // Check if user owns the item (if authenticated)
        if ($request->user() && $item->user_id !== $request->user()->id) {
            return response()->json([
                'message' => 'Unauthorized'
            ], 403);
        }

        $item->delete();

        return response()->json([
            'message' => 'Item deleted successfully'
        ]);
    }
}
