import { DemandeBase } from 'src/demande/demande.base.entity';
import { Column, Entity, Index } from 'typeorm';

@Entity()
export class Plainte extends DemandeBase {
  @Column({ nullable: true })
  Detail: string;

  @Column({ nullable: true })
  Description: string;

  @Column({ nullable: true })
  @Index()
  CONTACT2_CLIENT: string;

  @Column({ nullable: true })
  @Index()
  NAME_STT: string;

  @Column({ nullable: true })
  offre: string;
}
