import { Double } from 'typeorm';

export class CreateActivationDto {
  crm_case: number;
  date_creation_crm: Date;
  latitude_site: Double;
  longitude_site: Double;
}
