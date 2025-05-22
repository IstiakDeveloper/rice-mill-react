<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class FundInput extends Model
{
    use HasFactory;

    protected $fillable = [
        'source',
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
