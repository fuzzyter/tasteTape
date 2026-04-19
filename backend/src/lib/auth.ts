import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { customAlphabet } from "nanoid";

const SALT_ROUNDS = 10;

export function getJwtSecret(): string {
  const s = process.env.JWT_SECRET;
  if (!s) throw new Error("JWT_SECRET is not set");
  return s;
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export type JwtPayload = { sub: string; email: string };

export function signToken(payload: JwtPayload): string {
  return jwt.sign(payload, getJwtSecret(), { expiresIn: "30d" });
}

export function verifyToken(token: string): JwtPayload {
  const decoded = jwt.verify(token, getJwtSecret()) as JwtPayload;
  return decoded;
}

const friendCodeAlphabet = customAlphabet(
  "23456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz",
  16
);

export function generateFriendCode(): string {
  return friendCodeAlphabet();
}
