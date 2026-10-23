<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Setting extends Model
{
    protected $fillable = ['key', 'value'];

    // Helper untuk mengambil value dengan mudah
    public static function get(string $key, $default = null)
    {
        return static::where('key', $key)->first()?->value ?? $default;
    }

    // Helper untuk menyimpan value
    public static function set(string $key, $value)
    {
        return static::updateOrCreate(['key' => $key], ['value' => $value]);
    }
}