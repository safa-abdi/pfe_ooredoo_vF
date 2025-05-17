// src/users/role.repository.ts
import { EntityRepository, Repository } from 'typeorm';
import { Role } from './entities/roles.entity';

@EntityRepository(Role)
export class RoleRepository extends Repository<Role> {}