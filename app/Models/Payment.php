<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Carbon\Carbon;

class Payment extends Model
{
    use HasFactory;

    protected $fillable = [
        'customer_id',
        'transaction_id',
        'season_id',
        'payment_date',
        'amount',
        'notes'
    ];

    protected $casts = [
        'payment_date' => 'date',
        'amount' => 'decimal:2',
    ];

    /**
     * Get the customer associated with the payment.
     */
    public function customer(): BelongsTo
    {
        return $this->belongsTo(Customer::class);
    }

    /**
     * Get the transaction associated with the payment.
     */
    public function transaction(): BelongsTo
    {
        return $this->belongsTo(Transaction::class);
    }

    /**
     * Get the season associated with the payment.
     */
    public function season(): BelongsTo
    {
        return $this->belongsTo(Season::class);
    }

    /**
     * Boot the model.
     */
    protected static function boot()
    {
        parent::boot();

        static::creating(function ($payment) {
            // Set season automatically if not provided
            if (!$payment->season_id) {
                $payment->season_id = Season::getCurrentSeason()->id;
            }

            // Set payment date to today if not provided
            if (!$payment->payment_date) {
                $payment->payment_date = Carbon::today();
            }
        });

        static::created(function ($payment) {
            // Update transaction payment status if associated with a transaction
            if ($payment->transaction_id) {
                $transaction = $payment->transaction;
                $transaction->paid_amount += $payment->amount;
                $transaction->due_amount = $transaction->total_amount - $transaction->paid_amount;
                $transaction->updatePaymentStatus();
            }
        });
    }
}
