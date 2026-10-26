import { facilitador } from "@/lib/facilitador";
export const dynamic = "force-dynamic";
export const GET = () => Response.json(facilitador().getSupported());
