import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { User } from '../entities/user.entity';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private jwtService: JwtService,
    // HAPUS BARIS INI: private usersService: UsersService, // ❌ TIDAK PERLU
  ) {}

  async validateUser(username: string, password: string): Promise<any> {
    // Gunakan userRepository langsung
    const user = await this.userRepository.findOne({ 
      where: { username },
      select: ['id', 'username', 'password', 'role', 'name'] // Explicit select fields
    });
    
    if (user && await bcrypt.compare(password, user.password)) {
      const { password, ...result } = user;
      return result;
    }
    return null;
  }

  async login(loginData: { username: string; password: string }) {
    const user = await this.validateUser(loginData.username, loginData.password);
    
    if (!user) {
      throw new UnauthorizedException('Username atau password salah');
    }

    const payload = { username: user.username, sub: user.id, role: user.role };
    
    return {
      status: 'success',
      message: 'Login berhasil',
      token: this.jwtService.sign(payload)
    };
  }
}