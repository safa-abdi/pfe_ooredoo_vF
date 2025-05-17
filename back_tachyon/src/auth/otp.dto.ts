import { IsString, IsNotEmpty } from 'class-validator';

export class OtpDto {
  @IsString()
  @IsNotEmpty()
  num_tel: string;

  @IsString()
  @IsNotEmpty()
  otp: string;
}
