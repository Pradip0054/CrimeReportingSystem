<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\User;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $this->call([
            PoliceUnitSeeder::class,
            PoliceStationSeeder::class,
            ComplaintTypeSeeder::class,
        ]);

        // ডিফল্ট অ্যাডমিন ইউজার তৈরি
        User::create([
            'name' => 'Pradip Mishra',
            'email' => 'mcamishra785@gmail.com',
            'mobile' => '+916295386571',
            'role' => 'admin',
        ]);

        // 🎯 লোকেশন ফিল্টারিং টেস্ট করার জন্য সঠিক থানার আন্ডারে পুলিশ অফিসার তৈরি
        User::create([
            'name' => 'Officer Pradip (Chinsurah)',
            'email' => 'mishrapradip@gmail.com',
            'mobile' => '9847521661',
            'password' => Hash::make('password123'),
            'role' => 'police',
            'police_station_id' => 1, // 👈 ১ নম্বর থানা (Chinsurah/Hooghly Rural)
        ]);

        User::create([
            'name' => 'Officer Dip (Sabang)',
            'email' => 'pradiplaptop785@gmail.com',
            'mobile' => '05423698756',
            'password' => Hash::make('password123'),
            'role' => 'police',
            'police_station_id' => 246, // 👈 ২৪৬ নম্বর থানা (Sabang PS)
        ]);
    }
}