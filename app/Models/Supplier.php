<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Supplier extends Model
{
    protected $fillable = ['nama', 'telepon', 'alamat'];

    public function stockIns()
    {
        return $this->hasMany(StockIn::class);
    }
}

