import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Activation } from './activation.entity';

@Entity()
export class Prod_imei {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ nullable: false })
  imei_idu: string;

  @Column({ default: false })
  S_N_odu: string;

  @Column({ default: false })
  S_N_idu: string;

  @Column({ nullable: false })
  Date_Ajout_En_Activation: Date;

  @ManyToOne(() => Activation, (activation) => activation.Prod_imei)
  activation: Activation;
}
