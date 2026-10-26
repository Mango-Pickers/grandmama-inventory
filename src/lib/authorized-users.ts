export const AUTHORIZED_USERS = {
  "inventory@mygrandmama.com": "inventory_officer",
  "manager@mygrandmama.com": "manager",
  "admin@mygrandmama.com": "administrator",
  "supervisor@mygrandmama.com": "supervisor",
} as const;

export type AppRole = (typeof AUTHORIZED_USERS)[keyof typeof AUTHORIZED_USERS];

export function getRoleForEmail(email: string | null | undefined): AppRole | null {
  if (!email) return null;
  return AUTHORIZED_USERS[email.trim().toLowerCase() as keyof typeof AUTHORIZED_USERS] ?? null;
}

export function getRoleLabel(role: AppRole): string {
  switch (role) {
    case "inventory_officer":
      return "Inventory Officer";
    case "manager":
      return "Manager";
    case "administrator":
      return "Administrator";
    case "supervisor":
      return "Supervisor";
  }
}