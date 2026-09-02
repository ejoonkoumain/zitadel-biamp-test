const BASE_DIRECTIVES: Record<string, string[]> = {
  "default-src": ["'self'"],
  "script-src": ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
  "connect-src": ["'self'"],
  "style-src": ["'self'", "'unsafe-inline'"],
  // @bwp-web/assets ships fonts and images as base64 data: URIs, and
  // biampTheme injects the @font-face rules through MuiCssBaseline. Without
  // this the Biamp theme renders with no background, no logo and fallback
  // fonts. Deliberately NOT added to script-src or object-src.
  "font-src": ["'self'", "data:"],
  "img-src": ["'self'", "data:"],
  "frame-ancestors": ["'none'"],
  "object-src": ["'none'"],
};

export interface CSPOptions {
  serviceUrl?: string;
  iframeOrigins?: string[] | null;
}

export function buildCSP(options: CSPOptions = {}): string {
  const directives: Record<string, string[]> = { ...BASE_DIRECTIVES };

  if (options.serviceUrl) {
    directives["img-src"] = [...directives["img-src"], options.serviceUrl];
    directives["font-src"] = [...directives["font-src"], options.serviceUrl];
  }

  if (options.iframeOrigins && options.iframeOrigins.length > 0) {
    directives["frame-ancestors"] = [...options.iframeOrigins];
  }

  return serializeCSP(directives);
}

function serializeCSP(directives: Record<string, string[]>): string {
  return Object.entries(directives)
    .map(([key, values]) => [key, ...values].join(" "))
    .join("; ");
}
