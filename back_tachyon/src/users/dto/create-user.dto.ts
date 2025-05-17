import {
  IsString,
  IsEmail,
  IsBoolean,
  IsDate,
  IsOptional,
} from 'class-validator';

export class CreateUserDto {
  @IsString()
  nom: string;
  @IsString()
  prénom: string;
  @IsString()
  num_tel: string;
  @IsEmail()
  email: string;
  @IsString()
  mdp: string;
  @IsDate()
  date_naiss: Date;
  @IsBoolean()
  disponibilité: boolean;
  @IsOptional()
  role_id?: number;
  @IsOptional()
  coordinateur_id?: number;
}
