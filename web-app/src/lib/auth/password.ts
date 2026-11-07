import bcrypt from "bcryptjs";

const COST = 10;

let dummyHash: string | undefined;

export const hashPassword = (password: string) => bcrypt.hash(password, COST);

export function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

/** Spends the same time as a real check, so response timing does not reveal which emails exist. */
export async function burnPasswordCheck(password: string): Promise<void> {
  dummyHash ??= await bcrypt.hash("qualitylab-timing-guard", COST);
  await bcrypt.compare(password, dummyHash);
}
