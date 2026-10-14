# Login icons

Steam, Meta, Apple, Discord and QR paths come from the existing
[Remix Icon](https://github.com/Remix-Design/RemixIcon) dependency:
`steam-fill`, `meta-fill`, `apple-fill`, `discord-fill` and `qr-code-line`.
Their paths are unchanged; the viewBoxes remove internal whitespace to center
the marks within a shared icon frame.

`google-gradient.svg` comes from Google's
[official sign-in asset archive](https://developers.google.com/static/identity/images/signin-assets.zip),
linked by the [branding guidelines](https://developers.google.com/identity/branding-guidelines).
The archive path is
`Android + Web/SVG/Neutral/Theme=Neutral, Show text=No, Shape=Square, Platform=Android+Web.svg`.
Only the button backdrop and outer whitespace are removed. The paths, mask,
filters and gradient colors are preserved. `ProviderLogo.vue` renders it inline
to support its `foreignObject` conic gradient and prefixes IDs per instance to
isolate masks and filters. No remote image is fetched at runtime.
