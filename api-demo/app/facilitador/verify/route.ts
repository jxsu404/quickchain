import { manejar } from "@/lib/facilitador";
export const dynamic = "force-dynamic";
export const POST = (req: Request) => manejar(req, "verify");
