import { CompanyDelegation } from 'src/branches_companies/entities/CompanyDelegation';
import { Company } from 'src/companies/entities/company.entity';
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  Index,
  ManyToOne,
  JoinColumn,
  BeforeInsert,
  BeforeUpdate,
  OneToMany,
} from 'typeorm';
import { Prod_imei } from './Prod_imei.entity';

@Entity()
export class Activation {
  @PrimaryGeneratedColumn()
  @Index()
  crm_case: string;

  @Column()
  DATE_CREATION_CRM: Date;

  @Column({ type: 'double' })
  LATITUDE_SITE: number;

  @Column({ type: 'double' })
  LONGITUDE_SITE: number;

  @Column({ nullable: false })
  @Index()
  MSISDN: string;

  @Column({ nullable: false })
  @Index()
  CONTACT_CLIENT: string;

  @Column({ nullable: true })
  @Index()
  CLIENT: string;

  @Column({ nullable: true })
  REP_TRAVAUX_STT: string;

  @Column({ nullable: true })
  NAME_STT: string;

  @Column({ nullable: true })
  Delegation: string;

  @Column({ nullable: true })
  Gouvernorat: string;

  @Column({ nullable: true })
  DATE_AFFECTATION_STT: Date;

  @Column({ nullable: true })
  DES_PACK: string;

  @Column({ nullable: true })
  offre: string;

  @Column()
  OPENING_DATE_SUR_TIMOS: Date;

  @Column({ nullable: true })
  REP_RDV: string;

  @Column({ nullable: true })
  DATE_PRISE_RDV: Date;

  @Column({ nullable: true })
  CMT_RDV: string;

  @Column({ nullable: true, default: 0 })
  METRAGE_CABLE: number;

  @Column({ nullable: true })
  STATUT: string;

  @Column({ nullable: true })
  DATE_FIN_TRV: Date;

  @Column({ nullable: true })
  DATE_debut_TRV: Date;

  @Column({ nullable: true })
  NOTE_CLOTURE_ZM: string;

  @Column({ nullable: true })
  @Index()
  DATE_CLOTURE_ZM: Date;

  @ManyToOne(() => CompanyDelegation, { nullable: true })
  @JoinColumn({ name: 'company_delegation_id' })
  companyDelegation: CompanyDelegation | null;

  @ManyToOne(() => Company, { nullable: true })
  @JoinColumn({ name: 'company_id' })
  company: Company | null;

  // @ManyToOne(() => User, { nullable: true })
  // @JoinColumn({ name: 'company_id' })
  // technicien_company: User | null;

  @Column({ type: 'double precision', nullable: true })
  SLA_EQUIPE_FIXE: number | null;

  @Column({ type: 'double precision', nullable: true })
  SLA_STT: number | null;

  @Column({ type: 'double precision', nullable: true })
  TEMPS_MOYEN_AFFECTATION_STT: number | null;

  @Column({ type: 'double precision', nullable: true })
  TEMPS_MOYEN_PRISE_RDV: number | null;

  @OneToMany(() => Prod_imei, (prod_imei) => prod_imei.activation)
  Prod_imei: Prod_imei[];

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  last_sync: Date;

  @Column({ type: 'longblob', nullable: true })
  pdfFile: Buffer;

  @Column({ nullable: true })
  pdfMimeType: string;

  @Column({ type: 'double', default: 0 })
  SLARDV_Critique: number;

  @BeforeInsert()
  @BeforeUpdate()
  calculateSLAs() {
    this.normalizeDates();

    this.SLA_EQUIPE_FIXE = this.calcHoursDiff(
      this.OPENING_DATE_SUR_TIMOS,
      this.DATE_FIN_TRV,
    );

    this.SLA_STT = this.calcHoursDiff(
      this.DATE_AFFECTATION_STT,
      this.DATE_FIN_TRV,
    );

    this.TEMPS_MOYEN_AFFECTATION_STT = this.calcHoursDiff(
      this.OPENING_DATE_SUR_TIMOS,
      this.DATE_AFFECTATION_STT,
    );

    this.TEMPS_MOYEN_PRISE_RDV = this.calcHoursDiff(
      this.OPENING_DATE_SUR_TIMOS,
      this.DATE_PRISE_RDV,
    );
  }

  private normalizeDates() {
    const dateFields = [
      'DATE_CREATION_CRM',
      'OPENING_DATE_SUR_TIMOS',
      'DATE_AFFECTATION_STT',
      'DATE_PRISE_RDV',
      'DATE_FIN_TRV',
    ];

    dateFields.forEach((field) => {
      this[field] = this.parseDate(this[field]);
    });
  }

  private parseDate(date: any): Date | null {
    if (!date) return null;
    if (date instanceof Date) return date;
    const parsed = new Date(date);
    return isNaN(parsed.getTime()) ? null : parsed;
  }

  private calcHoursDiff(start: Date | null, end: Date | null): number | null {
    if (!start || !end) return null;

    const startTime = Math.min(start.getTime(), end.getTime());
    const endTime = Math.max(start.getTime(), end.getTime());

    const diffMs = endTime - startTime;
    return diffMs / 3_600_000;
  }
}
