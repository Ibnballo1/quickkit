export type QrGenerateInput =
  | { kind: "text"; text: string }
  | { kind: "url"; url: string }
  | {
      kind: "wifi";
      ssid: string;
      password: string;
      security: "WPA" | "WEP" | "nopass";
    }
  | { kind: "phone"; number: string }
  | { kind: "email"; address: string; subject: string };

export function buildQrPayload(input: QrGenerateInput): string {
  switch (input.kind) {
    case "text":
      return input.text;
    case "url":
      return /^https?:\/\//i.test(input.url)
        ? input.url
        : `https://${input.url}`;
    case "wifi":
      return `WIFI:T:${input.security};S:${input.ssid};P:${input.password};;`;
    case "phone":
      return `tel:${input.number}`;
    case "email": {
      const query = input.subject
        ? `?subject=${encodeURIComponent(input.subject)}`
        : "";
      return `mailto:${input.address}${query}`;
    }
  }
}
