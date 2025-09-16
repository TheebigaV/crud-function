<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Payment extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'stripe_payment_intent_id',
        'amount',
        'currency',
        'status',
        'description',
        'metadata'
    ];

    protected $casts = [
        'metadata' => 'array'
    ];
}
