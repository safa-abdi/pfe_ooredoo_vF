/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-call */

/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private jwtService: JwtService,
    private readonly configServices: ConfigService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const token = this.extractTokenFromHeader(request);

    if (!token) {
      console.log('No token provided');
      throw new UnauthorizedException('No token provided');
    }

    try {
      console.log('Verifying token...');
      const decoded = await this.jwtService.verifyAsync(token, {
        secret: this.configServices.get<string>('JWT_SECRET'),
        algorithms: ['HS256'],
      });
      request.user = decoded;
      return true;
    } catch (error) {
      console.log('Token verification failed', error);
      throw new UnauthorizedException('Invalid token');
    }
  }

  private extractTokenFromHeader(request): string | null {
    const token = request.headers['authorization']?.split(' ')[1];
    console.log('Extracted token:', token);
    return token || null;
  }
}
