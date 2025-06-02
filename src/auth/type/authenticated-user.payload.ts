import { UserRole } from 'src/user/type/UserRole';

export interface AuthenticatedUserPayload {
  id: string;
  email: string;
  role: UserRole;
  name?: string | null;
}
