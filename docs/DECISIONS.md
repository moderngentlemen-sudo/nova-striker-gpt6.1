# Nova Striker Decisions and Proposals

This register records user direction and the choices still shaping the separate version. Approval of a work milestone does not automatically turn every draft mechanic or story invention into established canon.

## Recorded user direction

| Date | Direction | Effect |
| --- | --- | --- |
| 2026-09-29 | Begin an isolated fresh-start exercise, preserving the supplied foundations while planning first. | The existing project stays separate. The source brief establishes the initial baseline. |
| 2026-09-30 | Treat the prompt as a guideline and allow creative liberties that meaningfully improve graphics, gameplay, or the overall experience, with a check first. | Retained foundations may be revised through a concrete proposal explaining the benefit and tradeoff. Routine choices within an agreed direction do not need repeated approval. |
| 2026-09-30 | Use moderngentlemen-sudo/nova-striker-gpt6.1 for this version. | This repository is the destination for the separate version. |
| 2026-09-30 | Proceed after the proposed prototype-charter milestone. | Create the charter and initialize the repository with reviewable planning documents. |

## Provisional working assumptions

These make the charter concrete without claiming the user has decided them.

| Assumption | Why it is useful | Consequence if changed |
| --- | --- | --- |
| Solo uses one selected character, with changes at checkpoints or between acts. | Keeps encounters solo-complete and avoids an initial companion-AI project. | In-act switching or AI partners changes input, saves, encounter design, and testing. |
| Local/shared-screen play leads the prototype; launch online scope stays open. | Directly tests the retained one-to-four-player baseline. | Required launch online play introduces simulation ownership, synchronization, latency, lobby, reconnection, and platform-service work. |
| Windows leads development; Unity 6.3 LTS and URP are candidates. | Gives the first project a bounded compatibility and performance target. | Exact editor/package versions must be selected against actual tooling and target support. |
| Four playable launch characters are a planning target, not a commitment. | Represents Striker, Tank, and Support approaches without budgeting eight complete kits immediately. | Roster changes alter animation, balancing, encounter coverage, and production cost. |
| Team capacity, weekly availability, and budget are unknown. | Avoids fabricated staffing or delivery estimates. | Production scheduling needs actual capacity after prototype and slice evidence. |

## Consequential choices

| Choice | Recommendation | Needed by |
| --- | --- | --- |
| Solo character structure | One selected character with checkpoint changes. | Before campaign systems expand. |
| Online release requirement | Local first; decide online feasibility separately before full production if online is required at launch. | Before committing production architecture and schedule. |
| Team capacity and budget | Establish available people, weekly time, specialist access, and a budget ceiling. | Before estimating delivery dates or commissioning final assets. |
| Velocity Break behavior | Test deliberate dash braking, with no extra invulnerability or refunded air charge. | Before implementing that mechanic. |
| Bulwark Pulse and Echo suit behavior | Compare the charter's concrete candidates against the retained identities. | Before implementing their signature actions. |
| Nova and Echo placements | Compare together-team and separate-team arc outlines; leave ranks open. | Before locking the Academy and graduation script. |
| Wider conflict and technology limits | Explore preservation versus agency, with bounded memory and spatial technology. | Before writing the campaign outline. |
| Suit and Guardian progression | Keep suit identity stable; let Guardian powers add shared interactions. | Before producing the full progression system. |

## Handling a meaningful departure

Present the existing baseline, proposed change, expected player benefit, and production or continuity tradeoff. Identify the affected documents and give a recommendation. Check with the user before adopting the departure. Record the decision and update those documents together after it is made.

Temporary test values and asset substitutions should be labeled. They should not silently determine final story, costume, rank, or progression rules.

## Current evidence

The repository was reachable and empty when inspected on 2026-09-30. This initialization contains planning documents and a source snapshot. No Unity compilation, runtime behavior, human playtest, or target-hardware result has been recorded. Future evidence belongs in a dated report identifying the tested commit and build.

## Browser and cloud direction — 2026-09-30

The user requested a browser version first for testing, then required the development environment itself to be in the cloud and selected GitHub Codespaces + GitHub Actions. The existing browser draft was transferred to GitHub. Further implementation must occur in the Codespace; cloud tests/builds and Pages publishing run through Actions.

The draft exercises the charter's candidate movement and partial combat kits using temporary Canvas art. It does not approve these values or substitute art as permanent canon. Browser test coverage and unresolved features are recorded in BROWSER_PLAYTEST.md. Unity implementation remains pending, and the full validation matrix is not complete.