import { NextResponse } from "next/server";
import { route } from "@/lib/api/handler";
import { openApiDocument } from "@/lib/openapi";

export const GET = route(async () => NextResponse.json(openApiDocument()));
