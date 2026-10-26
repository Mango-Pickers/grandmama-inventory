import { describe, expect, it } from "vitest";

import { AUTHORIZED_USERS, getRoleForEmail } from "@/lib/authorized-users";

describe("authorized staff accounts", () => {
  it("allows only the four configured accounts and maps each to its role", () => {
    expect(Object.keys(AUTHORIZED_USERS)).toHaveLength(4);
    expect(getRoleForEmail("inventory@mygrandmama.com")).toBe("inventory_officer");
    expect(getRoleForEmail("manager@mygrandmama.com")).toBe("manager");
    expect(getRoleForEmail("admin@mygrandmama.com")).toBe("administrator");
    expect(getRoleForEmail("supervisor@mygrandmama.com")).toBe("supervisor");
  });

  it("normalizes case and whitespace but rejects every other address", () => {
    expect(getRoleForEmail("  MANAGER@MYGRANDMAMA.COM ")).toBe("manager");
    expect(getRoleForEmail("someone@example.com")).toBeNull();
    expect(getRoleForEmail(null)).toBeNull();
  });
});