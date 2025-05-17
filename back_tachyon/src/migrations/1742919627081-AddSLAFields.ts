import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddSLAFields123456789 implements MigrationInterface {
  name = 'AddSLAFields123456789';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            ALTER TABLE activation
            ADD COLUMN IF NOT EXISTS sla_equipe_fixe DOUBLE PRECISION,
            ADD COLUMN IF NOT EXISTS sla_stt DOUBLE PRECISION,
            ADD COLUMN IF NOT EXISTS temps_moyen_affectation_stt DOUBLE PRECISION,
            ADD COLUMN IF NOT EXISTS temps_moyen_prise_rdv DOUBLE PRECISION,
            ADD COLUMN IF NOT EXISTS last_sync TIMESTAMP
        `);

    // Calcul initial pour les données existantes
    await queryRunner.query(`
            UPDATE activation SET 
                sla_equipe_fixe = EXTRACT(EPOCH FROM (date_fin_trv - opening_date_sur_timos))/3600,
                sla_stt = EXTRACT(EPOCH FROM (date_fin_trv - date_affectation_stt))/3600,
                temps_moyen_affectation_stt = EXTRACT(EPOCH FROM (date_affectation_stt - opening_date_sur_timos))/3600,
                temps_moyen_prise_rdv = EXTRACT(EPOCH FROM (date_prise_rdv - opening_date_sur_timos))/3600,
                last_sync = NOW()
            WHERE date_fin_trv IS NOT NULL
        `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            ALTER TABLE activation
            DROP COLUMN sla_equipe_fixe,
            DROP COLUMN sla_stt,
            DROP COLUMN temps_moyen_affectation_stt,
            DROP COLUMN temps_moyen_prise_rdv,
            DROP COLUMN last_sync
        `);
  }
}
