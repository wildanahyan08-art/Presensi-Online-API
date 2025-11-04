import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { Attendance } from './attendance.entity';

export enum UserRole {
  SISWA = 'siswa',
  KARYAWAN = 'karyawan'
}

@Entity('users')
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column({ unique: true })
  username: string;

  @Column()
  password: string;

  @Column({
    type: 'enum',
    enum: UserRole,
    default: UserRole.SISWA
  })
  role: UserRole;

  @Column({ nullable: true })
  kelas: string;

  @Column({ nullable: true })
  jabatan: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToMany(() => Attendance, attendance => attendance.user)
  attendances: Attendance[];
}