import { IsString, IsNumber, IsOptional, IsNotEmpty } from 'class-validator';

export class UpdateResiliationDto {
  @IsNotEmpty()
  @IsString()
  crm_case: number;

  @IsOptional()
  @IsString()
  Gouvernorat?: string;

  @IsOptional()
  @IsString()
  Delegation?: string;

  @IsOptional()
  @IsNumber()
  LATITUDE_SITE?: number;

  @IsOptional()
  @IsNumber()
  LONGITUDE_SITE?: number;

  @IsOptional()
  @IsNumber()
  CLIENT?: string;

  @IsOptional()
  @IsString()
  entite?: string;
}
