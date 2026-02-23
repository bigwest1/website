import { NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { Resend } from "resend";
import { contactPayloadSchema } from "@/lib/schemas";

type RateEntry = {
  count: number;
  expiresAt: number;
};

const WINDOW_MS = 10 * 60 * 1000;
const MAX_REQUESTS_PER_WINDOW = 6;

const rateStore = globalThis.__contactRateStore ?? new Map<string, RateEntry>();

if (!globalThis.__contactRateStore) {
  globalThis.__contactRateStore = rateStore;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const existing = rateStore.get(ip);

  if (!existing || existing.expiresAt < now) {
    rateStore.set(ip, { count: 1, expiresAt: now + WINDOW_MS });
    return true;
  }

  if (existing.count >= MAX_REQUESTS_PER_WINDOW) {
    return false;
  }

  existing.count += 1;
  rateStore.set(ip, existing);
  return true;
}

function getClientIp(request: Request): string {
  const forwardedFor = request.headers.get("x-forwarded-for");

  if (!forwardedFor) {
    return "unknown";
  }

  return forwardedFor.split(",")[0]?.trim() || "unknown";
}

export async function POST(request: Request) {
  const requestId = randomUUID();

  let payload: unknown;

  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "validation_error" }, { status: 400 });
  }

  const parseResult = contactPayloadSchema.safeParse(payload);

  if (!parseResult.success) {
    return NextResponse.json({ ok: false, error: "validation_error" }, { status: 400 });
  }

  const { name, email, subject, message, website } = parseResult.data;

  if (website && website.length > 0) {
    return NextResponse.json({ ok: false, error: "spam_detected" }, { status: 400 });
  }

  const clientIp = getClientIp(request);

  if (!checkRateLimit(clientIp)) {
    return NextResponse.json({ ok: false, error: "spam_detected" }, { status: 429 });
  }

  const apiKey = process.env.RESEND_API_KEY;
  const fromAddress = process.env.CONTACT_FROM ?? "Jesse Westlund Portfolio <onboarding@resend.dev>";
  const toAddress = process.env.CONTACT_TO;

  if (!apiKey || !toAddress) {
    return NextResponse.json({ ok: false, error: "service_unavailable" }, { status: 503 });
  }

  const resend = new Resend(apiKey);

  const html = `
    <h2>New JesseWestlund.com Contact Submission</h2>
    <p><strong>Request ID:</strong> ${escapeHtml(requestId)}</p>
    <p><strong>Name:</strong> ${escapeHtml(name)}</p>
    <p><strong>Email:</strong> ${escapeHtml(email)}</p>
    <p><strong>Subject:</strong> ${escapeHtml(subject)}</p>
    <hr />
    <p>${escapeHtml(message).replace(/\n/g, "<br />")}</p>
  `;

  try {
    await resend.emails.send({
      from: fromAddress,
      to: [toAddress],
      replyTo: email,
      subject: `[Portfolio Contact] ${subject}`,
      html,
      text: `Request ID: ${requestId}\n\nName: ${name}\nEmail: ${email}\nSubject: ${subject}\n\n${message}`
    });

    return NextResponse.json({ ok: true, requestId });
  } catch {
    return NextResponse.json({ ok: false, error: "delivery_failed" }, { status: 500 });
  }
}
