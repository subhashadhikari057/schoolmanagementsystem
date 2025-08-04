import { useState } from 'react';
import { UserRole } from '@/types/user-role';

type User = {
  name: string;
  email: string;
  role: UserRole;
};

const users: User[] = [
  {
    name: 'Animesh Poudel',
    email: 'animesh@example.com',
    role: UserRole.SUPER_ADMIN,
  },
  { name: 'Peris Kc', email: 'peris@example.com', role: UserRole.TEACHER },
  { name: 'Asmit Shah', email: 'asmit@example.com', role: UserRole.STUDENT },
  { name: 'Nabin Poudel', email: 'nabin@example.com', role: UserRole.PARENT },
];

export function useAuth() {
  const [currentUserIndex] = useState(0);

  const User = users[currentUserIndex];
  const role = User.role;

  return { role, User };
}
