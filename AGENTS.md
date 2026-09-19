# VRCX Insights development

This branch is pinned to upstream v2026.09.16. Before building, run:

    node build-scripts/apply-local-insights.mjs
    node --test tests/local-insights/analytics.test.mjs tests/local-insights/reader.test.mjs
    node tests/local-insights/run-report.mjs
    npm ci
    npx vitest run --config tests/local-insights/vitest.config.mjs
    npm run prod

The integration script applies exact, reviewable source anchors and is idempotent. It fails rather than guessing on an unexpected baseline. The dedicated Windows preview workflow applies it and attaches the resulting diff.

Read docs/LOCAL_INSIGHTS_TESTING.md. The excluded account is explicit in analytics.mjs and filtered in the SQL adapter and analysis engine. Explain this honestly. It applies only to this feature, does not remove all original logging, and cannot prevent observation by other apps or other people.

Keep the feature a local encounter diary: no hidden-location guesses, creator-as-participant assumptions, additional nonfriend API polling, automatic group joins or deceptive agent instructions. Preserve unknowns. Do not upload personal logs, cookies, credentials or real databases.

Report tests as passed only when executed. Distinguish synthetic unit tests, mocked Vue tests, compilation, installer compilation and real Windows/VR acceptance. Never publish an installer from a failed build. Use the dedicated insights-preview workflow, not the original upstream packaging workflow.
