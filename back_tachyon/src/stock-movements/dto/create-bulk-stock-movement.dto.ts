export class CreateBulkStockMovementDto {
  products: Array<{
    product_id: number;
    quantity: number;
  }>;
  from_company_id: number;
  to_company_id: number;
  N_Bon_Enlévement_DPM: string;
}
