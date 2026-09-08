export type ParsedQrContent =
  | { kind: "url"; url: string }
  | { kind: "wifi"; ssid: string; password: string; security: string }
  | { kind: "email"; address: string; subject?: string }
  | { kind: "contact"; name?: string; phone?: string; email?: string }
  | { kind: "text"; text: string };

function parseWifi(raw: string): ParsedQrContent | null {
  // WIFI:T:WPA;S:mynetwork;P:mypassword;;
  if (!raw.startsWith("WIFI:")) return null;
  const fields = raw.slice(5).split(";");
  let ssid = "";
  let password = "";
  let security = "nopass";
  for (const field of fields) {
    if (field.startsWith("S:")) ssid = field.slice(2);
    else if (field.startsWith("P:")) password = field.slice(2);
    else if (field.startsWith("T:")) security = field.slice(2);
  }
  return ssid ? { kind: "wifi", ssid, password, security } : null;
}

function parseVCard(raw: string): ParsedQrContent | null {
  if (!raw.includes("BEGIN:VCARD")) return null;
  const nameMatch = /FN:(.+)/i.exec(raw);
  const phoneMatch = /TEL[^:]*:(.+)/i.exec(raw);
  const emailMatch = /EMAIL[^:]*:(.+)/i.exec(raw);
  return {
    kind: "contact",
    name: nameMatch?.[1]?.trim(),
    phone: phoneMatch?.[1]?.trim(),
    email: emailMatch?.[1]?.trim(),
  };
}

function parseMailto(raw: string): ParsedQrContent | null {
  if (!raw.toLowerCase().startsWith("mailto:")) return null;
  const withoutScheme = raw.slice(7);
  const [address, query] = withoutScheme.split("?");
  const subjectMatch = query ? /subject=([^&]+)/i.exec(query) : null;
  return {
    kind: "email",
    address: decodeURIComponent(address ?? ""),
    subject: subjectMatch?.[1]
      ? decodeURIComponent(subjectMatch[1])
      : undefined,
  };
}

function isUrl(raw: string): boolean {
  return /^https?:\/\//i.test(raw);
}

export function parseQrContent(raw: string): ParsedQrContent {
  return (
    parseWifi(raw) ??
    parseVCard(raw) ??
    parseMailto(raw) ??
    (isUrl(raw) ? { kind: "url", url: raw } : null) ?? {
      kind: "text",
      text: raw,
    }
  );
}
