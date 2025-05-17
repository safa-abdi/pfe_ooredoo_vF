import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Role } from './roles.entity';
import { Company } from '../../companies/entities/company.entity';

@Entity()
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  nom: string;

  @Column()
  prénom: string;

  @Column()
  num_tel: string;

  @Column()
  email: string;

  @Column()
  mdp: string;

  @Column()
  date_naiss: Date;

  @Column()
  disponibilité: boolean;

  @ManyToOne(() => Role, (role) => role.users)
  @JoinColumn({ name: 'role_id' })
  role: Role;

  @Column({ nullable: true })
  role_id?: number;

  @ManyToOne(() => Company, (company) => company.users)
  @JoinColumn({ name: 'company_id' })
  company: Company;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'coordinateur_id' })
  coordinateur: User;

  @Column({ nullable: true })
  company_id?: number;
}
