# Releasing

## Readiness

1. Identify the requested operation and its approval under [AGENTS.md](../AGENTS.md#authorization). Preparation, merge, publication, and recovery are separate effects.
2. Read [release.yml](../.github/workflows/release.yml), [release.json](../release.json), [.manifest.json](../.manifest.json), and lifecycle scripts in [package.json](../package.json). Use these files for current release configuration, not as proof of publication.
3. Within approved access, inspect hosted permissions, required-check behavior, npm trusted-publisher configuration, and existing GitHub release/tag and npm version/dist-tag state. Declared workflow permissions do not prove hosted access or publishing trust.
4. For publication, establish the candidate version and source SHA. Require successful library and demo validation for that SHA under [validate.yml](../.github/workflows/validate.yml), [demo.yml](../.github/workflows/demo.yml), and the review procedure in [CONTRIBUTING.md](../CONTRIBUTING.md#pull-requests). The release workflow does not run these checks or enforce a review gate itself.

Stop before dispatch when a required prerequisite is missing or unverified. Report the gap; do not infer readiness or change protections or credentials to bypass it.

## Prepare And Publish

Both operations require dispatch on `main`. Use only the operation authorized by the user.

| Operation | Effect                                                                                                                                 | Completion gate                                                                                                                        |
| --------- | -------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| `prepare` | Creates or updates the release PR; skips GitHub release creation.                                                                      | Inspect the resulting PR, version/changelog changes, and checks on its current head. Review and merge only when separately authorized. |
| `publish` | Creates the GitHub release; skips release-PR creation. npm publication runs only when this invocation reports a newly created release. | Track the release output SHA and the npm job through completion, then verify the published state below.                                |

- If a generated PR has missing or blocked checks, report that state and request an authorized validation path. An unrelated green run does not satisfy its checks.
- The npm job checks out the release action's output SHA, not an arbitrary current `main`. It publishes publicly with provenance and moves `latest`.
- A successful release-creation job or skipped npm job does not prove publication.

## Publication Verification

Record the run URL and attempt, operation, release version/tag, and release output SHA. Then compare:

- **Source:** the reviewed candidate, resolved tag commit, and actual release output SHA agree.
- **Hosted state:** the GitHub release and npm version exist with the expected identity; `latest` points to the intended version.
- **Artifact:** the downloaded npm tarball passes its registry integrity check and contains the expected package name/version, exported ESM module, declarations, and license. Check these against the package and build configuration, not metadata alone.
- **Provenance:** the published provenance associates the artifact with the expected repository, workflow, and source revision. Report unavailable evidence as a gap.

Report each layer separately. Release labels, manifest versions, registry metadata, and a tarball hash alone do not establish complete publication. Do not claim byte-for-byte build reproducibility without checking it.

## Recovery

Inspect the exact run attempt, source SHA, release/tag, registry version, dist-tags, and package identity before proposing a repair. A fresh `publish` dispatch does not resume npm publication for an existing GitHub release: the npm job requires `release_created == 'true'` from that invocation.

| Observed state                                 | Next action                                                                                                                          |
| ---------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| No GitHub release was created                  | Diagnose the creation failure. Obtain approval before retrying.                                                                      |
| GitHub release exists; npm version is absent   | Propose publication from the exact release source. There is no dedicated recovery workflow; obtain approval for the specific repair. |
| npm version exists and matches                 | Preserve the published version. Identify any remaining release metadata or dist-tag discrepancy; obtain approval before changing it. |
| Package identity differs or state is ambiguous | Stop and present the evidence for a repair decision.                                                                                 |

Recovery approval must name the intended effects. It does not implicitly include retagging, unpublishing, protection changes, or credential changes. Do not move release tags to bypass mismatches.

## Repository Protections

- The [ruleset files](../.github/rulesets) are disabled import templates, not evidence of hosted enforcement.
- After an authorized import or hosted edit, verify actual enforcement, target refs, required-check identity, review settings, and automation compatibility. The main template requires zero approving reviews and only the library check; importing it does not require independent approval or demo validation.
- Local file edits do not update hosted settings. Apply changes only through an authorized import or hosted edit, then read back the resulting state.
