import { IsString, IsNumber, IsOptional, IsNotEmpty } from 'class-validator';

export class UpdatePlainteDto {
  @IsNotEmpty()
  @IsString()
  crm_case: string;

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
  @IsString()
  CLIENT?: string;

  @IsOptional()
  @IsString()
  CONTACT_CLIENT?: string;

  @IsOptional()
  @IsString()
  CONTACT2_CLIENT?: string;

  @IsOptional()
  @IsString()
  Detail?: string;

  @IsOptional()
  @IsString()
  Description?: string;
}
