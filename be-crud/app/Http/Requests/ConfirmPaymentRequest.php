<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class ConfirmPaymentRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array|string>
     */
    public function rules(): array
    {
        return [
            'payment_intent_id' => [
                'required',
                'string',
                'starts_with:pi_',
                'max:255',
            ],
        ];
    }

    /**
     * Get custom messages for validator errors.
     */
    public function messages(): array
    {
        return [
            'payment_intent_id.required' => 'The payment intent ID is required.',
            'payment_intent_id.string' => 'The payment intent ID must be a string.',
            'payment_intent_id.starts_with' => 'The payment intent ID must be a valid Stripe payment intent ID.',
            'payment_intent_id.max' => 'The payment intent ID may not be greater than 255 characters.',
        ];
    }
}
