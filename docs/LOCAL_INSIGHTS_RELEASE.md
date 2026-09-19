# VRCX Insights Preview

Unofficial Windows x64 preview based on **VRCX v2026.09.16**, upstream commit `1bf052f84c670b96bfe44156e097eb668ae78de7`. **Not a full Jirai port.**

Adds a local shared-session review: person selection, source-linked encounter timeline, completed observed-session duration, daily UTC bars, and observed co-presence ranking. Includes a synthetic demo and deterministic tests.

Uses only local GameLog encounters. No extra account polling, hidden-location inference, creator-as-participant assumptions or automatic group joining. Co-presence is not proof of interaction. Missing activity is unknown; total online time is not inferred.

Windows isolation: VRCX-Insights.exe, Program Files/VRCX-Insights, %APPDATA%/VRCX-Insights, own startup/uninstall/IPC identifiers and overlay endpoint. Does not import or replace official data or register the official URI handler. Upstream automatic updates are disabled; updates are manual.

The app and installer are **unsigned**. This is a **prerelease**, not a claim of completed real-account, Windows installation or VR acceptance testing. Publication is gated on analysis/adapter tests, mounted Vue tests, production frontend build, native Windows build and installer compilation.

The branch uses a reviewable integration script. The exact applied source diff is included with the assets. Follow the included test guide.

Exclusion is documented and applies to this feature, not all upstream logging or anyone else's software. No concealed agent instructions are included.
