<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

- Use one reusable mobile media-capture component for operational evidence so camera behavior and previews remain consistent.
- Treat Microsoft 365 as the primary workforce identity; keep local password access only as a super-admin contingency path.
- Require an active profile and assigned role before protected routes; first-time institutional users remain pending.
- Bind browser sessions to one six-hour operational shift and sign out when the shift changes.
- Store extended visitor form data in the visit's JSON record and signatures as private evidence paths; this keeps the original access history compatible while linking signed checkout to its visit.
- Use a reusable signature-pad capture with touch-safe canvas sizing for handwritten operational signatures; this preserves strokes on tablet orientation changes.
- Store visit presentation settings as a validated JSON entry in integracoes_config and share its query across administration and check-in; this keeps options consistent without changing historical records.
- Render visit consultation through a read-only record component and resolve evidence paths with short-lived signed URLs; this keeps completed forms intact and evidence private.
- Keep InvGate credential construction in a server-only helper and use the shared ticket lookup for configuration tests; this keeps secrets out of browser code and exercises the operational request path.
