import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  BeforeInsert,
  OneToMany,
} from 'typeorm';
import { Products } from './products.entity';
import { Company } from 'src/companies/entities/company.entity';
import { StockItem } from './stock-item.entity';

@Entity()
export class Stock {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Products)
  @JoinColumn({ name: 'product_id' })
  product: Products;

  @ManyToOne(() => Company)
  @JoinColumn({ name: 'company_id' })
  company: Company;

  @Column()
  quantity: number;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  updated_at: Date;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  date_prel: Date;

  @Column({ nullable: true })
  DPM_quantity: number;

  @OneToMany(() => StockItem, (item) => item.stock, { cascade: true })
  items: StockItem[];

  @BeforeInsert()
  setDefaultDPMQuantity() {
    if (this.DPM_quantity === undefined || this.DPM_quantity === null) {
      this.DPM_quantity = this.quantity;
    }
  }

  @Column({ type: 'boolean', default: true })
  global: boolean;
}
