import { database, isAdmin, jsonError, sameOrigin } from "@/lib/guests";
export async function PATCH(request:Request,context:{params:Promise<{id:string}>}) {
  if (!(await isAdmin())) return jsonError("Admin access required",403);
  if (!sameOrigin(request)) return jsonError("Invalid request origin",403);
  const {id}=await context.params;
  let body:{name?:unknown;seats?:unknown;status?:unknown;attendees?:unknown}; try {body=await request.json();} catch {return jsonError("Invalid request",400);}
  try {
    const [old]=await database()`SELECT id,code,name,seats,status,attendees,updated_at FROM guests WHERE id=${id}` as Record<string,unknown>[];
    if (!old) return jsonError("Guest not found",404);
    const name=body.name===undefined?String(old.name):typeof body.name==="string"?body.name.trim().replace(/\s+/g," "):"";
    const seats=body.seats===undefined?Number(old.seats):Number(body.seats);
    const status=body.status===undefined?String(old.status):body.status;
    const attendees=body.attendees===undefined?(status==="yes"?Math.max(1,Number(old.attendees)):0):Number(body.attendees);
    if (!name || name.length>100 || !Number.isInteger(seats) || seats<1 || seats>20 || !["pending","yes","no"].includes(String(status)) || !Number.isInteger(attendees) || attendees<0 || attendees>seats || (status==="yes" && attendees<1) || (status!=="yes" && attendees!==0)) return jsonError("Check the name, seats and response",400);
    const now=new Date().toISOString();
    await database()`UPDATE guests SET name=${name},seats=${seats},status=${String(status)},attendees=${attendees},updated_at=${now} WHERE id=${id}`;
    return Response.json({guest:{...old,name,seats,status,attendees,updated_at:now}},{headers:{"Cache-Control":"no-store"}});
  } catch(e) {console.error("Guest update failed",e);return jsonError("Could not update this guest. Please try again.",503);}
}
