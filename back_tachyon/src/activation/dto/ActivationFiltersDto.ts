import { IsOptional, IsDateString, IsString, IsNumber } from 'class-validator';
import { Type } from 'class-transformer';

export class ActivationFiltersDto {
  @IsOptional()
  @IsDateString()
  startDate?: Date;

  @IsOptional()
  @IsDateString()
  endDate?: Date;

  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsString()
  msisdn?: string;

  @IsOptional()
  @IsString()
  client?: string;

  @IsOptional()
  @IsString()
  gouvernorat?: string;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  branchId?: number;

  // Vous pouvez ajouter d'autres champs de filtrage selon vos besoins
  @IsOptional()
  @IsString()
  delegation?: string;

  @IsOptional()
  @IsString()
  repTravauxStt?: string;

  @IsOptional()
  @IsString()
  desPack?: string;
}