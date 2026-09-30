# Nova Striker Control and Cooperation Lab

This charter defines the first playable experiment for the separate version of Nova Striker. Its purpose is to prove that movement, two different combat approaches, and one-to-four-player cooperation can support the same readable encounters before campaign or final-asset production expands.

Status on 2026-09-30: planning complete for review; implementation and playtesting have not started. The behaviors and numerical values identified as candidates below are proposals, not previously approved specifications. The [decision register](DECISIONS.md) records the remaining choices.

## Player experience

The player reads a threat, chooses an approach, creates an opening, commits an attack, and repositions. Nova controls approaching danger through firing angles and interception. Echo closes distance, counters, and sustains close pressure. Both must complete the same required encounters alone.

Four design pillars guide the experiment:

- Movement changes attack angles, exposure, and opportunities.
- Characters solve shared problems differently.
- Cooperation improves timing and recovery without becoming a composition requirement.
- Readability takes priority over decorative spectacle.

The experiment must reveal failures. A generous empty arena, excessive invulnerability, or enemies that ignore terrain would hide the problems this milestone is intended to expose.

## Questions to answer

| Question | Evidence needed |
| --- | --- |
| Does movement feel responsive during combat? | Recorded input-to-action timings, missed-input observations, and repeatable traversal attempts. |
| Do Nova and Echo invite different decisions? | Players choose different approach distances, routes, and opening actions without being required to use a scripted solution. |
| Can four people remain readable on one screen? | Horizontal and vertical tests maintain recognizable characters, attack cues, and safe camera limits. |
| Does cooperation improve an already complete solo loop? | The same objective works with either protagonist alone and with mixed test roles. |
| Can the game recover from ordinary session interruptions? | Join, departure, reconnection, revive, defeat, and checkpoint scenarios behave consistently. |

## Test spaces

Build four connected blockout spaces, with direct room selection for repeat tests. These are simulation rooms, not campaign acts or evidence of a particular story chronology.

| Space | Content | Design question |
| --- | --- | --- |
| Movement room | Gaps, a low passage reserved for later crouch/slide tests, wall routes, slopes, and dash landing targets. | Can the player select a route and land deliberately? |
| Combat room | A projectile sentry, a melee pressure unit, and an artillery unit introduced separately before combination. | Are timing, protection, counters, armor, and recovery legible? |
| Vertical room | Staggered ledges, landing shelves, upper/lower routes, and regroup points. | Can different skill levels climb without repeated camera-driven failure? |
| Combined encounter | A damaged transit platform, the three enemy behaviors, an interruptible repair console, and a scripted elite. | Do movement, combat, cooperation, and checkpoint recovery work together? |

The repair objective accepts sequential interaction in solo play. Extra players introduce another enemy approach and adjusted attack scheduling, rather than a mandatory simultaneous switch or a simple health multiplier. The scripted elite combines known cues; it is not a finished Aegis encounter.

## Playable coverage

Use Nova and Echo with partial kits plus two temporary role shells. All four may share a simple rig, but need different outlines, motion cues, and player markers. Duplicate kits may be used for load testing; they cannot establish role distinction.

| Character or shell | Included in this experiment | Remaining design work |
| --- | --- | --- |
| Nova | Standard and charged forearm fire, concise melee, one candidate Bulwark Pulse. | Helmet actions, heightened state, production poses, and final suit details. |
| Echo | Short grounded and aerial chains, limited ranged utility, one candidate pursuit action. | Staff/rifle transformations, scarf modes, helmet variants, and heightened state. |
| Tank shell | A displacement attack and short bracing action with offensive solo value. | Character identity, personal suit, kit depth, and permanent assignment. |
| Support shell | An active midrange attack and one recovery or charge action usable on self or an ally. | Character identity, personal suit, kit depth, and permanent assignment. |

Tank and Support shells are experimental roles, not approved principal characters. No encounter may require tank aggro, an external healer, or a particular party composition.

