import { Company } from 'src/companies/entities/company.entity';
import { Stock } from 'src/stock/entities/stock.entity';
import { User } from 'src/users/entities/user.entity';
import { DataSource } from 'typeorm';

export const dataSource = new DataSource({
  type: 'mysql', // Type de base de données
  host: 'localhost', // Hôte de la base de données
  port: 3306, // Port de la base de données
  username: 'root', // Nom d'utilisateur
  password: '#Safa@123_#', // Mot de passe
  database: 'ooredoo', // Nom de la base de données
  entities: [User, Company, Stock], // Liste de toutes tes entités
  synchronize: false, // Evite la synchronisation automatique
  migrations: ['src/migration/**/*.ts'], // Où les migrations seront stockées
});
