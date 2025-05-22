import { Company } from 'src/companies/entities/company.entity';
import { Stock } from 'src/stock/entities/stock.entity';
import { User } from 'src/users/entities/user.entity';
import { DataSource } from 'typeorm';

export const dataSource = new DataSource({
  type: 'mysql', // Type de base de données

  host: process.env.DB_HOST || 'localhost',
  port: 3306,
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME || 'ooredoo',
  entities: [User, Company, Stock],
  synchronize: false,
  migrations: ['src/migration/**/*.ts'],
});
