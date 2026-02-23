"use client";

import { FormEvent, useMemo, useState } from "react";
import { trackPortfolioEvent } from "@/lib/analytics";

type FormStatus =
  | { state: "idle"; message: string }
  | { state: "pending"; message: string }
  | { state: "success"; message: string }
  | { state: "error"; message: string };

const initialStatus: FormStatus = { state: "idle", message: "" };

export function ContactForm() {
  const [status, setStatus] = useState<FormStatus>(initialStatus);
  const [message, setMessage] = useState("");

  const messageCount = useMemo(() => message.trim().length, [message]);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const form = event.currentTarget;
    const formData = new FormData(form);

    const payload = {
      name: String(formData.get("name") || ""),
      email: String(formData.get("email") || ""),
      subject: String(formData.get("subject") || ""),
      message: String(formData.get("message") || ""),
      website: String(formData.get("website") || "")
    };

    setStatus({ state: "pending", message: "Sending your message..." });

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      const result = await response.json();

      if (!response.ok || !result.ok) {
        setStatus({
          state: "error",
          message: "Something blocked delivery. Please try again or use LinkedIn/email directly."
        });
        trackPortfolioEvent("contact_submit_error", { status: response.status });
        return;
      }

      setStatus({ state: "success", message: "Message sent. Jesse will get back to you shortly." });
      trackPortfolioEvent("contact_submit_success", { requestId: result.requestId });
      form.reset();
      setMessage("");
    } catch {
      setStatus({
        state: "error",
        message: "Network issue detected. Please retry in a moment."
      });
      trackPortfolioEvent("contact_submit_error", { status: "network_error" });
    }
  }

  return (
    <form className="glass-card" style={{ padding: "1.2rem" }} onSubmit={onSubmit}>
      <p className="section-kicker">Contact Jesse</p>
      <h3 style={{ marginTop: 0 }}>Let’s Talk UX</h3>
      <p className="section-subtitle">Tell me about your product, your users, and where you need design momentum.</p>

      <div className="contact-grid">
        <div>
          <label htmlFor="name">Name</label>
          <input className="input" id="name" name="name" required />
        </div>
        <div>
          <label htmlFor="email">Email</label>
          <input className="input" id="email" name="email" type="email" required />
        </div>
      </div>

      <div style={{ marginTop: "0.8rem" }}>
        <label htmlFor="subject">Subject</label>
        <input className="input" id="subject" name="subject" required />
      </div>

      <div style={{ marginTop: "0.8rem" }}>
        <label htmlFor="message">Message</label>
        <textarea
          className="textarea"
          id="message"
          name="message"
          required
          onChange={(event) => setMessage(event.currentTarget.value)}
        />
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: "0.4rem" }}>
          <span className="badge">Interactive confidence cue: include project goals + timeline</span>
          <span>{messageCount} characters</span>
        </div>
      </div>

      <input
        type="text"
        name="website"
        tabIndex={-1}
        autoComplete="off"
        style={{ position: "absolute", left: "-9999px", opacity: 0 }}
        aria-hidden="true"
      />

      <button className="btn btn-primary" type="submit" disabled={status.state === "pending"} style={{ marginTop: "1rem" }}>
        {status.state === "pending" ? "Sending..." : "Send Message"}
      </button>

      {status.message ? (
        <p className="form-status" style={{ color: status.state === "error" ? "#b82626" : "#194f45", marginTop: "0.7rem" }}>
          {status.message}
        </p>
      ) : null}
    </form>
  );
}
