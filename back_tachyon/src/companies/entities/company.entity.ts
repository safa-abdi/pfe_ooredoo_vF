import { CompanyDelegation } from '../../branches_companies/entities/CompanyDelegation';
import { User } from '../../users/entities/user.entity';
import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';

@Entity()
export class Company {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column({
    type: 'enum',
    enum: ['societe_principale', 'sous_traitant'],
    default: 'sous_traitant',
  })
  type: string;

  @Column({ type: 'text', nullable: true })
  adresse: string;

  @Column({ nullable: true })
  contact: string;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  created_at: Date;

  @Column({ type: 'boolean', default: false })
  blocked: boolean;

  @OneToMany(() => User, (user) => user.company)
  users: User[];

  // @OneToMany(() => Branch, (branch) => branch.parentCompany)
  // branches: Branch[];

  @OneToMany(() => CompanyDelegation, (cd) => cd.company)
  companyDelegations: CompanyDelegation[];
}
