<?php

namespace App\Services;

use App\Models\Payment;
use App\Models\User;
use Illuminate\Support\Facades\Log;
use Stripe\Stripe;
use Stripe\PaymentIntent;
use Stripe\Exception\ApiErrorException;

class PaymentService
{
    public function __construct()
    {
        Stripe::setApiKey(config('services.stripe.secret'));
    }

    /**
     * Create a payment intent
     */
    public function createPaymentIntent(User $user, array $data): array
    {
        try {
            $paymentIntent = PaymentIntent::create([
                'amount' => $data['amount'],
                'currency' => $data['currency'] ?? 'usd',
                'description' => $data['description'] ?? null,
                'metadata' => array_merge($data['metadata'] ?? [], [
                    'user_id' => $user->id,
                    'user_email' => $user->email,
                ]),
                'automatic_payment_methods' => [
                    'enabled' => true,
                ],
            ]);

            // Store payment intent in database
            $payment = Payment::create([
                'user_id' => $user->id,
                'stripe_payment_intent_id' => $paymentIntent->id,
                'amount' => $data['amount'],
                'currency' => $data['currency'] ?? 'usd',
                'status' => 'pending',
                'description' => $data['description'] ?? null,
                'metadata' => $data['metadata'] ?? null,
            ]);

            Log::info('Payment intent created', [
                'user_id' => $user->id,
                'payment_intent_id' => $paymentIntent->id,
                'amount' => $data['amount'],
            ]);

            return [
                'payment_intent' => $paymentIntent,
                'client_secret' => $paymentIntent->client_secret,
                'payment' => $payment,
            ];

        } catch (ApiErrorException $e) {
            Log::error('Stripe API error during payment intent creation', [
                'user_id' => $user->id,
                'error' => $e->getMessage(),
                'data' => $data,
            ]);

            throw new \Exception('Payment processing error: ' . $e->getMessage());
        }
    }

    /**
     * Confirm a payment
     */
    public function confirmPayment(string $paymentIntentId): Payment
    {
        try {
            // Get payment intent from Stripe
            $paymentIntent = PaymentIntent::retrieve($paymentIntentId);

            // Find payment in database
            $payment = Payment::where('stripe_payment_intent_id', $paymentIntentId)->first();

            if (!$payment) {
                throw new \Exception('Payment not found in database');
            }

            // Update payment status based on Stripe status
            $payment->update([
                'status' => $paymentIntent->status,
                'payment_date' => $paymentIntent->status === 'succeeded' ? now() : null,
            ]);

            Log::info('Payment confirmed', [
                'payment_id' => $payment->id,
                'stripe_payment_intent_id' => $paymentIntentId,
                'status' => $paymentIntent->status,
            ]);

            return $payment;

        } catch (ApiErrorException $e) {
            Log::error('Stripe API error during payment confirmation', [
                'payment_intent_id' => $paymentIntentId,
                'error' => $e->getMessage(),
            ]);

            throw new \Exception('Payment confirmation error: ' . $e->getMessage());
        }
    }

    /**
     * Get payment history for a user
     */
    public function getPaymentHistory(User $user, int $perPage = 15)
    {
        return $user->payments()
            ->orderBy('created_at', 'desc')
            ->paginate($perPage);
    }

    /**
     * Get a specific payment for a user
     */
    public function getPayment(User $user, int $paymentId): ?Payment
    {
        return $user->payments()->find($paymentId);
    }

    /**
     * Handle Stripe webhooks
     */
    public function handleWebhook(\Stripe\Event $event): void
    {
        Log::info('Processing webhook', ['type' => $event->type]);

        switch ($event->type) {
            case 'payment_intent.succeeded':
                $this->handlePaymentIntentSucceeded($event->data->object);
                break;

            case 'payment_intent.payment_failed':
                $this->handlePaymentIntentFailed($event->data->object);
                break;

            case 'payment_intent.canceled':
                $this->handlePaymentIntentCanceled($event->data->object);
                break;

            default:
                Log::info('Unhandled webhook event type', ['type' => $event->type]);
        }
    }

    /**
     * Handle successful payment intent
     */
    private function handlePaymentIntentSucceeded(\Stripe\PaymentIntent $paymentIntent): void
    {
        $payment = Payment::where('stripe_payment_intent_id', $paymentIntent->id)->first();

        if ($payment) {
            $payment->update([
                'status' => 'succeeded',
                'payment_date' => now(),
            ]);

            Log::info('Payment marked as succeeded via webhook', [
                'payment_id' => $payment->id,
                'stripe_payment_intent_id' => $paymentIntent->id,
            ]);
        }
    }

    /**
     * Handle failed payment intent
     */
    private function handlePaymentIntentFailed(\Stripe\PaymentIntent $paymentIntent): void
    {
        $payment = Payment::where('stripe_payment_intent_id', $paymentIntent->id)->first();

        if ($payment) {
            $payment->update([
                'status' => 'failed',
            ]);

            Log::info('Payment marked as failed via webhook', [
                'payment_id' => $payment->id,
                'stripe_payment_intent_id' => $paymentIntent->id,
            ]);
        }
    }

    /**
     * Handle canceled payment intent
     */
    private function handlePaymentIntentCanceled(\Stripe\PaymentIntent $paymentIntent): void
    {
        $payment = Payment::where('stripe_payment_intent_id', $paymentIntent->id)->first();

        if ($payment) {
            $payment->update([
                'status' => 'canceled',
            ]);

            Log::info('Payment marked as canceled via webhook', [
                'payment_id' => $payment->id,
                'stripe_payment_intent_id' => $paymentIntent->id,
            ]);
        }
    }
}
