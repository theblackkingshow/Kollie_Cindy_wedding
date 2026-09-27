import { redirect } from "next/navigation";

export default async function RSVPPage({searchParams}: {searchParams: Promise<{code?: string}>}) {
  const {code} = await searchParams;
  const destination = "https://cindy-dorbor-rsvp.migiromark173.chatgpt.site/rsvp";
  redirect(code && /^[a-f0-9]{32}$/.test(code) ? `${destination}?code=${code}` : destination);
}
