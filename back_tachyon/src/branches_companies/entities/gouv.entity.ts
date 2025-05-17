import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { Delegation } from './Delegation.entity';

@Entity()
export class Gouv {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @OneToMany(() => Delegation, (delegation) => delegation.gouver)
  delegations: Delegation[];
}
