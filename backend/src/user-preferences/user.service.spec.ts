import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from './users.service';

describe('UsersService', () => {
  let service: UsersService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [UsersService],
    }).compile();

    service = module.get<UsersService>(UsersService);
  });

  it('should create a user', async () => {
    const result = await service.create({
      email: 'new@mail.com',
      password: 'pass',
    });
    expect(result.email).toBe('new@mail.com');
  });

  it('should find a user by email', async () => {
    await service.create({ email: 'lookup@mail.com', password: 'pass' });
    const user = await service.findByEmail('lookup@mail.com');
    expect(user).toBeDefined();
    expect(user.email).toBe('lookup@mail.com');
  });
});
