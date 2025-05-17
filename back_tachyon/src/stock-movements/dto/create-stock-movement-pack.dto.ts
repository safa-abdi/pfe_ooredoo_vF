export class CreateStockMovementByPackDto {
  pack_id: number;
  quantity: number;
  N_Bon_Enlévement_DPM?: string;
  from_company_id: number;
  to_company_id: number;
  movement_type: 'DPM' | 'RDV' | 'transfert' | 'retour';
}
