<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class CreatePaymentIntentRequest extends FormRequest
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
            'amount' => [
                'required',
                'integer',
                'min:50', // Minimum 50 cents
                'max:99999999', // Maximum $999,999.99
            ],
            'currency' => [
                'sometimes',
                'string',
                'size:3',
                'in:usd,eur,gbp,cad,aud,jpy,chf,sek,nok,dkk',
            ],
            'description' => [
                'sometimes',
                'string',
                'max:1000',
            ],
            'metadata' => [
                'sometimes',
                'array',
            ],
            'metadata.*' => [
                'string',
                'max:500',
            ],
        ];
    }

    /**
     * Get custom messages for validator errors.
     */
    public function messages(): array
    {
        return [
            'amount.required' => 'The payment amount is required.',
            'amount.integer' => 'The payment amount must be a whole number in cents.',
            'amount.min' => 'The minimum payment amount is $0.50.',
            'amount.max' => 'The maximum payment amount is $999,999.99.',
            'currency.size' => 'The currency code must be exactly 3 characters.',
            'currency.in' => 'The selected currency is not supported.',
            'description.max' => 'The description may not be greater than 1000 characters.',
            'metadata.array' => 'The metadata must be an array.',
            'metadata.*.string' => 'Each metadata value must be a string.',
            'metadata.*.max' => 'Each metadata value may not be greater than 500 characters.',
        ];
    }

    /**
     * Prepare the data for validation.
     */
    protected function prepareForValidation(): void
    {
        // Convert amount to integer if it's a float (from dollars to cents)
        if ($this->has('amount') && is_numeric($this->amount)) {
            $this->merge([
                'amount' => (int) ($this->amount * 100),
            ]);
        }

        // Set default currency if not provided
        if (!$this->has('currency')) {
            $this->merge([
                'currency' => 'usd',
            ]);
        }
    }
}
