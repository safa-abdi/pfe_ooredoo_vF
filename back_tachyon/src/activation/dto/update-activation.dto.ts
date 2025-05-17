import { Double } from 'typeorm';

export class UpdateActivationDto {
  crm_case: number;
  date_creation_crm: Date;
  latitude_site: Double;
  longitude_site: Double;
}
