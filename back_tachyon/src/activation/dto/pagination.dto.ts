export class PaginationDto {
  page: number = 1;
  take: number = 10;

  get skip(): number {
    return (this.page - 1) * this.take;
  }
}
