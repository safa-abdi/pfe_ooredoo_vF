export class CreateCompanyDto {
  name: string;
  type: 'societe_principale' | 'sous_traitant';
  adresse?: string;
  contact?: string;
}
