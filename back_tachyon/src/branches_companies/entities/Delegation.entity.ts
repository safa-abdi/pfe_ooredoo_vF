import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  ManyToMany,
  OneToMany,
} from 'typeorm';
import { Branch } from './Branch.entity';
import { Gouv } from './gouv.entity';
import { CompanyDelegation } from './CompanyDelegation';

@Entity()
export class Delegation {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @ManyToOne(() => Gouv, (gouver) => gouver.delegations, {
    onDelete: 'CASCADE',
  })
  gouver: Gouv;

  @ManyToMany(() => Branch, (branch) => branch.delegations)
  branches: Branch[];

  @OneToMany(() => CompanyDelegation, (cd) => cd.delegation)
  companyDelegations: CompanyDelegation[];

  get governorate(): string {
    return this.gouver?.name;
  }
}
