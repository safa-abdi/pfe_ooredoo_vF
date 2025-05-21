import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity()
export class Products {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column({ unique: true })
  reference: string;

  @Column({ default: false })
  archived: boolean;

  @Column({ type: 'text' })
  description: string;

  @Column({ nullable: true })
  unit: string;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  created_at: Date;

  @Column({ default: 10 })
  lowThreshold: number;

  @Column({ default: 50 })
  mediumThreshold: number;
}
