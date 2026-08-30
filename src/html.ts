/* HTML rendering with escaping-by-default.
   Interpolations in the `html` tagged template are escaped unless explicitly
   wrapped in `raw()` - so forgetting is safe, not dangerous. */

const ESCAPES: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
};

export function escapeHtml(value: unknown): string {
  return String(value).replace(/[&<>"']/g, (c) => ESCAPES[c] as string);
}

export class Raw {
  constructor(public readonly value: string) {}
}

export const raw = (value: string): Raw => new Raw(value);

type Child = string | number | Raw | null | undefined | false | Child[];

function renderChild(child: Child): string {
  if (child == null || child === false) return '';
  if (child instanceof Raw) return child.value;
  if (Array.isArray(child)) return child.map(renderChild).join('');
  return escapeHtml(child);
}

export function html(strings: TemplateStringsArray, ...values: Child[]): Raw {
  let out = '';
  strings.forEach((part, i) => {
    out += part;
    if (i < values.length) out += renderChild(values[i]);
  });
  return new Raw(out);
}

/** JSON for a <script type="application/json"> data island.
    `<` is escaped so `</script>` inside user data cannot close the tag. */
export function jsonIsland(data: unknown): Raw {
  return new Raw(JSON.stringify(data).replace(/</g, '\\u003c'));
}
