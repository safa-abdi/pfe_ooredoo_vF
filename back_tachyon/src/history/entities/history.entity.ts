import { Entity, PrimaryGeneratedColumn, Column, Index } from 'typeorm';

@Entity()
export class History {
  [x: string]: any;
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 50 })
  data_type: string;

  @Column({ type: 'timestamp' })
  actionDate: Date;

  @Column({ type: 'varchar', length: 100 })
  crm_case: string;
  @Column({ type: 'varchar', length: 50 })
  action: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  user_id: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  STT: string;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  created_at: Date;
}
