<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Carbon\Carbon;

class Season extends Model
{
    use HasFactory;

    protected $fillable = ['name'];

    /**
     * Get transactions for this season.
     */
    public function transactions(): HasMany
    {
        return $this->hasMany(Transaction::class);
    }

    /**
     * Get payments for this season.
     */
    public function payments(): HasMany
    {
        return $this->hasMany(Payment::class);
    }

    /**
     * Get current season or create if not exists.
     */
    public static function getCurrentSeason()
    {
        $now = Carbon::now();
        $year = $now->year;

        // January to July is Eiri Season
        if ($now->month >= 1 && $now->month <= 7) {
            $seasonName = "Eiri" . $year;
        } else {
            // August to December - still count as Eiri for the next year
            $seasonName = "Eiri" . ($year + 1);
        }

        $season = self::firstOrCreate(['name' => $seasonName]);

        return $season;
    }
}
