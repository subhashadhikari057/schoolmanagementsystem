import { useState } from "react";

export type UserRole = 'Superadmin' | 'teacher' | 'student' | 'parent';

type User ={
    name : string;
    email: string;
    role : UserRole;
}

const users: User[] = [
     { name: 'Animesh Poudel', email: 'animesh@example.com', role: 'Superadmin' },
  { name: 'Peris Kc', email: 'peris@example.com', role: 'teacher' },
  { name: 'Asmit Shah', email: 'asmit@example.com', role: 'student' },
  { name: 'Nabin Poudel', email: 'nabin@example.com', role: 'parent' },
]

export function useAuth() {
 const [currentUserIndex, setCurrentUserIndex] = useState(0);

 const User = users[currentUserIndex];
 const role = User.role;

  return{role, User};
}
