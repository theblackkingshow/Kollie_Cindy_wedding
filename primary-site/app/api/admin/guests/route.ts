import { database, isAdmin, jsonError, newCode, sameOrigin } from "@/lib/guests";
export const runtime="edge";
export async function GET() {
  if (!(await isAdmin())) return jsonError("Admin access required",403);
  try { const result=await database().prepare("SELECT id,code,name,seats,status,attendees,updated_at FROM guests ORDER BY name COLLATE NOCASE").all(); return Response.json({guests:result.results},{headers:{"Cache-Control":"no-store"}}); }
  catch(e) {console.error("Guest list unavailable",e);return jsonError("Guest list unavailable. Please try again.",503);}
}
export async function POST(request:Request) {
  if (!(await isAdmin())) return jsonError("Admin access required",403);
  if (!sameOrigin(request)) return jsonError("Invalid request origin",403);
  let body:{name?:unknown;seats?:unknown}; try {body=await request.json();} catch {return jsonError("Invalid request",400);}
  const name=typeof body.name==="string"?body.name.trim().replace(/\s+/g," "):"";
  const seats=Number(body.seats);
  if (!name || name.length>100 || !Number.isInteger(seats) || seats<1 || seats>20) return jsonError("Enter a name and 1–20 seats",400);
  const id=crypto.randomUUID(),code=newCode(),now=new Date().toISOString();
  try {await database().prepare("INSERT INTO guests (id,code,name,seats,status,attendees,updated_at) VALUES (?,?,?,?,?,?,?)").bind(id,code,name,seats,"pending",0,now).run();return Response.json({guest:{id,code,name,seats,status:"pending",attendees:0,updated_at:now}},{status:201,headers:{"Cache-Control":"no-store"}});}
  catch(e) {console.error("Guest create failed",e);return jsonError("Could not save this guest. Please try again.",503);}
}
