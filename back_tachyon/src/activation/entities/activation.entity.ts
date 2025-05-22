import { Column, Entity, Index, OneToMany } from 'typeorm';
import { Prod_imei } from './Prod_imei.entity';
import { DemandeBase } from 'src/demande/demande.base.entity';

@Entity()
export class Activation extends DemandeBase {
  @Column({ nullable: true, default: 0 })
  METRAGE_CABLE: number;

  @OneToMany(() => Prod_imei, (prod_imei) => prod_imei.activation)
  Prod_imei: Prod_imei[];

  @Column({ nullable: true })
  offre: string;

  @Column({ nullable: true })
  @Index()
  NAME_STT: string;
}
