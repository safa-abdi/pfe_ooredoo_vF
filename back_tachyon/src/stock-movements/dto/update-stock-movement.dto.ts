export class UpdateStockMovementDto {
  product_id?: number;
  from_company_id?: number;
  to_company_id?: number;
  movement_type?: 'achat' | 'vente' | 'transfert' | 'retour';
  quantity?: number;
  reference_doc?: string;
  etat?: number;
}
