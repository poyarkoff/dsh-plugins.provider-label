/**
 * Host half of the provider-label plugin.
 *
 * The browser half (`lib/client.js`) owns the whole feature. This module only
 * has to be a valid Loader row — and to declare the Settings schema the browser
 * reads back through `ctx.configForms`, because client plugins receive no config
 * of their own: the boot graph carries `id/url/rev/inject/external` only.
 *
 * Both fields are `volatile()` so Settings exposes them as a live form and edits
 * apply without restarting the profile.
 */
import z from '@deepseek-ai/schemastery'

export const name = 'provider-label'

export const Config = z.object({
  /** Provider id -> CSS colour for that provider's chip. */
  colors: z.dict(z.string()).default({}).volatile(),
  /** Provider id -> chip text; defaults to the provider display name. */
  labels: z.dict(z.string()).default({}).volatile(),
})

export function apply() {}
