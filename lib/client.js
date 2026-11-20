window.__ModuleLoader__.load({
	id: "dsh-plugin-provider-label",
	factory: (require) => {
		var module = { exports: {} };
		var exports = module.exports;
		Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
		const react = require("react");

		/** Chat label slot: the only place DSH lets a plugin replace the model caption text. */
		const SLOT = "conversation.input.model.label";
		/** Models-page provider-card extension area, declared by settings-models. */
		const PROVIDER_CARD_SLOT = "settings.models.provider-card";
		/** Settings namespaces whose provider cards get the colour control. */
		const PROVIDER_CARD_KEYS = ["llm-pi-ai", "llm-deepseek", "llm-deepseek-account"];
		/** Profile row id whose Settings config this plugin reads (see cordis.patch.yml). */
		const ENTRY_ID = "provider-label";
		/** Chip width cap, so a long display name still leaves room for the model name. */
		const CHIP_MAX_WIDTH = "13em";
		/** Longest label we render before clipping; keeps the composer row readable. */
		const CHIP_MAX_CHARS = 34;

		/** Locale namespace for the Models-page control's copy. */
		const LOCALE_NS = "provider-label";
		const LOCALE_DICTIONARY = {
			en: {
				labelColour: "Label colour",
				reset: "Reset",
				resetTitle: "Restore the colour derived from the provider id",
				colourAria: "Provider label colour for {provider}"
			},
			ru: {
				labelColour: "Цвет метки",
				reset: "Сбросить",
				resetTitle: "Вернуть цвет, вычисленный из id провайдера",
				colourAria: "Цвет метки провайдера {provider}"
			},
			zh: {
				labelColour: "标签颜色",
				reset: "重置",
				resetTitle: "恢复根据提供商 ID 推导的颜色",
				colourAria: "提供商标签颜色：{provider}"
			}
		};

		// ---- configuration ---------------------------------------------------
		// Read from the Host settings document via `configForms`. Provider ids map
		// to a colour and an optional label override; everything else falls back to
		// the provider display name and a colour derived from the provider id.
		let snapshot = {
			colors: {},
			labels: {},
			revision: void 0,
			writable: false
		};
		/** Live config form, so the Models-page control writes the same namespace. */
		let activeForm = null;
		const listeners = /* @__PURE__ */ new Set();

		function isDict(value) {
			return value !== null && typeof value === "object" && !Array.isArray(value);
		}

		function publish(next) {
			snapshot = next;
			for (const listener of [...listeners]) {
				try {
					listener();
				} catch {}
			}
		}

		function subscribe(listener) {
			listeners.add(listener);
			return () => {
				listeners.delete(listener);
			};
		}

		function getSnapshot() {
			return snapshot;
		}

		/** Fold one settings snapshot into the render store. */
		function adopt(form) {
			activeForm = form === void 0 ? null : form;
			const read = () => {
				let state;
				try {
					state = form.getSnapshot();
				} catch {
					state = void 0;
				}
				const value = state === void 0 ? void 0 : state.value;
				const colors = isDict(value) && isDict(value.colors) ? value.colors : {};
				const labels = isDict(value) && isDict(value.labels) ? value.labels : {};
				publish({
					colors,
					labels,
					revision: state === void 0 ? void 0 : state.revision,
					writable: state !== void 0 && state.writable === true
				});
			};
			read();
			let off;
			try {
				off = form.subscribe(read);
			} catch {
				off = void 0;
			}
			return () => {
				if (typeof off === "function") off();
			};
		}

		// ---- presentation ----------------------------------------------------
		/** Stable hue for a provider id, so two providers never look alike by accident. */
		function hueOf(id) {
			let hash = 0;
			for (const character of String(id)) hash = (hash * 31 + character.codePointAt(0)) % 360;
			return hash;
		}

		/**
		 * Border and background for a provider chip.
		 * @param id - provider id.
		 * @param colors - configured provider id -> CSS colour.
		 * @returns the two CSS colour values.
		 */
		function paletteOf(id, colors) {
			const custom = colors[id];
			if (typeof custom === "string" && custom.trim() !== "") {
				const color = custom.trim();
				return {
					border: color,
					background: `color-mix(in srgb, ${color} 16%, transparent)`
				};
			}
			const hue = hueOf(id);
			return {
				border: `hsl(${hue} 52% 46%)`,
				background: `hsl(${hue} 52% 46% / 0.15)`
			};
		}

		/** Chip text: an explicit override, else the provider display name. */
		function labelOf(provider, labels) {
			const custom = labels[provider.id];
			const text = typeof custom === "string" && custom.trim() !== "" ? custom.trim() : provider.name;
			const characters = [...text];
			return characters.length > CHIP_MAX_CHARS ? `${characters.slice(0, CHIP_MAX_CHARS - 1).join("")}…` : text;
		}

		function chip(text, palette) {
			return react.createElement(
				"span",
				{
					"data-provider-label-chip": text,
					style: {
						display: "inline-block",
						flex: "0 0 auto",
						maxWidth: CHIP_MAX_WIDTH,
						overflow: "hidden",
						textOverflow: "ellipsis",
						padding: "0 6px",
						borderRadius: "5px",
						border: `1px solid ${palette.border}`,
						background: palette.background,
						color: "inherit",
						fontSize: "10px",
						fontWeight: "600",
						lineHeight: "15px",
						letterSpacing: "0.015em",
						whiteSpace: "nowrap",
						verticalAlign: "middle"
					}
				},
				text
			);
		}

		/**
		 * Inline model caption: `<provider> <model>`. Non-interactive — the composer's
		 * selection controls stay owned by the model-selection plugin.
		 * @param props - slot owner props for one provider/model pair.
		 * @returns the caption content.
		 */
		function ProviderLabel({ provider, model, placement }) {
			const config = react.useSyncExternalStore(subscribe, getSnapshot);
			const palette = paletteOf(provider.id, config.colors);
			const badge = chip(labelOf(provider, config.labels), palette);
			const name = react.createElement(
				"span",
				{
					style: {
						overflow: "hidden",
						textOverflow: "ellipsis",
						whiteSpace: "nowrap"
					}
				},
				model.name
			);
			const children = placement === "trigger" ? [badge, name] : [name, badge];
			return react.createElement(
				"span",
				{
					"data-provider-id": provider.id,
					title: `${provider.name} — ${model.name}`,
					style: {
						display: "inline-flex",
						alignItems: "center",
						gap: "4px",
						minWidth: "0",
						maxWidth: "100%"
					}
				},
				...children
			);
		}

		/** `hsl` degrees/percent/percent to an `#rrggbb` value a color input accepts. */
		function hslToHex(hue, saturation, lightness) {
			const s = saturation / 100;
			const l = lightness / 100;
			const c = (1 - Math.abs(2 * l - 1)) * s;
			const x = c * (1 - Math.abs((hue / 60) % 2 - 1));
			const m = l - c / 2;
			let red = 0;
			let green = 0;
			let blue = 0;
			if (hue < 60) {
				red = c;
				green = x;
			} else if (hue < 120) {
				red = x;
				green = c;
			} else if (hue < 180) {
				green = c;
				blue = x;
			} else if (hue < 240) {
				green = x;
				blue = c;
			} else if (hue < 300) {
				red = x;
				blue = c;
			} else {
				red = c;
				blue = x;
			}
			const channel = (value) => Math.round((value + m) * 255).toString(16).padStart(2, "0");
			return `#${channel(red)}${channel(green)}${channel(blue)}`;
		}

		/**
		 * Convert any CSS colour to an `#rrggbb` value a color input accepts.
		 * Canvas normalises named colours, hsl() and rgb() the same way the host
		 * paints them; unparseable input returns undefined.
		 * @param value - CSS colour text.
		 * @returns lowercase hex colour, or undefined.
		 */
		function toHexColour(value) {
			const text = value.trim();
			if (/^#[0-9a-f]{6}$/i.test(text)) return text.toLowerCase();
			if (/^#[0-9a-f]{3}$/i.test(text)) {
				return `#${text[1]}${text[1]}${text[2]}${text[2]}${text[3]}${text[3]}`.toLowerCase();
			}
			try {
				if (typeof document === "undefined") return void 0;
				const canvas = document.createElement("canvas");
				canvas.width = 1;
				canvas.height = 1;
				const context = canvas.getContext("2d");
				if (context === null) return void 0;
				context.fillStyle = "#000000";
				context.fillStyle = text;
				const normalized = String(context.fillStyle);
				return /^#[0-9a-f]{6}$/i.test(normalized) ? normalized.toLowerCase() : void 0;
			} catch {
				return void 0;
			}
		}

		/**
		 * Models-page extension rendered inside every provider card of the given
		 * settings namespaces. Writes the plugin's own volatile `colors` config, so
		 * the composer chip reacts without a restart.
		 * @param props - provider-card owner props plus the locale `t` seat.
		 * @returns the colour row.
		 */
		function ProviderColorControl({ provider, t }) {
			const config = react.useSyncExternalStore(subscribe, getSnapshot);
			const providerId = provider === void 0 ? void 0 : provider.provider;
			if (providerId === void 0) return null;
			const translate = typeof t === "function"
				? t
				: (key, params) => {
					const copy = LOCALE_DICTIONARY.en[key] ?? key;
					return typeof params === "object" && params !== null
						? copy.replace("{provider}", String(params.provider ?? ""))
						: copy;
				};
			const custom = isDict(config.colors) ? config.colors[providerId] : void 0;
			const configured = typeof custom === "string" && custom.trim() !== "";
			const customHex = configured ? toHexColour(custom) : void 0;
			const value = customHex ?? hslToHex(hueOf(providerId), 52, 46);
			const writable = config.writable === true && activeForm !== null;
			const write = (operations) => {
				if (!writable) return;
				let revision = config.revision;
				try {
					revision = activeForm.getSnapshot().revision;
				} catch {}
				try {
					void activeForm.mutate(operations, revision);
				} catch {}
			};
			const label = translate("colourAria", { provider: provider.displayName ?? providerId });
			const currentHint = configured && customHex === void 0 ? ` — ${custom.trim()}` : "";
			return react.createElement(
				"div",
				{
					"data-provider-label-color": providerId,
					style: {
						display: "flex",
						alignItems: "center",
						gap: "8px",
						flexWrap: "wrap",
						marginTop: "8px"
					}
				},
				react.createElement(
					"span",
					{
						style: {
							fontSize: "11px",
							color: "var(--dsw-alias-label-secondary, inherit)"
						}
					},
					translate("labelColour")
				),
				react.createElement("input", {
					type: "color",
					value,
					onChange: (event) => write([{
						op: "set",
						path: ["colors", providerId],
						value: event.target.value
					}]),
					disabled: !writable,
					title: `${label}${currentHint}`,
					"aria-label": label,
					style: {
						width: "24px",
						height: "24px",
						padding: "0",
						border: "1px solid var(--dsw-alias-border-l1, rgba(127, 127, 127, 0.35))",
						borderRadius: "4px",
						background: "transparent",
						cursor: writable ? "pointer" : "default",
						opacity: writable ? "1" : "0.5"
					}
				}),
				configured && writable ? react.createElement(
					"button",
					{
						type: "button",
						onClick: () => write([{
							op: "unset",
							path: ["colors", providerId]
						}]),
						title: translate("resetTitle"),
						style: {
							font: "inherit",
							fontSize: "11px",
							color: "var(--dsw-alias-label-secondary, inherit)",
							background: "transparent",
							border: "none",
							padding: "0",
							cursor: "pointer"
						}
					},
					translate("reset")
				) : null
			);
		}

		/** Required services: the slot registry and the locale dictionaries it renders. */
		const inject = ["slots", "locale"];

		/**
		 * Register the caption and follow the Host settings document while the
		 * settings service is mounted; without it the defaults above still render.
		 * @param ctx - client root context.
		 */
		function apply(ctx) {
			ctx.effect(
				() => ctx.locale.register(LOCALE_NS, LOCALE_DICTIONARY),
				"provider-label: locale"
			);
			ctx.slots.inject(SLOT, () => ctx.slots.register({
				name: SLOT
			}, ProviderLabel));
			ctx.slots.inject(PROVIDER_CARD_SLOT, () => {
				const disposers = PROVIDER_CARD_KEYS.map((key) => ctx.slots.register({
					name: PROVIDER_CARD_SLOT,
					key,
					priority: 10,
					locale: LOCALE_NS
				}, ProviderColorControl));
				return () => {
					for (const dispose of disposers) dispose();
				};
			});
			ctx.inject(["configForms"], (scope) => scope.effect(() => {
				let dispose;
				try {
					dispose = adopt(scope.configForms.get(ENTRY_ID));
				} catch {
					dispose = void 0;
				}
				return () => {
					activeForm = null;
					if (typeof dispose === "function") dispose();
				};
			}, "provider-label: settings"));
		}

		exports.ProviderColorControl = ProviderColorControl;
		exports.ProviderLabel = ProviderLabel;
		exports.apply = apply;
		exports.inject = inject;
		return module.exports;
	}
});
