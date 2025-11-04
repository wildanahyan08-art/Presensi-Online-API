import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from './user.entity';

export enum AttendanceStatus {
  HADIR = 'hadir',
  IZIN = 'izin',
  SAKIT = 'sakit',
  ALPA = 'alpa'
}

@Entity('attendances')
export class Attendance {
  @PrimaryGeneratedColumn()
  attendance_id: number;

  @Column()
  user_id: number;

  @Column({ type: 'date' })
  date: string;

  @Column({ type: 'time' })
  time: string;

  @Column({
    type: 'enum',
    enum: AttendanceStatus,
    default: AttendanceStatus.HADIR
  })
  status: AttendanceStatus;

  @CreateDateColumn({
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP',
    transformer: {
      to: (value: Date) => value,
      from: (value: Date) => {
        return new Date(value.getTime() + 7 * 60 * 60 * 1000); // Menyesuaikan ke GMT+7
      }
    },
  })
  createdAt: Date;

  @ManyToOne(() => User, user => user.attendances)
  @JoinColumn({ name: 'user_id' })
  user: User;
}