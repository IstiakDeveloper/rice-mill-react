<?php

namespace Database\Seeders;

use App\Models\User;
// use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // User::factory(10)->create();

        // Default test user
        User::factory()->create([
            'name' => 'Test User',
            'email' => 'test@gmail.com',
            'password' => bcrypt('password'),
        ]);

        // Create multiple users from array
        $users = [
            ['name' => 'Sium', 'email' => 'sium@gmail.com', 'password' => bcrypt('password')],
            ['name' => 'Shakil', 'email' => 'shakil@gmail.com', 'password' => bcrypt('password')],
            ['name' => 'Istiak', 'email' => 'istiak@gmail.com', 'password' => bcrypt('password')],
        ];

        foreach ($users as $user) {
            User::factory()->create($user);
        }
    }
}
