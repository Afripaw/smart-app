// utils/auth.js
export const hasRequiredRole = (userRole: string, requiredRoles: string[]) => {
  return requiredRoles.includes(userRole);
};
