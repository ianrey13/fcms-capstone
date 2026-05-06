<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class DepartmentSeeder extends Seeder
{
    public function run()
    {
        if (DB::table('departments')->count() === 0) {
            DB::table('departments')->insert([
                ['department_id' => 1, 'department_name' => 'System Administration', 'department_code' => 'SYSADMIN'],
                ['department_id' => 2, 'department_name' => 'General Services Office', 'department_code' => 'GSO'],
                ['department_id' => 3, 'department_name' => 'Engineering Office', 'department_code' => 'ENGR'],
                ['department_id' => 4, 'department_name' => 'Rural Health Center', 'department_code' => 'RHU'],
                ['department_id' => 5, 'department_name' => 'Philippine National Police - Laguindingan', 'department_code' => 'PNP'],
            ]);
        }
    }
}