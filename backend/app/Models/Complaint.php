<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Complaint extends Model
{
    use HasFactory;

    /**
     * 1. Define fillable properties for mass assignment safety.
     */
    protected $fillable = [
        'user_id',
        'officer_id',
        'name', 
        'phone', 
        'address', 
        'city', 
        'state', 
        'zip', 
        'accused_names', 
        'incident_date', 
        'incident_time', 
        'incident_location', 
        'police_unit_id', 
        'police_station_id', 
        'complaint_type_id', 
        'description', 
        'evidence_path',
        'status'
    ];

    /**
     * 2. Inverse relationship targeting the investigating officer assigned to the case.
     */
    public function officer()
    {
        return $this->belongsTo(User::class, 'officer_id');
    }

    /**
     * 3. Inverse relationship targeting the authentic citizen who submitted the report.
     */
    public function citizen()
    {
        return $this->belongsTo(User::class, 'user_id');
    }
}