<?php
namespace App\Http\Controllers;

use App\Models\Item;
use Illuminate\Http\Request;
use App\Http\Requests\StoreItemRequest;
use App\Http\Requests\UpdateItemRequest;

class ItemController extends Controller
{
    /**
     * Display a listing of items with pagination
     */
    public function index(Request $request)
    {
        $query = Item::query();

        // Show only authenticated user's items
        $query->where('user_id', $request->user()->id);

        // Get pagination parameters from request
        $perPage = $request->get('per_page', 15); // Default 15 items per page
        $perPage = min($perPage, 100); // Maximum 100 items per page

        // Apply pagination with latest items first
        $items = $query->latest()->paginate($perPage);

        return response()->json([
            'data' => $items->items(),
            'current_page' => $items->currentPage(),
            'per_page' => $items->perPage(),
            'total' => $items->total(),
            'last_page' => $items->lastPage(),
            'from' => $items->firstItem(),
            'to' => $items->lastItem(),
            'has_more_pages' => $items->hasMorePages(),
            'links' => [
                'first' => $items->url(1),
                'last' => $items->url($items->lastPage()),
                'prev' => $items->previousPageUrl(),
                'next' => $items->nextPageUrl(),
            ]
        ]);
    }

    /**
     * Store a newly created item
     */
    public function store(StoreItemRequest $request)
    {
        $item = Item::create([
            'name' => $request->name,
            'description' => $request->description,
            'user_id' => $request->user()->id,
        ]);

        return response()->json($item, 201);
    }

    /**
     * Display the specified item
     */
    public function show(Request $request, Item $item)
    {
        // Check if user owns the item
        if ($item->user_id !== $request->user()->id) {
            return response()->json([
                'message' => 'Unauthorized'
            ], 403);
        }

        return response()->json($item);
    }

    /**
     * Update the specified item
     */
    public function update(UpdateItemRequest $request, Item $item)
    {
        // Authorization is handled in UpdateItemRequest
        // Validation is handled in UpdateItemRequest

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
        // Check if user owns the item
        if ($item->user_id !== $request->user()->id) {
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
