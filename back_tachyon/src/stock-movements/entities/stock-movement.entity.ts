import { Entity, PrimaryGeneratedColumn, ManyToOne, Column } from 'typeorm';
import { Company } from '../../companies/entities/company.entity';
import { Products } from 'src/stock/entities/products.entity';

@Entity()
export class StockMovement {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Products, { eager: true })
  product: Products;

  @ManyToOne(() => Company, { eager: true })
  fromCompany: Company;

  @ManyToOne(() => Company, { eager: true })
  toCompany: Company;

  @Column({ default: 'DPM' })
  movement_type: string;

  @Column({ default: null })
  N_Bon_Enlévement_DPM: string;

  @Column()
  quantity: number;

  @Column({ default: true })
  etat: number;

  @Column({ default: 0 })
  taux_exces: number;

  @Column({ default: 0 })
  taux_deficit: number;

  @Column({ default: false })
  stockPrelv_stt: boolean;

  @Column({ default: false })
  acceptTransfert: boolean;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  date_dpm: Date;

  @Column({ type: 'timestamp', nullable: true })
  date_rdv: Date | null;

  @Column({ type: 'timestamp', nullable: true })
  date_prelev: Date | null;
}
