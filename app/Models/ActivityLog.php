<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ActivityLog extends Model
{
    protected $fillable = [
        'user_id',
        'tipe',
        'subjek_tipe',
        'subjek_id',
        'deskripsi',
        'data_lama',
        'data_baru',
        'ip_address',
    ];

    protected function casts(): array
    {
        return [
            'data_lama' => 'array',
            'data_baru' => 'array',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public static function log(
        string $tipe,
        string $deskripsi,
        ?string $subjekTipe = null,
        ?int $subjekId = null,
        ?array $dataLama = null,
        ?array $dataBaru = null
    ): self {
        return self::create([
            'user_id' => auth()->id(),
            'tipe' => $tipe,
            'subjek_tipe' => $subjekTipe,
            'subjek_id' => $subjekId,
            'deskripsi' => $deskripsi,
            'data_lama' => $dataLama,
            'data_baru' => $dataBaru,
            'ip_address' => request()->ip(),
        ]);
    }
}
