<?php

namespace Database\Seeders;

use App\Models\Item;
use App\Models\User;
// use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // Create a test user
        User::create([
            'name' => 'Test User',
            'email' => 'test@example.com',
            'password' => Hash::make('password'),
        ]);

        // Create some sample items
        Item::create([
            'name' => 'Sample Item 1',
            'description' => 'This is the first sample item',
        ]);

        Item::create([
            'name' => 'Sample Item 2',
            'description' => 'This is the second sample item',
        ]);
    }
}

