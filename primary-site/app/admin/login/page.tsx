"use client";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function AdminLogin(){
  const router=useRouter();
  const [password,setPassword]=useState(""),[message,setMessage]=useState(""),[busy,setBusy]=useState(false);
  async function submit(event:FormEvent){event.preventDefault();setBusy(true);setMessage("");try{const response=await fetch("/api/admin/login",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({password})});const data=await response.json() as {error?:string};if(!response.ok)throw new Error(data.error);router.push("/admin");router.refresh();}catch(error){setMessage(error instanceof Error?error.message:"Could not sign in");}finally{setBusy(false);}}
  return <main className="shell"><section className="panel"><h1 className="headline">Admin sign in</h1><form onSubmit={submit} className="form-grid"><div className="field"><label htmlFor="password">Password</label><Input id="password" type="password" value={password} onChange={event=>setPassword(event.target.value)} required autoFocus/></div><Button type="submit" disabled={busy}>{busy?"Signing in…":"Sign in"}</Button></form>{message&&<p className="feedback error" role="status">{message}</p>}</section></main>;
}
