"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { Reservation, ReservationStatus } from "@/lib/reservations";

type Filter = "all" | ReservationStatus;
type ContactDraft = { fullName: string; email: string; phone: string };
type Update = { status?: ReservationStatus; seatNumber?: string | null; fullName?: string; email?: string; phone?: string };

function submittedDate(value: string | null) {
  return value ? new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short", timeZone: "Australia/Perth" }).format(new Date(value)) : "—";
}

export default function Dashboard() {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState(false);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [editing, setEditing] = useState<string | null>(null);
  const [contactDraft, setContactDraft] = useState<ContactDraft>({ fullName: "", email: "", phone: "" });
  const [seatDrafts, setSeatDrafts] = useState<Record<string, string>>({});

  function flash(text: string, isError = false) {
    setMessage(text);
    setError(isError);
  }

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const response = await fetch("/api/admin/reservations", { cache: "no-store" });
        const data = await response.json() as { error?: string; reservations: Reservation[] };
        if (!response.ok) throw new Error(data.error);
        if (!cancelled) setReservations(data.reservations);
      } catch (cause) {
        if (!cancelled) flash(cause instanceof Error ? cause.message : "Could not load reservations", true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void load();
    return () => { cancelled = true; };
  }, []);

  async function update(reservation: Reservation, change: Update) {
    setBusyId(reservation.id);
    flash("");
    try {
      const response = await fetch(`/api/admin/reservations/${encodeURIComponent(reservation.id)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(change),
      });
      const data = await response.json() as { error?: string; reservation: Reservation };
      if (!response.ok) throw new Error(data.error);
      setReservations(current => current.map(item => item.id === reservation.id ? data.reservation : item));
      setEditing(null);
      if (data.reservation.confirmationEmailError && change.status === "approved") {
        flash(`Reservation approved, but confirmation email failed: ${data.reservation.confirmationEmailError}`, true);
      } else {
        flash(change.status === "approved" ? "Reservation approved." : change.status === "rejected" ? "Reservation declined." : "Reservation updated.");
      }
    } catch (cause) {
      flash(cause instanceof Error ? cause.message : "Could not update reservation", true);
    } finally {
      setBusyId(null);
    }
  }

  async function retryEmail(reservation: Reservation, type: "confirmation" | "seat") {
    setBusyId(reservation.id);
    flash("");
    try {
      const response = await fetch(`/api/admin/reservations/${encodeURIComponent(reservation.id)}/email`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type }),
      });
      const data = await response.json() as { error?: string; reservation: Reservation; sent?: boolean };
      if (!response.ok) throw new Error(data.error);
      setReservations(current => current.map(item => item.id === reservation.id ? data.reservation : item));
      flash(data.sent ? "Email sent." : "Email delivery failed. The failure has been recorded.", !data.sent);
    } catch (cause) {
      flash(cause instanceof Error ? cause.message : "Could not retry email", true);
    } finally {
      setBusyId(null);
    }
  }

  function startEdit(reservation: Reservation) {
    setEditing(reservation.id);
    setContactDraft({ fullName: reservation.fullName, email: reservation.email, phone: reservation.phone });
  }

  const shown = useMemo(() => reservations.filter(reservation => {
    const matchesFilter = filter === "all" || reservation.status === filter;
    const search = query.trim().toLowerCase();
    return matchesFilter && (!search || `${reservation.fullName} ${reservation.email} ${reservation.phone}`.toLowerCase().includes(search));
  }), [reservations, filter, query]);
  const pending = reservations.filter(reservation => reservation.status === "pending").length;
  const approved = reservations.filter(reservation => reservation.status === "approved").length;
  const rejected = reservations.filter(reservation => reservation.status === "rejected").length;

  return <main className="shell">
    <header className="topbar">
      <div className="brand"><span className="monogram">C&amp;D</span><div><div className="brand-title">Cindy &amp; Dorbor</div><div className="brand-small">Wedding reservations</div></div></div>
      <a className="toplink" href="/rsvp">Guest reservation page</a>
    </header>
    <div className="intro-row"><div><div className="kicker">Saturday · 30 January 2027</div><h1 className="headline">Reservations</h1><p className="subtle">Review guest requests, manage seats, and monitor email delivery.</p></div></div>
    <div className="metrics" aria-label="Reservation summary">
      <div className="metric"><p className="metric-label">Total</p><p className="metric-number">{reservations.length}</p></div>
      <div className="metric"><p className="metric-label">Pending</p><p className="metric-number">{pending}</p></div>
      <div className="metric"><p className="metric-label">Approved</p><p className="metric-number">{approved}</p></div>
      <div className="metric"><p className="metric-label">Declined</p><p className="metric-number">{rejected}</p></div>
    </div>
    <section className="panel" aria-labelledby="reservations-title">
      <div className="list-head">
        <div><h2 className="panel-title" id="reservations-title">Guest reservations</h2><p className="subtle">{shown.length} of {reservations.length} shown</p></div>
        <div className="list-tools"><Input className="filter" aria-label="Search reservations" placeholder="Search guests" value={query} onChange={event => setQuery(event.target.value)} /></div>
      </div>
      <div className="inline-actions" role="group" aria-label="Filter reservations">
        {(["all", "pending", "approved", "rejected"] as Filter[]).map(value => <Button key={value} size="sm" variant={filter === value ? "default" : "outline"} onClick={() => setFilter(value)}>{value === "all" ? "All" : value[0].toUpperCase() + value.slice(1)}</Button>)}
      </div>
      <p className={`feedback ${error ? "error" : ""}`} role="status">{message}</p>
      {loading ? <p className="empty">Loading reservations…</p> : shown.length === 0 ? <p className="empty">{reservations.length === 0 ? "No reservations yet." : "No reservations match this view."}</p> : <div className="table-wrap">
        <Table>
          <TableHeader><TableRow><TableHead>Guest</TableHead><TableHead>Status</TableHead><TableHead>Date submitted</TableHead><TableHead>Approval date</TableHead><TableHead>Seat</TableHead><TableHead>Email status</TableHead><TableHead>Actions</TableHead></TableRow></TableHeader>
          <TableBody>{shown.map(reservation => <TableRow key={reservation.id}>
            <TableCell>
              {editing === reservation.id ? <div className="edit-grid">
                <Input aria-label="Full name" value={contactDraft.fullName} maxLength={120} onChange={event => setContactDraft(current => ({ ...current, fullName: event.target.value }))} />
                <Input aria-label="Email address" type="email" value={contactDraft.email} maxLength={254} onChange={event => setContactDraft(current => ({ ...current, email: event.target.value }))} />
                <Input aria-label="Phone number" type="tel" value={contactDraft.phone} maxLength={50} onChange={event => setContactDraft(current => ({ ...current, phone: event.target.value }))} />
              </div> : <><div className="guest-name">{reservation.fullName}</div><div>{reservation.email}</div><div className="subtle">{reservation.phone}</div></>}
            </TableCell>
            <TableCell><span className={`pill ${reservation.status}`}>{reservation.status}</span></TableCell>
            <TableCell>{submittedDate(reservation.createdAt)}</TableCell>
            <TableCell>{submittedDate(reservation.approvedAt)}</TableCell>
            <TableCell><div className="edit-grid"><Input aria-label={`Seat number for ${reservation.fullName}`} value={seatDrafts[reservation.id] ?? reservation.seatNumber ?? ""} placeholder="Unassigned" maxLength={32} disabled={reservation.status !== "approved"} onChange={event => setSeatDrafts(current => ({ ...current, [reservation.id]: event.target.value }))} /><button className="small-btn" disabled={busyId !== null || reservation.status !== "approved" || (seatDrafts[reservation.id] ?? reservation.seatNumber ?? "") === (reservation.seatNumber ?? "")} onClick={() => void update(reservation, { seatNumber: seatDrafts[reservation.id]?.trim() || null })}>Save seat</button></div></TableCell>
            <TableCell>
              <div>Confirmation: {reservation.confirmationEmailSent ? `Sent ${submittedDate(reservation.confirmationEmailSentAt)}` : reservation.confirmationEmailError ? `Failed: ${reservation.confirmationEmailError}` : "Not sent"}</div>
              {!reservation.confirmationEmailSent && reservation.status === "approved" && <button className="small-btn" disabled={busyId !== null} onClick={() => void retryEmail(reservation, "confirmation")}>Retry confirmation</button>}
              <div>Seat email: {reservation.seatEmailSent ? `Sent ${submittedDate(reservation.seatEmailSentAt)}` : reservation.seatEmailError ? `Failed: ${reservation.seatEmailError}` : "Not sent"}</div>
              {!reservation.seatEmailSent && reservation.seatEmailError && <button className="small-btn" disabled={busyId !== null} onClick={() => void retryEmail(reservation, "seat")}>Retry seat email</button>}
            </TableCell>
            <TableCell><div className="inline-actions">
              {editing === reservation.id ? <>
                <button className="small-btn" disabled={busyId !== null} onClick={() => void update(reservation, contactDraft)}>Save details</button>
                <button className="small-btn" onClick={() => setEditing(null)}>Cancel</button>
              </> : <>
                <button className="small-btn" disabled={busyId !== null} onClick={() => startEdit(reservation)}>Edit details</button>
                {reservation.status === "pending" && <>
                  <button className="small-btn" disabled={busyId !== null} onClick={() => void update(reservation, { status: "approved" })}>Approve</button>
                  <button className="small-btn" disabled={busyId !== null} onClick={() => void update(reservation, { status: "rejected" })}>Decline</button>
                </>}
              </>}
            </div></TableCell>
          </TableRow>)}</TableBody>
        </Table>
      </div>}
    </section>
  </main>;
}
