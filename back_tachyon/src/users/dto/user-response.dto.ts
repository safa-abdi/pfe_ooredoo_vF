import { Exclude } from 'class-transformer';
import { Company } from 'src/companies/entities/company.entity';

export class UserResponseDto {
  id: number;
  nom: string;
  prénom: string;
  num_tel: string;
  email: string;
  date_naiss: Date;
  disponibilité: boolean;
  role_id?: number;

  @Exclude()
  mdp?: string;
  role: any;
  company: Company;
}
