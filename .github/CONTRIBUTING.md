# Contributing to VRCX

Thank you for your interest in contributing to VRCX! Here are a few guidelines to help things go smoothly.

## Before You Start

- **Large changes require prior discussion.** If your PR involves significant new features, refactors, or architectural changes, please open an issue first to discuss the approach. PRs submitted without prior discussion may not be accepted.
- **Small fixes are always welcome.** Typo fixes, bug fixes, and minor improvements can be submitted directly.
- **UI-related PRs will most likely be declined.** To maintain a consistent and cohesive user interface, PRs that modify UI elements (layouts, styling, visual components, etc.) are generally not accepted. If you have a UI suggestion or improvement idea, please [Open an issue](https://github.com/vrcx-team/VRCX/issues/new) instead so we can discuss it with the team.

## Important Considerations

VRCX is used by a diverse, international community with users from many different countries and cultures. Because of this, we need to ensure that contributions are broadly applicable. Before submitting a PR, please consider:

- **Is this feature broadly useful and valuable?** Niche or low-value features increase maintenance burden without proportional benefits and may not be accepted.
- **Could it negatively impact other features?** Changes that interfere with or degrade existing functionality will not be merged.

Please think carefully about these factors before investing time in a contribution.

### Performance Design Baseline

VRCX is designed to perform well for users with **1,000 to 4,000 friends**. For any changes involving data operations, the design should be able to handle databases up to **8 GB** in size. Please keep these baselines in mind when implementing features or optimizations.

**PRs that do not follow these guidelines may be closed without review.**

## Looking for Something to Work On?

Check out issues labeled [`PR welcome`](https://github.com/vrcx-team/VRCX/issues?q=label%3A%22pr+welcome%22+is%3Aclosed) — these are contributions we'd love to see.

- These issues are listed under **Closed** issues, not Open, so make sure to check the closed tab. We keep them in Closed to avoid cluttering the Open issues list.
- You can link the issue in your PR, and once merged, we will mark the issue as completed.
- Even for `PR welcome` issues, if the change involves core functionality, please discuss it in the issue first.

## Submitting a Pull Request

1. Fork the repository and create your branch from `master`.
2. Make your changes and test them locally.
3. Open a pull request with a clear description of what you changed and why.

Thanks for helping make VRCX better!
