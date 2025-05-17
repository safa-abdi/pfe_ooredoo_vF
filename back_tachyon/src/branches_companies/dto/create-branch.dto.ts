import {
  IsString,
  IsEnum,
  IsOptional,
  IsNotEmpty,
  IsInt,
} from 'class-validator';
import { Governorates } from '../entities/Branch.entity';

export class CreateBranchDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsEnum(Governorates)
  @IsOptional()
  governorate?: Governorates;

  @IsString()
  @IsOptional()
  contact?: string;

  @IsInt()
  @IsOptional()
  parentCompanyId?: number;
}
