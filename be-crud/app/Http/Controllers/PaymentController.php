<?php

namespace App\Http\Controllers; // Changed from App\Http\Controllers\Api

use App\Http\Controllers\Controller;
use App\Models\Payment;
use App\Models\User; // Add this import since you reference User::class
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Auth;
use Stripe\Stripe;
use Stripe\PaymentIntent;
use Exception;

class PaymentController extends Controller
{
    public function __construct()
    {
        // Try multiple possible environment variable names for Stripe secret key
        $stripeSecret = env('STRIPE_SECRET')
                     ?? env('STRIPE_SECRET_KEY')
                     ?? config('services.stripe.secret');

        if (!$stripeSecret) {
            Log::error('Stripe configuration missing. Checked: STRIPE_SECRET, STRIPE_SECRET_KEY, and config services.stripe.secret');
            throw new Exception('Stripe configuration missing. Add STRIPE_SECRET to your .env file.');
        }

        Stripe::setApiKey($stripeSecret);
        Log::info('Stripe initialized with key: ' . substr($stripeSecret, 0, 12) . '...');
    }

    public function createPaymentIntent(Request $request): JsonResponse
    {
        try {
            $request->validate([
                'amount' => 'required|integer|min:50', // Minimum 50 cents
                'currency' => 'required|string|size:3',
                'description' => 'nullable|string|max:255',
                'metadata' => 'nullable|array',
            ]);

            Log::info('Creating payment intent', [
                'amount' => $request->amount,
                'currency' => $request->currency,
                'description' => $request->description,
                'metadata' => $request->metadata,
                'user_id' => Auth::id()
            ]);

            $paymentIntentData = [
                'amount' => $request->amount,
                'currency' => strtolower($request->currency),
                'automatic_payment_methods' => ['enabled' => true],
            ];

            if ($request->description) {
                $paymentIntentData['description'] = $request->description;
            }

            if ($request->metadata) {
                $paymentIntentData['metadata'] = $request->metadata;
            }

            // Add user information to metadata if authenticated
            if (Auth::check()) {
                if (!isset($paymentIntentData['metadata'])) {
                    $paymentIntentData['metadata'] = [];
                }
                $paymentIntentData['metadata']['user_id'] = (string)Auth::id();
            }

            $paymentIntent = PaymentIntent::create($paymentIntentData);

            Log::info('Payment intent created successfully', [
                'payment_intent_id' => $paymentIntent->id,
                'client_secret' => substr($paymentIntent->client_secret, 0, 20) . '...',
                'user_id' => Auth::id()
            ]);

            return response()->json([
                'success' => true,
                'data' => [
                    'id' => $paymentIntent->id,
                    'client_secret' => $paymentIntent->client_secret,
                    'amount' => $paymentIntent->amount,
                    'currency' => $paymentIntent->currency,
                    'status' => $paymentIntent->status,
                ],
                'message' => 'Payment intent created successfully'
            ]);

        } catch (\Illuminate\Validation\ValidationException $e) {
            Log::error('Payment intent validation failed', [
                'errors' => $e->errors(),
                'user_id' => Auth::id()
            ]);

            return response()->json([
                'success' => false,
                'error' => 'Validation failed',
                'errors' => $e->errors()
            ], 422);

        } catch (Exception $e) {
            Log::error('Payment intent creation failed', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
                'user_id' => Auth::id()
            ]);

            return response()->json([
                'success' => false,
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function confirmPayment(Request $request): JsonResponse
    {
        try {
            $request->validate([
                'payment_intent_id' => 'required|string',
            ]);

            Log::info('Confirming payment', [
                'payment_intent_id' => $request->payment_intent_id,
                'user_id' => Auth::id()
            ]);

            // Retrieve the payment intent from Stripe
            $paymentIntent = PaymentIntent::retrieve($request->payment_intent_id);

            Log::info('Retrieved payment intent from Stripe', [
                'payment_intent_id' => $paymentIntent->id,
                'status' => $paymentIntent->status,
                'amount' => $paymentIntent->amount,
                'user_id' => Auth::id()
            ]);

            // Prepare payment data for database
            $paymentData = [
                'stripe_payment_intent_id' => $paymentIntent->id,
                'amount' => $paymentIntent->amount,
                'currency' => $paymentIntent->currency,
                'status' => $paymentIntent->status,
                'description' => $paymentIntent->description,
                'metadata' => $paymentIntent->metadata ? $paymentIntent->metadata->toArray() : null,
                'created_at' => now(),
                'updated_at' => now(),
            ];

            // Add user_id if authenticated
            if (Auth::check()) {
                $paymentData['user_id'] = Auth::id();
            }

            // Save payment to database
            $payment = Payment::create($paymentData);

            Log::info('Payment saved to database', [
                'payment_id' => $payment->id,
                'stripe_payment_intent_id' => $payment->stripe_payment_intent_id,
                'user_id' => Auth::id()
            ]);

            return response()->json([
                'success' => true,
                'data' => $payment,
                'message' => 'Payment confirmed successfully'
            ]);

        } catch (\Illuminate\Validation\ValidationException $e) {
            Log::error('Payment confirmation validation failed', [
                'errors' => $e->errors(),
                'user_id' => Auth::id()
            ]);

            return response()->json([
                'success' => false,
                'error' => 'Validation failed',
                'errors' => $e->errors()
            ], 422);

        } catch (Exception $e) {
            Log::error('Payment confirmation failed', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
                'user_id' => Auth::id()
            ]);

            return response()->json([
                'success' => false,
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function getPaymentHistory(Request $request): JsonResponse
    {
        try {
            $perPage = $request->get('per_page', 10);
            $itemId = $request->get('item_id');

            $query = Payment::orderBy('created_at', 'desc');

            // Filter by authenticated user
            if (Auth::check()) {
                $query->where('user_id', Auth::id());
            }

            // Filter by item_id if provided
            if ($itemId) {
                $query->whereJsonContains('metadata->item_id', (string)$itemId);
            }

            $payments = $query->paginate($perPage);

            Log::info('Payment history retrieved', [
                'total' => $payments->total(),
                'per_page' => $perPage,
                'current_page' => $payments->currentPage(),
                'item_id_filter' => $itemId,
                'user_id' => Auth::id()
            ]);

            return response()->json([
                'success' => true,
                'data' => $payments->items(),
                'current_page' => $payments->currentPage(),
                'last_page' => $payments->lastPage(),
                'per_page' => $payments->perPage(),
                'total' => $payments->total(),
                'from' => $payments->firstItem(),
                'to' => $payments->lastItem(),
                'message' => 'Payment history retrieved successfully'
            ]);

        } catch (Exception $e) {
            Log::error('Failed to retrieve payment history', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
                'user_id' => Auth::id()
            ]);

            return response()->json([
                'success' => false,
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function getPaymentDetails(Request $request, $id): JsonResponse
    {
        try {
            $query = Payment::where('id', $id);

            // Filter by authenticated user for security
            if (Auth::check()) {
                $query->where('user_id', Auth::id());
            }

            $payment = $query->first();

            if (!$payment) {
                return response()->json([
                    'success' => false,
                    'error' => 'Payment not found'
                ], 404);
            }

            Log::info('Payment details retrieved', [
                'payment_id' => $payment->id,
                'user_id' => Auth::id()
            ]);

            return response()->json([
                'success' => true,
                'data' => $payment,
                'message' => 'Payment details retrieved successfully'
            ]);

        } catch (Exception $e) {
            Log::error('Failed to retrieve payment details', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
                'user_id' => Auth::id()
            ]);

            return response()->json([
                'success' => false,
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function testStripeConnection(): JsonResponse
    {
        try {
            // Try to create a minimal payment intent to test connection
            $testIntent = PaymentIntent::create([
                'amount' => 100, // $1.00
                'currency' => 'usd',
                'description' => 'Test connection',
            ]);

            // Immediately cancel it since it's just a test
            $testIntent->cancel();

            Log::info('Stripe connection test successful', [
                'test_intent_id' => $testIntent->id,
                'user_id' => Auth::id()
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Stripe connection working properly',
                'test_intent_id' => $testIntent->id
            ]);

        } catch (Exception $e) {
            Log::error('Stripe connection test failed', [
                'error' => $e->getMessage(),
                'user_id' => Auth::id()
            ]);

            return response()->json([
                'success' => false,
                'error' => 'Stripe connection failed: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Handle Stripe webhook events
     */
    public function handleWebhook(Request $request): JsonResponse
    {
        try {
            $payload = $request->getContent();
            $sigHeader = $request->header('Stripe-Signature');
            $endpointSecret = env('STRIPE_WEBHOOK_SECRET');

            if ($endpointSecret) {
                try {
                    $event = \Stripe\Webhook::constructEvent(
                        $payload, $sigHeader, $endpointSecret
                    );
                } catch (\UnexpectedValueException $e) {
                    Log::error('Invalid payload in webhook', ['error' => $e->getMessage()]);
                    return response()->json(['error' => 'Invalid payload'], 400);
                } catch (\Stripe\Exception\SignatureVerificationException $e) {
                    Log::error('Invalid signature in webhook', ['error' => $e->getMessage()]);
                    return response()->json(['error' => 'Invalid signature'], 400);
                }
            } else {
                $event = json_decode($payload, true);
            }

            Log::info('Webhook received', [
                'type' => $event['type'],
                'id' => $event['id']
            ]);

            // Handle the event
            switch ($event['type']) {
                case 'payment_intent.succeeded':
                    $paymentIntent = $event['data']['object'];
                    $this->updatePaymentStatus($paymentIntent['id'], 'succeeded');
                    break;

                case 'payment_intent.payment_failed':
                    $paymentIntent = $event['data']['object'];
                    $this->updatePaymentStatus($paymentIntent['id'], 'failed');
                    break;

                case 'payment_intent.canceled':
                    $paymentIntent = $event['data']['object'];
                    $this->updatePaymentStatus($paymentIntent['id'], 'canceled');
                    break;

                default:
                    Log::info('Unhandled webhook event type', ['type' => $event['type']]);
            }

            return response()->json(['status' => 'success']);

        } catch (Exception $e) {
            Log::error('Webhook handling failed', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            return response()->json([
                'success' => false,
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Update payment status in database
     */
    private function updatePaymentStatus(string $stripePaymentIntentId, string $status): void
    {
        try {
            $payment = Payment::where('stripe_payment_intent_id', $stripePaymentIntentId)->first();

            if ($payment) {
                $payment->update(['status' => $status]);
                Log::info('Payment status updated', [
                    'payment_id' => $payment->id,
                    'stripe_payment_intent_id' => $stripePaymentIntentId,
                    'status' => $status
                ]);
            } else {
                Log::warning('Payment not found for status update', [
                    'stripe_payment_intent_id' => $stripePaymentIntentId,
                    'status' => $status
                ]);
            }
        } catch (Exception $e) {
            Log::error('Failed to update payment status', [
                'stripe_payment_intent_id' => $stripePaymentIntentId,
                'status' => $status,
                'error' => $e->getMessage()
            ]);
        }
    }
}
