import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { Attendance, AttendanceStatus } from '../entities/attendance.entity'; // ✅ PATH YANG BENAR
import { User } from '../entities/user.entity'; // ✅ PATH YANG BENAR

@Injectable()
export class AttendanceService {
    async getUserHistory(user_id: number) {
        try {
            console.log('Getting history for user:', user_id); // ✅ Debug log

            // Cek apakah user exists
            const user = await this.userRepository.findOne({
                where: { id: user_id }
            });

            if (!user) {
                console.log('User not found:', user_id); // ✅ Debug log
                throw new NotFoundException('Pengguna tidak ditemukan');
            }

            // Get attendance data
            const attendances = await this.attendanceRepository.find({
                where: { user_id },
                order: { date: 'DESC', time: 'DESC' },
            });

            console.log('Found attendances:', attendances.length); // ✅ Debug log

            // Format response sesuai soal
            const formattedAttendances = attendances.map(attendance => ({
                attendance_id: attendance.attendance_id,
                date: attendance.date,
                time: attendance.time,
                status: attendance.status
            }));

            return {
                status: 'success',
                data: formattedAttendances
            };
        } catch (error) {
            console.error('Error in getUserHistory:', error); // ✅ Error log
            throw error;
        }
    }
    async getMonthlySummary(user_id: number, month: string) {
        try {
            console.log('Getting monthly summary for user:', user_id, 'month:', month);

            // Cek apakah user exists
            const user = await this.userRepository.findOne({ where: { id: user_id } });

            if (!user) {
                throw new NotFoundException('Pengguna tidak ditemukan');
            }

            // Validasi parameter month
            if (!month || !month.includes('-')) {
                throw new NotFoundException('Format bulan tidak valid. Gunakan: MM-YYYY');
            }

            // Parse bulan (format: MM-YYYY)
            const [monthPart, yearPart] = month.split('-');

            // Validasi numeric
            if (isNaN(parseInt(monthPart)) || isNaN(parseInt(yearPart))) {
                throw new NotFoundException('Bulan dan tahun harus angka');
            }

            // Format bulan dan tahun (pastikan 2 digit untuk bulan)
            const formattedMonth = monthPart.padStart(2, '0');
            const formattedYear = yearPart;

            // Buat tanggal awal dan akhir bulan
            const startDate = `${formattedYear}-${formattedMonth}-01`;

            // Hitung tanggal akhir bulan
            const lastDay = new Date(parseInt(formattedYear), parseInt(formattedMonth), 0).getDate();
            const endDate = `${formattedYear}-${formattedMonth}-${lastDay.toString().padStart(2, '0')}`;

            console.log('Date range:', startDate, 'to', endDate);

            // Query attendances dalam rentang tanggal
            const attendances = await this.attendanceRepository.find({
                where: {
                    user_id,
                    date: Between(startDate, endDate),
                },
            });

            console.log('Found attendances in range:', attendances.length);

            // Hitung summary
            const summary = {
                hadir: 0,
                izin: 0,
                sakit: 0,
                alpa: 0,
            };

            attendances.forEach(attendance => {
                if (attendance.status in summary) {
                    summary[attendance.status]++;
                }
            });

            console.log('Summary calculated:', summary);

            // Response sesuai format soal
            return {
                status: 'success',
                data: {
                    user_id,
                    month: month,
                    attendance_summary: summary
                }
            };
        } catch (error) {
            console.error('Error in getMonthlySummary:', error);
            throw error;
        }
    }
    async getAttendanceAnalysis(start_date: string, end_date: string, group_by: string) {
        try {
            console.log('Analysis params:', { start_date, end_date, group_by });

            // Validasi parameter
            if (!start_date || !end_date || !group_by) {
                throw new Error('Parameter start_date, end_date, dan group_by diperlukan');
            }

            if (group_by !== 'kelas' && group_by !== 'jabatan') {
                throw new Error('Parameter group_by harus "kelas" atau "jabatan"');
            }

            // Ambil semua user dengan relasi attendances
            const users = await this.userRepository.find({
                relations: ['attendances'],
            });

            console.log('Total users found:', users.length);

            const groupedData = {};

            // Group data berdasarkan kategori (kelas atau jabatan)
            users.forEach(user => {
                // Dapatkan group key berdasarkan parameter
                const groupKey = group_by === 'kelas' ? user.kelas : user.jabatan;

                // Skip jika tidak ada kelompok atau null/undefined
                if (!groupKey) {
                    console.log('Skipping user without group:', user.id, user.name);
                    return;
                }

                // Initialize group jika belum ada
                if (!groupedData[groupKey]) {
                    groupedData[groupKey] = {
                        total_users: 0,
                        attendances: [],
                    };
                }

                groupedData[groupKey].total_users++;

                // Filter attendances berdasarkan periode
                const userAttendances = user.attendances?.filter(attendance => {
                    const attendanceDate = attendance.date;
                    return attendanceDate >= start_date && attendanceDate <= end_date;
                }) || [];

                groupedData[groupKey].attendances.push(...userAttendances);
            });

            console.log('Grouped data keys:', Object.keys(groupedData));

            // Jika tidak ada data yang tergroup
            if (Object.keys(groupedData).length === 0) {
                return {
                    status: 'success',
                    data: {
                        analysis_period: {
                            start_date,
                            end_date,
                        },
                        grouped_analysis: []
                    }
                };
            }

            // Hitung persentase untuk setiap group
            const analysis = Object.keys(groupedData).map(group => {
                const groupData = groupedData[group];

                const statusCount = {
                    hadir: 0,
                    izin: 0,
                    sakit: 0,
                    alpa: 0,
                };

                // Hitung total setiap status
                groupData.attendances.forEach(attendance => {
                    if (attendance.status in statusCount) {
                        statusCount[attendance.status]++;
                    }
                });

                const totalRecords = groupData.attendances.length || 1; // Hindari division by zero

                // Hitung persentase
                const hadir_percentage = Number(((statusCount.hadir / totalRecords) * 100).toFixed(2));
                const izin_percentage = Number(((statusCount.izin / totalRecords) * 100).toFixed(2));
                const sakit_percentage = Number(((statusCount.sakit / totalRecords) * 100).toFixed(2));
                const alpa_percentage = Number(((statusCount.alpa / totalRecords) * 100).toFixed(2));

                return {
                    group: group,
                    total_users: groupData.total_users,
                    attendance_rate: {
                        hadir_percentage: hadir_percentage,
                        izin_percentage: izin_percentage,
                        sakit_percentage: sakit_percentage,
                        alpa_percentage: alpa_percentage,
                    },
                    total_attendance: statusCount,
                };
            });

            console.log('Analysis result:', analysis);

            return {
                status: 'success',
                data: {
                    analysis_period: {
                        start_date,
                        end_date,
                    },
                    grouped_analysis: analysis,
                },
            };
        } catch (error) {
            console.error('Error in getAttendanceAnalysis:', error);
            throw error;
        }
    }
    constructor(
        @InjectRepository(Attendance)
        private attendanceRepository: Repository<Attendance>,
        @InjectRepository(User)
        private userRepository: Repository<User>,
    ) { }

    // ... method lainnya TETAP SAMA
    async create(createAttendanceDto: { user_id: number; date: string; time: string; status: string }) {
        const user = await this.userRepository.findOne({ where: { id: createAttendanceDto.user_id } });

        if (!user) {
            throw new NotFoundException('Pengguna tidak ditemukan');
        }

        const attendance = this.attendanceRepository.create({
            ...createAttendanceDto,
            status: createAttendanceDto.status as AttendanceStatus,
            time: createAttendanceDto.time, // Tetap simpan sebagai string
            date: createAttendanceDto.date,  // Tetap simpan sebagai string
        });

        const savedAttendance = await this.attendanceRepository.save(attendance);

        // ✅ FORMAT RESPONSE TANPA TIMESTAMP OTOMATIS
        const responseData = {
            attendance_id: savedAttendance.attendance_id,
            user_id: savedAttendance.user_id,
            date: savedAttendance.date,      // Tetap string '2024-01-15'
            time: savedAttendance.time,      // Tetap string '20:00:00'
            status: savedAttendance.status
        };

        return {
            status: 'success',
            message: 'Presensi berhasil dicatat',
            data: responseData
        };
    }

    // ... method lainnya TETAP SAMA
}