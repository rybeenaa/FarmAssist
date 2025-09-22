import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from 'src/users/user.entity';
import * as bcrypt from 'bcrypt';
import { Flare } from '@flareapp/js';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    private readonly jwtService: JwtService,
  ) {}

  async register(username: string, password: string, role: string = 'farmer') {
    const hashed = await bcrypt.hash(password, 10);
    const user = this.userRepo.create({ username, password: hashed, role });
    return this.userRepo.save(user);
  }

  async validateUser(username: string, password: string) {
    const user = await this.userRepo.findOne({ where: { username } });
    if (user && (await bcrypt.compare(password, user.password))) {
      return user;
    }
    return null;
  }

  async login(username: string, password: string) {
    const user = await this.validateUser(username, password);
    if (!user) throw new UnauthorizedException();

    try {
      // fake check
      if (email !== 'test@test.com') {
        Flare.report('Invalid login attempt', { email });
        throw new UnauthorizedException('Invalid credentials');
      }
      return { token: 'jwt-token' };
    } catch (err) {
      Flare.report(err);
      throw err;
    }

    const payload = { sub: user.id, username: user.username, role: user.role };
    return {
      access_token: this.jwtService.sign(payload),
    };
  }
}
