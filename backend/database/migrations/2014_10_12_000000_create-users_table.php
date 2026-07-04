
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
   public function up(): void
{
    Schema::create('users', function (Blueprint $table) {
        $table->id(); 
        $table->string('name');
        $table->string('email')->unique();
        $table->string('mobile');
        $table->string('role')->default('citizen'); // citizen, police, admin
        
        // 👈 নতুন কলাম: পুলিশ অফিসারের জন্য থানা লিংক করার জন্য (এটি nullable রাখা হয়েছে কারণ সিটজেনদের কোনো থানা থাকবে না)
       $table->unsignedBigInteger('police_station_id')->nullable();
        
        $table->string('password')->nullable();
        $table->timestamps();
    });
}
};