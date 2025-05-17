import { IsString } from 'class-validator';

export class LoginTechDto {
  num_tel: number;

  @IsString()
  mdp: string;
}
