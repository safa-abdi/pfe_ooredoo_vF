import { IsInt, IsOptional } from 'class-validator';
import { Company } from '../../companies/entities/company.entity';
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  Unique,
  ManyToMany,
  JoinTable,
} from 'typeorm';
import { Delegation } from './Delegation.entity';

export enum Governorates {
  Ariana = 'Ariana',
  Beja = 'Beja',
  BenArous = 'Ben Arous',
  Bizerte = 'Bizerte',
  Gabes = 'Gabes',
  Gafsa = 'Gafsa',
  Jendouba = 'Jendouba',
  Kairouan = 'Kairouan',
  Kasserine = 'Kasserine',
  Kebili = 'Kebili',
  Kef = 'kef',
  Mahdia = 'Mahdia',
  Mannouba = 'Mannouba',
  Medenine = 'Medenine',
  Monastir = 'Monastir',
  Nabeul = 'Nabeul',
  Sfax = 'Sfax',
  SidiBouzid = 'Sidi Bouzid',
  Siliana = 'Siliana',
  Tataouine = 'Tataouine',
  Tozeur = 'Tozeur',
  Tunis = 'Tunis',
  Zaghouan = 'Zaghouan',
  Sousse = 'Sousse',
}

@Entity()
@Unique(['name'])
export class Branch {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @ManyToOne(() => Company)
  @JoinColumn({ name: 'parent_company_id' })
  parentCompany: Company;

  @Column({ type: 'enum', enum: Governorates, nullable: true })
  governorate: Governorates;

  @ManyToMany(() => Delegation, { nullable: true })
  @JoinTable({
    name: 'branch_delegations',
    joinColumn: { name: 'branch_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'delegation_id', referencedColumnName: 'id' },
  })
  delegations: Delegation[];

  @Column({ nullable: true })
  contact: string;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  created_at: Date;

  @IsInt()
  @IsOptional()
  parentCompanyId?: number;

  @Column({ type: 'boolean', default: false })
  blocked: boolean;
}
