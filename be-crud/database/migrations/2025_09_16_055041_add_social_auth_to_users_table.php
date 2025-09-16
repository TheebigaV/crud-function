<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            // Add provider column if it doesn't exist
            if (!Schema::hasColumn('users', 'provider')) {
                $table->string('provider')->nullable()->after('password');
            }

            // Add provider_id column if it doesn't exist
            if (!Schema::hasColumn('users', 'provider_id')) {
                $table->string('provider_id')->nullable()->after('provider');
            }

            // Add avatar column if it doesn't exist
            if (!Schema::hasColumn('users', 'avatar')) {
                $table->string('avatar')->nullable()->after('provider_id');
            }
        });

        // Check if password column can be nullable
        try {
            Schema::table('users', function (Blueprint $table) {
                $table->string('password')->nullable()->change();
            });
        } catch (\Exception $e) {
            // If changing password to nullable fails, it might already be nullable
            \Log::info('Password column modification skipped: ' . $e->getMessage());
        }

        // Add index only if it doesn't exist
        $indexExists = collect(DB::select("SHOW INDEX FROM users WHERE Key_name = 'users_provider_provider_id_index'"))->isNotEmpty();

        if (!$indexExists) {
            Schema::table('users', function (Blueprint $table) {
                $table->index(['provider', 'provider_id'], 'users_provider_provider_id_index');
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            // Drop index if it exists
            $indexExists = collect(DB::select("SHOW INDEX FROM users WHERE Key_name = 'users_provider_provider_id_index'"))->isNotEmpty();

            if ($indexExists) {
                $table->dropIndex('users_provider_provider_id_index');
            }

            // Drop columns if they exist
            $columnsToCheck = ['provider', 'provider_id', 'avatar'];
            $existingColumns = Schema::getColumnListing('users');

            foreach ($columnsToCheck as $column) {
                if (in_array($column, $existingColumns)) {
                    $table->dropColumn($column);
                }
            }
        });
    }
};
