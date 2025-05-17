// src/activation/dto/stats.dto.ts
export class ActivationStatsDto {
  stt: string;
  total: number;
  terminated: number;
  inProgress: number;
  abandoned: number;
}

export class PaginatedStatsDto {
  data: ActivationStatsDto[];
  meta: {
    total: number;
    page: number;
    last_page: number;
  };
}