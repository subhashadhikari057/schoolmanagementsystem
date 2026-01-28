export function generateRandomPassword(length = 12): string {
  const charset =
    'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+-=';
  let password = '';
  for (let i = 0; i < length; i++) {
    password += charset.charAt(Math.floor(Math.random() * charset.length));
  }
  return password;
}

export const DEFAULT_STUDENT_PASSWORD = 'student123';
export const DEFAULT_PARENT_PASSWORD = 'parent123';
export const DEFAULT_TEACHER_PASSWORD = 'teacher123';
export const DEFAULT_STAFF_PASSWORD = 'staff123';
