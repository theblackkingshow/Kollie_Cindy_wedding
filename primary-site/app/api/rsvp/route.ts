import { database, jsonError, sameOrigin } from "@/lib/guests";
const CODE=/^[a-f0-9]{32}$/;
export async function GET(request:Request) {
  const code=new URL(request.url).searchParams.get("code")?.trim().toLowerCase()??"";
  if (!CODE.test(code)) return jsonError("Enter the invitation code you received",400);
  try {const [guest]=await database()`SELECT name,seats,status,attendees FROM guests WHERE code=${code}`;if (!guest) return jsonError("We could not find this invitation code",404);return Response.json({guest},{headers:{"Cache-Control":"no-store"}});}
  catch(e) {console.error("RSVP lookup failed",e);return jsonError("Reservations are temporarily unavailable",503);}
}
export async function POST(request:Request) {
  if (!sameOrigin(request)) return jsonError("Invalid request origin",403);
  let body:{code?:unknown;status?:unknown;attendees?:unknown};try {body=await request.json();} catch {return jsonError("Invalid request",400);}
  const code=typeof body.code==="string"?body.code.trim().toLowerCase():"";const status=body.status;const attendees=Number(body.attendees);
  if (!CODE.test(code) || !["yes","no"].includes(String(status)) || !Number.isInteger(attendees)) return jsonError("Check your response",400);
  try {
    const [guest]=await database()`SELECT name,seats FROM guests WHERE code=${code}` as {name:string;seats:number}[];
    if (!guest) return jsonError("We could not find this invitation code",404);
    if (status==="yes" ? attendees<1 || attendees>guest.seats : attendees!==0) return jsonError(`Choose up to ${guest.seats} attending`,400);
    await database()`UPDATE guests SET status=${String(status)},attendees=${attendees},updated_at=${new Date().toISOString()} WHERE code=${code}`;
    return Response.json({ok:true,name:guest.name,status},{headers:{"Cache-Control":"no-store"}});
  } catch(e) {console.error("RSVP save failed",e);return jsonError("Could not save your response. Please try again.",503);}
}
