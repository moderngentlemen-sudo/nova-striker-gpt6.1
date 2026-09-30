# Nova Striker Prototype Validation Plan

This plan defines how the Control and Cooperation Lab will be judged. It describes future tests; it contains no claims that gameplay currently works. Design quality and responsiveness require observed play, not only files or a successful compile.

## Evidence levels

| Level | What it establishes | What it does not establish |
| --- | --- | --- |
| Design review | Rules, scope, and assumptions are concrete enough to discuss. | Implemented behavior. |
| Static checks | Source/data consistency and selected structural errors. | Unity compilation or game feel. |
| Unity compilation | The project compiles in the named editor/package environment. | Correct runtime behavior. |
| Runtime tests | The tested build behaves as observed in specific scenarios. | Broad playability or target-hardware performance. |
| Human playtesting | Observed comprehension, strategy, difficulty, and engagement. | Universal player preference. |
| Hardware validation | Measured behavior on named hardware, settings, and build. | Performance on every target. |

## Scenario coverage

| Area | Test conditions | Failure worth investigating |
| --- | --- | --- |
| Ownership | One keyboard/mouse player; two to four controllers; mixed devices where supported; menu focus. | One input controls multiple bodies or another player's panel. |
| Movement | Repeated jump, dash, wall movement, braking, landing, slope, and ceiling cases at different render rates. | Missed valid input, sticky transitions, collision escape, or timing tied to rendering. |
| Combat | Hits/misses, buffered chains, parry/perfect parry, armor, unblockables, damage interruption, and explicit cancels. | Visual cue and gameplay disagree, or misses escape commitment unexpectedly. |
| Solo | Complete the same combined encounter with Nova and with Echo. | A mandatory role, ability, or simultaneous task blocks progress. |
| Party size | Run each room with one, two, three, and four players, including two players pursuing different routes. | Camera failure, excessive density, or unavoidable overlapping attack scheduling. |
| Recovery | Join during safe and unsafe moments; unplug/reconnect each controller; confirm departure; revive; party defeat; retry. | Lost ownership, soft lock, duplicated rewards, or checkpoint inconsistency. |
| Camera limits | Deliberate horizontal/vertical separation, boss framing, downed players, and recovery near hazards/locked routes. | Zoom destroys legibility or recovery advances progress, restores resources, or bypasses route constraints. |
| Access options | Remapping, alternate jump preset, assistance settings, reduced intensity, and non-color cues. | Essential information or actions depend on one input layout or color alone. |

Automate stable gameplay invariants and session/state regressions once implementation exists. Human tests remain necessary for perceived responsiveness, understandable threats, character distinction, and camera comfort.

## Playtest procedure

Use at least five participants unfamiliar with the prototype when practical. Record prior action-platformer experience and test conditions. Teach movement and the threat-cue language briefly, then let players attempt the rooms without prescribing a route. Compare Nova/Echo order across participants to reduce learning effects.

Record attempted routes, opening actions, approach distances, deaths, missed inputs, unintended camera recoveries, and moments when the player could not explain damage. Ask what caused a failed attempt and what they would change on the next one. Track voluntary requests to retry separately from instructed repeats.

Use small groups with mixed skill levels for shared-screen tests. Include a player who climbs early, one who stays back to aim, and one who pursues enemies. These behaviors should expose framing problems rather than be dismissed as incorrect play.

## Exit criteria

- Nova and Echo each complete the combined encounter solo without role-specific route exceptions.
- Observations show distinct engagement strategies for the protagonists; merely different effects or damage values are insufficient.
- At least four of five unfamiliar participants correctly identify parryable and unblockable threats after the brief introduction. Record the sample size; this is an initial gate, not a general research claim.
- Four-player horizontal and vertical tests avoid recurring damage caused by camera framing or zoom. Log each camera-related incident and revise repeatable failures.
- Runtime scenarios for joining, departure, reconnection, revive, and checkpoint retry are completed without lost ownership or soft locks.
- Players demonstrate an understandable improvement plan and some voluntarily seek another attempt. Completion alone does not establish engagement.
- A representative standalone build meets the recorded performance target on named hardware; Editor performance is supplementary evidence.

## Performance measurements

Proposed starting target: 60 fps with a 16.67 ms frame budget on representative Windows hardware. Identify CPU, GPU, memory, resolution, quality settings, build configuration, and connected controllers before interpreting results.

Provisional acceptance thresholds for active play are a 95th-percentile frame time of at most 17 ms, a 99th percentile of at most 20 ms, and no recurring stalls above 33.3 ms. Review these thresholds against the named test machine before treating them as a supported-platform promise. Investigate spikes even when the aggregate thresholds pass.

Capture a repeatable ten-minute four-player run with sustained combat, effects, vertical movement, session changes, and checkpoint retries. Report median, 95th/99th-percentile frame times, recurring spikes, and the worst relevant segments. Separate loading from active-play measurements without hiding recovery or gameplay-related stalls.

Measure input receipt to gameplay action separately from display latency. Instrumented action timing cannot establish controller-to-photon latency. Hardware or high-speed recording is needed for that claim.

After the lab, test representative portable and lower-performance hardware before committing visual budgets. Reduce decorative cost while preserving collision behavior, attack cues, silhouettes, and interface legibility.

## Reporting a pass

Record the commit, build, editor/package versions, scenario, expected behavior, observation, and evidence location. Label each result passed, failed, or not run. Summarize limitations and the next dependency. A screenshot, source check, or successful editor import must not be described as a completed runtime or hardware test.
