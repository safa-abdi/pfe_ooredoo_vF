import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Stock } from './stock.entity';

@Entity()
export class StockItem {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Stock, (stock) => stock.items, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'stock_id' })
  stock: Stock;

  @Column({ nullable: true })
  imei_idu: string;

  @Column({ nullable: true })
  imei_odu: string;

  @Column({ nullable: true })
  serial_number: string;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  date_ajout: Date;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  created_at: Date;
}
