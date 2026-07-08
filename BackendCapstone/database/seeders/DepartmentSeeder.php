<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class DepartmentSeeder extends Seeder
{
    public function run()
    {
        // Clear existing data
        Schema::disableForeignKeyConstraints();
        DB::table('departments')->truncate();
        Schema::enableForeignKeyConstraints();

        DB::table('departments')->insert([
            [
                'department_id' => 1,
                'department_name' => 'System Administration',
                'department_code' => 'SYSADMIN',
                'is_active' => true,
                'created_at' => now(),
            ],
            [
                'department_id' => 2,
                'department_name' => 'General Services Office',
                'department_code' => 'GSO',
                'is_active' => true,
                'created_at' => now(),
            ],
            [
                'department_id' => 3,
                'department_name' => 'Engineering Office',
                'department_code' => 'ENGR',
                'is_active' => true,
                'created_at' => now(),
            ],
            [
                'department_id' => 4,
                'department_name' => 'Rural Health Center',
                'department_code' => 'RHU',
                'is_active' => true,
                'created_at' => now(),
            ],
            [
                'department_id' => 5,
                'department_name' => 'Philippine National Police - Laguindingan',
                'department_code' => 'PNP',
                'is_active' => true,
                'created_at' => now(),
            ],
            [
                'department_id' => 6,
                'department_name' => "Mayor's Office",
                'department_code' => 'MO',
                'is_active' => true,
                'created_at' => now(),
            ],
        ]);
    }
}