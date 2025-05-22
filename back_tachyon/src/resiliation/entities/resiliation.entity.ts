import { DemandeBase } from 'src/demande/demande.base.entity';
import { Column, Entity, Index } from 'typeorm';

@Entity()
export class Resiliation extends DemandeBase {
  @Column({ nullable: true })
  Description: string;

  @Column({ nullable: true })
  Detail: string;

  @Column({ nullable: true })
  entite: string;

  @Column({ nullable: true })
  @Index()
  CONTACT2_CLIENT: string;

  @Column({ nullable: true })
  @Index()
  STT: string;
}
