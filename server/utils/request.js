// Shared request helpers. Bodies are parsed once and cached on the Hono
// context so a validation middleware and the handler never read the stream
// twice (which would throw on the second read).

export const readBody = async (c) => {
  if (c.get("parsedBody") !== undefined) return c.get("parsedBody");
  const body = await c.req.json().catch(() => ({}));
  c.set("parsedBody", body);
  return body;
};

export default { readBody };