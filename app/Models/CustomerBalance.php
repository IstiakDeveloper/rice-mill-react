<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class CustomerBalance extends Model
{
    use HasFactory;

    protected $fillable = [
        'customer_id',
        'season_id',
        'total_sales',
        'total_payments',
        'balance',
        'advance_payment',
        'last_transaction_date',
        'last_payment_date',
    ];

    protected $casts = [
        'total_sales' => 'decimal:2',
        'total_payments' => 'decimal:2',
        'balance' => 'decimal:2',
        'advance_payment' => 'decimal:2',
        'last_transaction_date' => 'date',
        'last_payment_date' => 'date',
    ];

    public function customer()
    {
        return $this->belongsTo(Customer::class);
    }

    public function season()
    {
        return $this->belongsTo(Season::class);
    }

    public function getStatusAttribute()
    {
        if ($this->balance > 0) {
            return 'due';
        } elseif ($this->advance_payment > 0) {
            return 'advance';
        } else {
            return 'clear';
        }
    }

    public function getDisplayBalanceAttribute()
    {
        if ($this->balance > 0) {
            return 'Due: ' . number_format($this->balance, 2);
        } elseif ($this->advance_payment > 0) {
            return 'Advance: ' . number_format($this->advance_payment, 2);
        } else {
            return 'Clear';
        }
    }
}
