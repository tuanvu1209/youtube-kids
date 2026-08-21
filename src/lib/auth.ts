import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";

const SECRET = process.env.AUTH_SECRET ?? "kidtube-dev-secret-change-me";
export const SESSION_COOKIE = "kidtube_session";
export const KID_COOKIE = "kidtube_kid";
export const PIN_COOKIE = "kidtube_pin_ok";

export { hashPassword, verifyPassword } from "@/lib/password";

function sign(value: string) {
  return createHmac("sha256", SECRET).update(value).digest("hex");
}

export function makeToken(parentId: string) {
  return `${parentId}.${sign(parentId)}`;
}

export function readToken(token: string | undefined) {
  if (!token) return null;
  const idx = token.lastIndexOf(".");
  if (idx < 0) return null;
  const id = token.slice(0, idx);
  const sig = token.slice(idx + 1);
  const expected = sign(id);
  if (sig.length !== expected.length) return null;
  if (!timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) return null;
  return id;
}

export async function getSessionParentId() {
  const store = await cookies();
  return readToken(store.get(SESSION_COOKIE)?.value);
}

export async function getCurrentParent() {
  const id = await getSessionParentId();
  if (!id) return null;
  return prisma.parent.findUnique({ where: { id } });
}

/** Dùng trong server action: hết phiên thì đưa về trang đăng nhập thay vì ném lỗi 500. */
export async function requireParent() {
  const parent = await getCurrentParent();
  if (!parent) redirect("/parent/login");
  return parent;
}
