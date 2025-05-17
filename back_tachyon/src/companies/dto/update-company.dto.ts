export class UpdateCompanyDto {
  name?: string;
  type?: 'societe_principale' | 'sous_traitant';
  adresse?: string;
  contact?: string;
  blocked?: boolean;
}
