// Single source of truth for the business WhatsApp contact.
// All current consumers (marketing footer, consulting page, credits page) are
// server components, so reading process.env here is safe. If a client
// component ever needs this, pass it down as a prop from a server component.
export const WHATSAPP_DISPLAY = process.env.WHATSAPP_NUMBER ?? "+91 92164 92174";

export const WHATSAPP_URL = `https://wa.me/${WHATSAPP_DISPLAY.replace(/\D/g, "")}`;
