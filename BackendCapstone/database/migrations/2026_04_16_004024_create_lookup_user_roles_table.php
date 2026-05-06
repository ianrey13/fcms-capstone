<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;


return new class extends Migration
{
    public function up()
    {
        Schema::create('lookup_user_roles', function (Blueprint $table) {
            $table->string('role_code', 30)->primary();
            $table->string('role_name', 100);
            $table->text('description')->nullable();
            $table->tinyInteger('hierarchy_level')->default(0);
            $table->boolean('is_active')->default(true);
            $table->timestamp('created_at')->useCurrent();
        });

        DB::table('lookup_user_roles')->insert([
            ['role_code' => 'superadmin', 'role_name' => 'Super Administrator', 'hierarchy_level' => 100],
            ['role_code' => 'mayors_office', 'role_name' => 'Mayors Office', 'hierarchy_level' => 60],
            ['role_code' => 'head_of_office', 'role_name' => 'Head of Office', 'hierarchy_level' => 50],
            ['role_code' => 'gso_staff', 'role_name' => 'GSO Staff', 'hierarchy_level' => 40],
            ['role_code' => 'dept_office', 'role_name' => 'Department Staff', 'hierarchy_level' => 10],
            ['role_code' => 'driver', 'role_name' => 'Driver', 'hierarchy_level' => 5],
        ]);
    }

    public function down()
    {
        Schema::dropIfExists('lookup_user_roles');
    }
};