<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class AdditionalIncome extends Model
{
    use HasFactory;

    protected $fillable = [
        'income_source',
        'season_id',
        'date',
        'amount',
        'description'
    ];

    protected $casts = [
        'date' => 'date',
        'amount' => 'decimal:2'
    ];

    public function season()
    {
        return $this->belongsTo(Season::class);
    }
}
