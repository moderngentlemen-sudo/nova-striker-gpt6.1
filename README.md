# Nova Striker

A browser-first playtest for this isolated fresh-start version of Nova Striker. Nova emphasizes ranged protection; Echo emphasizes pursuit and melee. All character drawings and mechanics are temporary test implementations, with no campaign ranks assigned.

## Play

[Open the cloud browser lab](https://moderngentlemen-sudo.github.io/nova-striker-gpt6.1/). Deployment status is visible in [GitHub Actions](https://github.com/moderngentlemen-sudo/nova-striker-gpt6.1/actions).

Choose Nova or Echo, then Deploy. WASD moves, Space jumps twice, Shift dashes and brakes, the mouse aims, left click fires (hold/release to charge), right click chains melee, Q parries, E uses the suit action, and F interacts or revives. Esc pauses; R retries the checkpoint. The Controls panel includes two controller presets.

Four selectable rooms cover movement, combat, vertical traversal, and the Skyport repair encounter. Co-op setup supports up to four input owners using two keyboard layouts and standard controllers. Apply squad changes adds, removes, or reassigns players while preserving the encounter, checkpoint, health, cooldowns, and downed state. Player slots stay stable when someone leaves. New and returning players join beside a grounded teammate on a clear platform; returning slots retain their state. Resume explicitly after applying changes.

Character changes use the separate Restart with this squad button, which starts a new room attempt. Enemy composition stays fixed during live squad changes; attack scheduling follows the current party size. Reconnect an assigned controller, or use Co-op setup to reassign or remove its player. Release held action buttons before resuming. Simulated allies are marked SIM and only exercise framing; they do not establish human co-op quality.

## Cloud development

The user requires cloud development and, on 2026-09-30, authorized continuing directly in this **ChatGPT Work cloud conversation**, foregoing Codespaces for now. GitHub Actions remains the validation and publishing path. The earlier local draft was transferred into this repository; further implementation belongs in an authorized remote cloud workspace.

The [existing Codespace](https://bookish-train-wvvwgvqgwpv63vg6g.github.dev/) remains optional. See [cloud environment and current direction](docs/CLOUD_ENVIRONMENT.md). The checked-in devcontainer supplies Node 24 and forwards port 4173. In an authorized cloud terminal:

```sh
node server.mjs
```

Open the forwarded port to play the development build. Tests and a single-file build need no dependencies:

```sh
node --test
node scripts/build-standalone.mjs
```

GitHub Actions runs gameplay tests and builds on every main push and pull request. Main builds publish only the browser assets to GitHub Pages after checks pass. No server, database, analytics service, or third-party game assets are required. Gameplay runs in the visiting browser; cloud hosting does not add online multiplayer.

See [browser playtest coverage](docs/BROWSER_PLAYTEST.md), [prototype charter](docs/PROTOTYPE_CHARTER.md), [world foundations](docs/WORLD_CODEX_FOUNDATIONS.md), [decisions](docs/DECISIONS.md), [validation plan](docs/VALIDATION_PLAN.md), and the [original brief](docs/source/development-brief.txt).

Unity and Blender remain the longer-term pipeline. This build does not establish Unity compilation, final character art, a completed campaign, online co-op, touch controls, or physical four-controller results. Meaningful creative departures still need a concrete benefit/tradeoff and a check with the user before adoption.
