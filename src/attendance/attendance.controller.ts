import { Controller, Get, Post, Param, Body, UseGuards, ParseIntPipe, Query } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AttendanceService } from './attendance.service';

@Controller('api/attendance')
@UseGuards(AuthGuard('jwt'))
export class AttendanceController {
  constructor(private readonly attendanceService: AttendanceService) {}

  @Post()
  async create(
    @Body() createAttendanceDto: { user_id: number; date: string; time: string; status: string }
  ) {
    return this.attendanceService.create(createAttendanceDto);
  }

  @Get('history/:user_id')
  async getUserHistory(@Param('user_id', ParseIntPipe) user_id: number) {
    return this.attendanceService.getUserHistory(user_id);
  }

  @Get('summary/:user_id')
  async getMonthlySummary(
    @Param('user_id', ParseIntPipe) user_id: number,
    @Query('month') month: string,
  ) {
    return this.attendanceService.getMonthlySummary(user_id, month);
  }

  @Post('analysis')
  async getAttendanceAnalysis(
    @Body() analysisDto: { 
        start_date: string; 
        end_date: string; 
        group_by: string 
    }
  ) {
    return this.attendanceService.getAttendanceAnalysis(
      analysisDto.start_date,
      analysisDto.end_date,
      analysisDto.group_by
    );
  }
}