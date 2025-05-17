import {
  Entity,
  PrimaryGeneratedColumn,
  ManyToOne,
  Unique,
  JoinColumn,
  Column,
} from 'typeorm';
import { Delegation } from './Delegation.entity';
import { User } from '../../users/entities/user.entity';
import { Company } from '../../companies/entities/company.entity';

@Entity()
@Unique(['company', 'delegation', 'technicien'])
export class CompanyDelegation {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Company, (company) => company.companyDelegations, {
    onDelete: 'CASCADE',
  })
  company: Company;

  @ManyToOne(() => Delegation, (delegation) => delegation.companyDelegations, {
    onDelete: 'CASCADE',
  })
  delegation: Delegation;
  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
  technicien: User;

  @Column({ type: 'boolean', default: false })
  blocked: boolean;
}
