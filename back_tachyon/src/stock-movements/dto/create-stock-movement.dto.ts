export class CreateStockMovementDto {
  product_id: number;
  from_company_id: number;
  to_company_id: number;
  movement_type: 'DPM' | 'RDV' | 'transfert' | 'retour';
  quantity: number;
  reference_doc: string;
  N_Bon_Enlévement_DPM?: string;

}
