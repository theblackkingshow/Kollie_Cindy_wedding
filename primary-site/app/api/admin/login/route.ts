import { adminSessionToken, jsonError, sameOrigin, validAdminPassword } from "@/lib/guests";

export async function POST(request:Request) {
  if (!sameOrigin(request)) return jsonError("Invalid request origin",403);
  let body:{password?:unknown};try {body=await request.json();} catch {return jsonError("Invalid request",400);}
  if (typeof body.password!=="string" || !validAdminPassword(body.password)) return jsonError("Incorrect password",401);
  const response=Response.json({ok:true});
  response.headers.append("Set-Cookie",`wedding_admin=${adminSessionToken()}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=604800`);
  return response;
}
