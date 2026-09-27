"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function RSVPForm() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [busy, setBusy] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy || submitted) return;
    setBusy(true);
    setMessage("");
    try {
      const response = await fetch("/api/reservations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fullName, email, phone }),
      });
      const data = await response.json() as { error?: string };
      if (!response.ok) throw new Error(data.error);
      setSubmitted(true);
      setError(false);
    } catch (cause) {
      setError(true);
      setMessage(cause instanceof Error ? cause.message : "Could not submit your reservation. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return <section className="rsvp-page">
    <section className="rsvp-card" aria-labelledby="reservation-title">
      <div className="kicker">Cindy &amp; Dorbor</div>
      <h1 id="reservation-title">Reserve your place</h1>
      <p>Traditional wedding · 30 January 2027 · 4:00 pm<br />Ellenbrook Community Centre Function Hall</p>
      <p className="subtle">Please reserve by 28 November 2026.</p>
      {submitted ? <div className="success-box" role="status">
        <p>Reservation submitted successfully.</p>
        <p>Your reservation is currently pending approval. Once your reservation has been approved, you will receive a confirmation email.</p>
        <p>Your seat number will be sent to you one week before the event.</p>
      </div> : <form onSubmit={submit}>
        <div className="field">
          <label htmlFor="reservation-name">Full Name</label>
          <Input id="reservation-name" name="fullName" autoComplete="name" value={fullName} onChange={event => setFullName(event.target.value)} maxLength={120} required />
        </div>
        <div className="field">
          <label htmlFor="reservation-email">Email Address</label>
          <Input id="reservation-email" name="email" type="email" autoComplete="email" value={email} onChange={event => setEmail(event.target.value)} maxLength={254} required />
        </div>
        <div className="field">
          <label htmlFor="reservation-phone">Phone Number</label>
          <Input id="reservation-phone" name="phone" type="tel" autoComplete="tel" value={phone} onChange={event => setPhone(event.target.value)} maxLength={50} required />
        </div>
        <Button className="rsvp-submit" type="submit" disabled={busy}>{busy ? "Submitting…" : "Submit Reservation"}</Button>
      </form>}
      {message && <div className={error ? "error-box" : "success-box"} role="alert">{message}</div>}
    </section>
  </section>;
}
