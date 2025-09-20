import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { JwtService } from '@nestjs/jwt';
import { UserPreferencesService } from 'src/user-preferences/user-preferences.service';

describe('AuthService', () => {
  let service: AuthService;
  let usersService: Partial<UserPreferencesService>;
  let jwtService: Partial<JwtService>;

  beforeEach(async () => {
    usersService = {
      findByEmail: jest.fn().mockResolvedValue(null),
      create: jest
        .fn()
        .mockImplementation((dto) => Promise.resolve({ id: 1, ...dto })),
    };
    jwtService = {
      signAsync: jest.fn().mockResolvedValue('mock-jwt-token'),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: usersService, useValue: usersService },
        { provide: JwtService, useValue: jwtService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  it('should register a new user', async () => {
    const result = await service.register({
      email: 'test@mail.com',
      password: 'pass',
    });
    expect(usersService.create).toHaveBeenCalled();
    expect(result).toHaveProperty('id');
  });

  it('should login an existing user', async () => {
    (usersService.findByEmail as jest.Mock).mockResolvedValueOnce({
      id: 1,
      email: 'test@mail.com',
      password: 'pass',
    });
    const result = await service.login({
      email: 'test@mail.com',
      password: 'pass',
    });
    expect(jwtService.signAsync).toHaveBeenCalled();
    expect(result).toHaveProperty('access_token');
  });
});
