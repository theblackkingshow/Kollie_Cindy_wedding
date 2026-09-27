"use client";

import { useRef, useState } from "react";
import RSVPForm from "./rsvp/rsvp-form";
import "./invitation.css";

export default function Invitation() {
  const [opened, setOpened] = useState(false);
  const invitation = useRef<HTMLElement>(null);

  function openInvitation() {
    setOpened(true);
    requestAnimationFrame(() => {
      invitation.current?.focus({ preventScroll: true });
      window.scrollTo({ top: 0, behavior: "instant" });
    });
  }

  return <main className="wedding">
    <section className={`gate${opened ? " opened" : ""}`} aria-label="Traditional Wedding">
      <div className="gate-inner">
        <p className="eyebrow">Traditional Wedding</p>
        <h1>Cindy Migiro <span className="amp">&amp;</span>Dorbor Kollie</h1>
        <p className="date">30/01/2027</p>
        <button className="envelope-button" type="button" aria-label="Traditional Wedding" onClick={openInvitation}>
          <img src="/envelope.png" alt="" />
        </button>
      </div>
    </section>

    <section className={`invitation${opened ? " show" : ""}`} ref={invitation} tabIndex={-1} aria-label="Traditional Wedding">
      <article className="card">
        <p className="eyebrow">Traditional Wedding</p>
        <p className="event-date">30/01/2027</p>
        <h2>Cindy Migiro <span className="amp">&amp;</span>Dorbor Kollie</h2>
        <p className="nickname">Cecee &amp;Dee</p>
        <p className="intro">Warmly invite you to celebrate with them as their families and friends come together for their traditional wedding ceremony</p>
        <div className="rule" />
        <h3 className="section-title">Location</h3>
        <p className="place">Ellenbrook Community Centre Function Hall<br />11 Cashman Ave, Ellenbrook WA 6069<br />4pm</p>
        <div className="rule" />
        <h3 className="section-title">Dress code:</h3>
        <p className="detail">All  Men : african attire and a walking stick<br />All ladies: African attire with a gele or headtie.</p>
        <p className="note">NB:/ Strictly stick with the Dress code</p>
        <p className="detail"><a href="#rsvp-form">Reserve</a></p>
        <div className="rule" />
        <div className="faq">
          <h3 className="section-title">FAQs</h3>
          <h3>Can i bring someone?</h3>
          <p>We are only able to accommodate those guests formally invited by us .</p>
          <h3>Can i take pictures during the event?.</h3>
          <p>We love pictures!! But we’d love you to enjoy our ceremony without capturing moments on your phone.<br />We have hired a photographer and a videographer for the same.</p>
          <h3>Can i bring kids..</h3>
          <p>We love your little ones  however you can use this chance as a date night and escape the kids. if you choose to bring them please take full responsibility ♥️.</p>
        </div>
        <p className="closing">We can’t wait to celebrate with you!</p>
        <div id="rsvp-form"><RSVPForm /></div>
      </article>
    </section>
  </main>;
}
