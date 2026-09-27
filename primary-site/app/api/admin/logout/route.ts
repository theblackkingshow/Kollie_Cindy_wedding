import { jsonError, sameOrigin } from "@/lib/guests";

export async function POST(request:Request) {
  if (!sameOrigin(request)) return jsonError("Invalid request origin",403);
  const response=Response.json({ok:true});
  response.headers.append("Set-Cookie","wedding_admin=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0");
  return response;
}
