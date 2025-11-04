import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { User, UserRole } from '../entities/user.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  async create(createUserDto: { name: string; username: string; password: string; role: string }) {
    const existingUser = await this.userRepository.findOne({ 
      where: { username: createUserDto.username } 
    });

    if (existingUser) {
      throw new ConflictException('Username sudah digunakan');
    }

    const hashedPassword = await bcrypt.hash(createUserDto.password, 10);
    
    const user = this.userRepository.create({
      ...createUserDto,
      password: hashedPassword,
      role: createUserDto.role as UserRole,
    });

    const savedUser = await this.userRepository.save(user);
    const { password, ...result } = savedUser;
    
    return {
      status: 'success',
      message: 'Pengguna berhasil ditambahkan',
      data: result
    };
  }

  async update(id: number, updateUserDto: { name?: string; username?: string; password?: string; role?: string }) {
    const user = await this.userRepository.findOne({ where: { id } });
    
    if (!user) {
      throw new NotFoundException('Pengguna tidak ditemukan');
    }

    if (updateUserDto.password) {
      updateUserDto.password = await bcrypt.hash(updateUserDto.password, 10);
    }

    await this.userRepository.update(id, {
      ...updateUserDto,
      role: updateUserDto.role as UserRole,
    });
    
    // PERBAIKAN: Pastikan updatedUser tidak null
    const updatedUser = await this.userRepository.findOne({ where: { id } });
    
    if (!updatedUser) {
      throw new NotFoundException('Data pengguna tidak ditemukan setelah update');
    }

    const { password, ...result } = updatedUser;

    return {
      status: 'success',
      message: 'Pengguna berhasil diubah',
      data: result
    };
  }

  async findOne(id: number) {
    const user = await this.userRepository.findOne({ where: { id } });
    
    if (!user) {
      throw new NotFoundException('Pengguna tidak ditemukan');
    }

    const { password, ...result } = user;

    return {
      status: 'success',
      data: result
    };
  }

  async findByUsername(username: string): Promise<User | null> {
    return this.userRepository.findOne({ 
      where: { username },
      select: ['id', 'username', 'password', 'role', 'name']
    });
  }
}