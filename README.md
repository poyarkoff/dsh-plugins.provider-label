# dsh-plugin-provider-label

Shows which provider serves a model in the DeepSeek Harness model picker, so a
model available through several routes is unambiguous before sending.

```text
[Example Gateway (DeepSeek)] DeepSeek Flash
```

- Chip text: the provider `displayName` from Settings → Models (overridable).
- Colour: per provider, derived from its id by default (overridable).
- Placements: composer trigger (chip before the name), model menu and model rows
  (chip after the name).
- Non-interactive: the model-selection controls are untouched.

Tested with DSH `0.2.2-rc.1` (desktop, macOS).

## Install

Plugin Manager (recommended): **Settings → Plugins → Add plugin**, then one of:

- `git+https://github.com/poyarkoff/dsh-plugins.provider-label.git`
- local path `file:/absolute/path/to/provider-label` (saved as `link:`)

The package declares `dsh.bundle.patch`, so the row `provider-label` appears
after install. Reload the page (⌘R) if the chip does not appear.

Manual install without Plugin Manager:

```bash
cp -R provider-label ~/.dsh/profiles/desktop/plugins/provider-label
cat >> ~/.dsh/profiles/desktop/cordis.patch.yml <<'YAML'

- insert:
    - id: provider-label
      name: /Users/<you>/.dsh/profiles/desktop/plugins/provider-label/lib/index.js
      config:
        colors: {}
        labels: {}
YAML
```

The `name` path must be absolute. Restart DSH after editing.

## Configure

The `provider-label` row has two volatile fields; changes apply without restart.

```yaml
- id: provider-label
  name: dsh-plugin-provider-label
  config:
    colors:                    # provider id -> CSS colour
      example-gateway: "#18aa82"
      deepseek-official: "gray"
    labels:                    # provider id -> chip text
      example-gateway: "Gateway"
```

Defaults: colour derived from the provider id; text is the localized provider
`displayName`, clipped at 34 characters with the full name in the tooltip.

Each **Settings → Models** provider card has **Label colour** (picker + Reset).
It writes the same `colors` through the settings document, so the chip updates
live. Picker labels follow the UI language (en/ru/zh, fallback en). UI edits
land in the profile's `cordis.patch.yml`; a script that regenerates that patch
overwrites them.

## How it works

| File | Role |
| --- | --- |
| `lib/client.js` | Browser bundle: registers `conversation.input.model.label` and a `settings.models.provider-card` colour control; reads and writes config via `ctx.configForms.get('provider-label')`. |
| `lib/index.js` | Host half: empty `apply` plus `Config` (volatile `colors`/`labels` schema read by the browser). |
| `cordis.patch.yml` | Bundle patch: inserts the `provider-label` row. |

Config reaches the browser through the Host settings document, not the boot
graph (a client row carries only `id/url/rev/inject/external`).

Limitation: the slot replaces the catalog `model.badge`, so badges are not
rendered when set.

## Development

The profile installs this package as a bundle with a `link:` dependency. The
host half imports `@deepseek-ai/schemastery`, declared in `peerDependencies`
because DSH supplies installation packages to a linked package only for its
declared peers.

Checks: `node --check lib/client.js` and `node --check lib/index.js`. Keep the
client bundle `id` equal to the package `name`, and declare every host
`@deepseek-ai/*` import as a peer.

## Troubleshooting

| Symptom | Cause |
| --- | --- |
| No chip anywhere | Row `provider-label` is missing from the profile, or the client bundle is missing; the Host `client-modules` log names the package. |
| Chip ignores config | Row has no `config` or no `colors`/`labels`; the entry id must be `provider-label`. |
| Unexpected colour | The value is not a valid CSS colour, so the derived colour is used. |

## License

MIT
