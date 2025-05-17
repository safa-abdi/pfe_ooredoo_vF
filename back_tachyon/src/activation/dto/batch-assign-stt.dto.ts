export class BatchAssignSttDto {
  activationIds: string[];
  sttName: string;
  companyId: number;
  user?: {
    id: string;
    username: string;
  };
}
