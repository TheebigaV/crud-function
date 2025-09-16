<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Stripe\Stripe;
use Stripe\PaymentIntent;
use App\Models\Payment;
use Illuminate\Support\Facades\Auth;

class PaymentController extends Controller
{
    public function __construct()
    {
        $this->middleware('auth:sanctum')->except(['handleWebhook']);
        Stripe::setApiKey(env('STRIPE_SECRET_KEY'));
    }

    public function createIntent(Request $request)
    {
        try {
            $request->validate([
                'amount' => 'required|integer|min:50',
                'currency' => 'string|max:3',
                'description' => 'string|max:255',
            ]);

            $paymentIntent = PaymentIntent::create([
                'amount' => $request->amount,
                'currency' => $request->currency ?? 'usd',
                'description' => $request->description,
            ]);

            return response()->json([
                'success' => true,
                'data' => [
                    'id' => $paymentIntent->id,
                    'client_secret' => $paymentIntent->client_secret,
                    'amount' => $paymentIntent->amount,
                    'currency' => $paymentIntent->currency,
                    'status' => $paymentIntent->status,
                ]
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to create payment intent',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function confirmPayment(Request $request)
    {
        try {
            $request->validate([
                'payment_intent_id' => 'required|string'
            ]);

            $paymentIntent = PaymentIntent::retrieve($request->payment_intent_id);

            if ($paymentIntent->status !== 'succeeded') {
                return response()->json([
                    'success' => false,
                    'message' => 'Payment not successful'
                ], 400);
            }

            $payment = Payment::create([
                'user_id' => Auth::id(),
                'stripe_payment_intent_id' => $paymentIntent->id,
                'amount' => $paymentIntent->amount,
                'currency' => $paymentIntent->currency,
                'status' => 'succeeded',
                'description' => $paymentIntent->description,
            ]);

            return response()->json([
                'success' => true,
                'data' => $payment
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to confirm payment',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function getHistory(Request $request)
    {
        try {
            $perPage = $request->get('per_page', 15);
            $payments = Payment::where('user_id', Auth::id())
                ->orderBy('created_at', 'desc')
                ->paginate($perPage);

            return response()->json([
                'success' => true,
                'data' => $payments->items(),
                'current_page' => $payments->currentPage(),
                'last_page' => $payments->lastPage(),
                'per_page' => $payments->perPage(),
                'total' => $payments->total(),
                'from' => $payments->firstItem(),
                'to' => $payments->lastItem(),
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch payment history',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function getPayment(Payment $payment)
    {
        try {
            if ($payment->user_id !== Auth::id()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Payment not found'
                ], 404);
            }

            return response()->json([
                'success' => true,
                'data' => $payment
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Payment not found'
            ], 404);
        }
    }

    public function getStats()
    {
        try {
            $userId = Auth::id();

            $stats = [
                'total_payments' => Payment::where('user_id', $userId)->count(),
                'total_amount' => Payment::where('user_id', $userId)->where('status', 'succeeded')->sum('amount'),
                'successful_payments' => Payment::where('user_id', $userId)->where('status', 'succeeded')->count(),
            ];

            return response()->json([
                'success' => true,
                'data' => $stats
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch stats'
            ], 500);
        }
    }

    public function handleWebhook(Request $request)
    {
        return response()->json(['success' => true]);
    }
}