## Candidate movement and combat rules

First include running/backpedaling, jump/double jump, wall slide/jump, multidirectional dash, and Velocity Break. Crouching, powersliding, and held wall cling stay in the retained full-game vocabulary and receive a later bounded movement pass. Keep their future collision and clearance needs visible in blockouts.

Candidate Velocity Break behavior: a second dash press during active travel brakes the dash over about 60 ms. It preserves gravity, consumes the original dash use, adds no invulnerability, and restores no air charge. The player may resume ordinary actions when braking finishes. Its test is whether deliberate braking creates useful firing and melee positions without becoming an accidental-input trap.

Candidate Bulwark Pulse behavior: a brief forward pulse intercepts designated projectiles and staggers nearby unarmored enemies. Start testing with 100 ms startup, 120 ms active duration, reach of two character heights, and a six-second cooldown. Heavy piercing attacks and marked unblockables remain dangerous. Protection must create an offensive opportunity for Nova alone. Its tradeoff is short-range commitment: Nova needs to approach danger to create the opening.

Candidate Echo pursuit behavior: a short scarf-assisted tether moves Echo toward an exposed nearby enemy, including in the air. Start testing with a visible target within three character heights and a 45-degree cone around aim, 80 ms startup, a five-second cooldown, and 180 ms recovery on failure. Solid terrain blocks travel, and no target produces a readable failed-action cue. A successful counter may reduce the remaining cooldown by one second, once per incoming attack; receiving damage is never required. Its tradeoffs are unintended target selection and player spread, which need explicit camera tests.

Prototype resources stay compact: action cooldowns, a charge state for charged fire, and one equipped test Guardian action. Ultimates and a full progression economy are deferred. The Guardian test may use a projectile-redirection node; it must demonstrate a new interaction rather than replace Bulwark Pulse with a stronger shield.

Combat rules for the first test:

- Standard ranged fire permits movement and aim; heavy charge release has a short commitment.
- Melee has visible startup, impact, and recovery, with buffered follow-ups in explicit windows.
- Selected movement cancels follow successful hits. Misses retain meaningful recovery.
- Parry and perfect parry share one action. Candidate starting values are a 160 ms active window, a 70 ms perfect interval within it, and 220 ms miss recovery.
- Candidate input buffering is 100 ms. Values remain tunable and use elapsed time rather than render-frame counts.
- Ordinary damage interrupts unarmored actions. Armor and invulnerability have distinct feedback and documented exceptions.
- Ordinary, parryable, and unblockable threats use different motion, symbols, and sounds; color alone is insufficient.

Record cooldowns, attack timings, damage, movement parameters, and cancellation exceptions in the actual build's tuning data. Do not quietly promote these candidate values into permanent canon.

## Input and camera

Test a controller layout placing jump, dash, fire, and melee on the four shoulder controls. Parry and equipped abilities use remappable face controls. Preserve the last aim direction when the thumb leaves the right stick. Compare this against a familiar face-button-jump preset before choosing a default.

Manual 360-degree aim is the base. Optional assistance may stabilize an intended nearby target. Hard lock-on, automatic facing changes, and cycling targets are separate proposals; they should not accumulate by default. Keyboard and mouse provide the same actions with pointer aim. Touch is a later dedicated input experiment.

Use one gameplay plane and bounded camera zoom. Introduce four input owners and camera targets in the first integration pass, before character polish. Teammates pass through one another, and friendly fire is provisionally disabled.

Camera recovery has a separate purpose from hazard punishment. Warn players approaching the spread limit, then recover a separated player to a valid nearby position if needed. Preserve health, cooldowns, and resources; do not advance checkpoints or bypass locked routes. Actual falls still use hazard rules. Vertical rooms need shared landing opportunities, and bosses need arenas within the camera's readable extent.

If accommodating four players repeatedly makes precise solo combat unreadable or imprecise, revise framing and encounter space before adding content. Do not treat the camera as a later polish task.

