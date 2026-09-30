# Browser playtest 02

## Implemented coverage

- Four direct-select simulation rooms: Skyport, Movement, Combat, Ascent.
- Running, crouch/slide, double jump, wall slide/jump/cling, directional dash, and Velocity Break without added invulnerability or refunded air dash.
- Nova quick/charged forearm shots and a forward Bulwark Pulse; Echo melee chains, limited ranged fire, and a target-dependent pursuit tether.
- Temporary Tank/Support rigs, shield armor, projectile and melee startup cues, perfect parry reflection, unblockables, stagger, and capped cooperative Sync extensions.
- One-to-four actor simulation, bounded shared camera, spread recovery, downed recovery, revive, defeat, and checkpoint retry.
- Two keyboard layouts, standard gamepad mapping, optional shoulder jump preset, aim assistance, pause on focus loss, and a controller-disconnect pause path.
- Live squad changes with stable player slots, clear-platform joins, departure without restarting, and device reassignment. Existing encounter progress and resources persist; returning slots retain health/downed state and cooldowns. Character changes have a separate explicit restart action.
- Controller disconnect/replacement messages identify affected players. Reconnection keeps the game paused until Resume; held action buttons require release before acting again. Co-op device choices can refresh without closing the panel.
- Procedural Canvas characters and a layered Skyport backdrop; optional synthesized sound; impact effects toggle; local JSON report export.

## Evidence recorded on 2026-09-30

The transferred browser draft is commit `0c7a9c9`. Before the cloud-workspace direction, Node 24.19.0 locally passed 22 simulation tests, syntax checks, and standalone-bundle parsing. Browser inspection confirmed Nova/Echo selection, deployment, room selection, pause/resume, controls/settings, and four separately labeled actor HUDs. No browser warning/error appeared during those checks.

The cloud workflow repeats tests and builds on Ubuntu/Node 24, then publishes the browser files. Its actual run result is the authoritative cloud evidence; the initial local result is not evidence that a Codespace is running.

Tests cover collisions, jump resources, wall jump, crouch clearance, dash braking, distinct ranged damage, Pulse exclusions, perfect parry, unblockables, swept projectile collision, tether visibility, solo Support recovery, independent actors, bounded camera recovery, revive, fall recovery, defeat, checkpoint snapshots, objective completion logic, per-device controller edges, and a 35-second bounded four-actor simulation.

The session-recovery pass was implemented in the ChatGPT Work remote Linux workspace after Jason authorized foregoing Codespaces for now. Node v24.19.0 passed the original 22 tests plus 17 new session tests, and standalone generation passed. New tests cover atomic squad updates, preserved encounter state, stable slots/projectile ownership, safe joins with distinct positions, checkpoint/beacon boundaries, returning downed players, explicit character restart, completed attempts, controller identity and held-button recovery, dialog pause ownership, and consecutive downed episodes. These are deterministic simulation and synthetic-device checks.

The deployed Playtest 02 interface was inspected after the successful Actions run for `3de7183`. Adding P2–P4 preserved the displayed room timer and existing player state. Removing P1 and assigning its keyboard to P2 preserved P2–P4 labels and recorded the departure/device change. Attempting a live character swap kept the dialog open with the explicit restart instruction. Inspection also found overlapping positions for simultaneous joins; the follow-up fix reserves distinct positions and adds a regression test. Browser observations do not establish physical controller behavior or human co-op quality.

The objective test places actors at the goal and clears threats programmatically. It validates completion logic, not a full human solo clear. Synthetic controller objects and simulated allies do not verify real controller latency or four-person coordination.

## Limits and next playtest

Use a desktop browser with keyboard/mouse or standard controllers. No touch input or online multiplayer is implemented. The role rigs have no approved character identities. Final reference images have not been supplied. Slopes, a Guardian interaction, full suit transformations, remappable controls, and production animation remain open.

Squad editing pauses the session. Apply squad changes preserves the current encounter and waits for Resume. New/returning players require a grounded surviving teammate on a clear platform; a rejected change leaves the whole session untouched. Slots keep their previous character and state until an explicit restart/checkpoint retry. Enemy composition stays fixed during live changes; attack scheduling follows active party size. A disconnected controller can be reconnected, reassigned, or its slot removed. Identical controller models can expose the same browser ID, so identity checks are not proof of physical device identity.

Start in Movement to judge acceleration, jump landings, wall routes, and dash braking. Compare Nova and Echo in Combat, then try the Skyport objective with each alone. Use two-to-four actual players for camera spread, revives, and horizontal/vertical coordination. Report missed inputs and readable/unreadable threats, not only completion time.

Export report downloads JSON locally and sends nothing to a telemetry service. Gameplay counters cover the current room attempt and checkpoint retries. Rendering samples cover active gameplay across the browser session, including earlier rooms. Frame intervals include browser scheduling and are not GPU timings or controller-to-photon measurements. No target-hardware performance claim is established.

Reports include zero-based player slots, join/departure/device-change counters, and the last 100 roster changes with their simulation times. They do not include hardware controller IDs. Use these changes when interpreting a run whose party size changed mid-attempt.
