export const SUPER_ADMIN = "super_admin";
export const ADMIN = "admin";
export const TEACHER = "teacher";
export const STUDENT = "student";

/**
 * Strict role hierarchy: a key role implicitly satisfies every role it inherits.
 * `super_admin` is a superset of `admin`, so any gate that accepts `admin`
 * also accepts `super_admin` without having to list it explicitly.
 */
const ROLE_INHERITS = {
  [SUPER_ADMIN]: [ADMIN],
};

/** Every role a given role effectively holds (itself + everything it inherits). */
export const expandRole = (role) => [role, ...(ROLE_INHERITS[role] ?? [])];

/** True when `role` satisfies at least one of the allowed roles. */
export const hasRole = (role, allowed = []) => {
  if (!role) return false;

  const effective = expandRole(role);
  const required = Array.isArray(allowed) ? allowed : [allowed];

  return required.some((required_) => effective.includes(required_));
};

/** True for `admin` and anything above it in the hierarchy. */
export const isAdmin = (role) => hasRole(role, [ADMIN]);