## Cooperation and session behavior

Candidate Sync interaction: following a teammate's interruption with a timely attack briefly extends stagger. Limit the extension per enemy opportunity so a party cannot permanently disable an elite. Solo players retain their normal counter and stagger follow-ups.

Joining pairs an unassigned device with a player slot and introduces the character at a valid safe position. Disconnection pauses local play briefly and keeps the slot available for reconnection. Confirmed departure removes the player without resetting encounter progress. Shared menus pause play; players own their loadout panels, while the session owner confirms campaign transitions.

Downed players receive a short, interruptible revive interaction. Party defeat returns everyone to the checkpoint. Solo defeat uses the same checkpoint structure. Rewards and discoveries are shared; the experiment has no competing loot pickups, payment systems, or paid recovery.

## Implementation passes

| Pass | Deliverable | Evidence before advancing |
| --- | --- | --- |
| A | Minimal Unity project, movement and vertical rooms, local input ownership, four visible test bodies, and bounded shared camera. | Editor compilation plus runtime evidence for input ownership, collision, and horizontal/vertical framing. |
| B | Nova and Echo partial kits, explicit attack states, three enemy behaviors, and readable temporary cues. | Both characters complete individual combat tests; timings and cancellation behavior match recorded rules. |
| C | Combined encounter, Tank/Support shells, revive, Sync, session recovery, and one Guardian interaction. | Solo and four-player test matrix completed, including interruptions and checkpoint retries. |
| D | Tuning revisions and a documented decision on whether to proceed to a representative vertical slice. | Human playtest findings and standalone performance measurements support the next content investment. |

Each pass should be independently reviewable. Report completed files, compilation/runtime evidence, limitations, and the next dependency. Resolve structural failures before expanding content.

## Technical and art approach

Unity and Blender remain the working pipeline. Evaluate Unity 6.3 LTS and URP as candidates, then pin an exact editor patch and compatible packages after an actual project and build smoke test. Unity currently lists 6.3 LTS support through December 2027. This support window is an input to planning, not a guarantee that one version will cover the entire production schedule. [Unity release information](https://unity.com/releases/unity-6).

Choose the rendering pipeline before substantial material work: Unity documents that URP projects are not directly compatible with HDRP or Built-in projects. [URP compatibility](https://docs.unity3d.com/6000.3/Documentation/Manual/urp/requirements.html).

Candidate responsibilities are input intentions, a movement/collision motor, combat and abilities, encounters, session/progression state, and presentation. Keep mutable state per runtime instance. Let animation, audio, interface, and effects respond to gameplay events. Avoid speculative networking, commerce, and large framework investments during this milestone.

Use primitive geometry, simple meshes, a temporary shared rig, restrained effects, and distinct placeholder sounds. In Blender, test joint clearance and weapon attachment before surface polish. Actual approved images are required before claiming accurate Nova or Echo visual matching. No final asset, rig, cinematic, or concept-art package is required for this lab.

Windows leads this experiment. Propose a 60 fps / 16.67 ms frame budget on named representative hardware; measure standalone four-player encounters and report spikes, not only averages. Console development requires platform-holder approval and an appropriate Unity license; specific SDK and certification access remain unverified. [Unity console requirements](https://unity.com/solutions/console). Public documentation reviewed on 2026-09-30 does not establish access to gated platform materials.

## Scope and next dependency

Defer campaign acts, six complete Guardians, final character assets, eight playable kits, online networking, cross-play, storefronts, real payments, DLC infrastructure, console certification, and mobile ports. These remain longer-term considerations, not deletions from the ambition.

The first playable lab must pass the [validation plan](VALIDATION_PLAN.md) before becoming evidence for production. Solo structure and launch online scope remain provisional; team capacity and budget are unknown, so this charter makes no delivery-date or staffing promise. Before adopting meaningful departures from the supplied direction, present the specific benefit and tradeoff for the user's decision.
