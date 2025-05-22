<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class CashBalance extends Model
{
    use HasFactory;

    protected $table = 'cash_balance';

    protected $fillable = [
        'season_id',
        'amount',
        'last_updated'
    ];

    protected $casts = [
        'amount' => 'decimal:2',
        'last_updated' => 'date'
    ];

    public function season()
    {
        return $this->belongsTo(Season::class);
    }
}
