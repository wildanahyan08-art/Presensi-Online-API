import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { AttendanceModule } from './attendance/attendance.module';
import { User } from './entities/user.entity';
import { Attendance } from './entities/attendance.entity';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'mysql',
      host: 'localhost',
      port: 3306,
      username: 'root',           // Username default
      password: '',               // ✅ KOSONGKAN JIKA TANPA PASSWORD
      database: 'presensi_online',
      entities: [User, Attendance],
      synchronize: true,          // Auto create tables
      timezone: '+07:00',         // Sesuaikan dengan zona waktu Anda
    }),
    AuthModule,
    UsersModule,
    AttendanceModule,
  ],
})
export class AppModule {}