# Releasing

Bitaqati is a single deployed service, not a library, so a "release" means
two things: a tag + GitHub release that records what changed, and a deploy
of that exact commit to the server. Versions follow semver from the point
of view of someone running the app (`package.json` is the source of truth).

## 1. Decide what kind of change this is

| Kind | Bump | Examples | Release? |
| --- | --- | --- | --- |
| **Hotfix** | patch `x.y.Z` | production is broken or misbehaving for users: a crash, a wrong redirect, a QR that will not scan, a security fix | Yes, immediately, from `main` |
| **Fix** | patch `x.y.Z` | a bug nobody is shouting about, copy/i18n corrections, dependency bumps, Docker/Caddy tweaks with no behavior change | Batch into the next release; no need to tag on its own |
| **Feature** | minor `x.Y.0` | new route, new download format, new optional env var, visible UI change | Yes, once it is deployed and verified |
| **Breaking** | major `X.0.0` | a required new env var, a DB schema migration that cannot roll back, a removed or renamed route, a changed card URL shape | Yes, with an "Upgrading" section in the notes |

Rules of thumb:

- The bump is decided by the *highest* kind of change since the last tag,
  not by the last commit. Two fixes and one feature is a minor release.
- An optional env var (`GA_MEASUREMENT_ID` style) is a feature, not
  breaking. A *required* one is breaking because `docker compose up` fails.
- If you are unsure whether it is breaking, read `.env.example` and
  `docker-compose.yml`: if either must change for the deploy to work, it is.
- Don't cut a release for docs-only or CI-only commits.

## 2. Release steps

Everything happens on `main`. There are no release branches.

```bash
# 0. clean tree, up to date, tests green
git status && git pull && npm test

# 1. bump the version (updates package.json + package-lock.json, no tag)
npm version minor --no-git-tag-version      # or patch / major
git commit -am "chore: release v2.1.0"
git push

# 2. tag + GitHub release; the notes are the changelog
git tag v2.1.0 && git push origin v2.1.0
gh release create v2.1.0 --title v2.1.0 --generate-notes
```

Then edit the generated notes on GitHub so they read like the v2.0.0 notes:
a one-line summary, a **Highlights** list written for users of the site,
and (for major releases only) an **Upgrading** section that spells out the
env / compose / data steps. Drop noise like "chore" commits from the list.

## 3. Deploy

On the server, always deploy a tag, never a bare `main`, so what is running
is always something you can name:

```bash
git fetch --tags && git checkout v2.1.0
docker compose up -d --build app
curl -fsS https://$DOMAIN/healthz
```

What to restart depends on what changed:

| Changed | Command |
| --- | --- |
| Anything under `src/`, `client/`, `public/`, `package*.json`, `Dockerfile` | `docker compose up -d --build app` |
| `.env` only | `docker compose up -d app` (recreates the container with the new env, no rebuild) |
| `Caddyfile` | `docker compose exec caddy caddy reload --config /etc/caddy/Caddyfile` |
| `docker-compose.yml` | `docker compose up -d --build` |

Caddy waits for the app health check, so the old container keeps serving
until the new one is up. Card data lives in the `card-data` volume and is
never touched by a rebuild. Before a major release, take a backup anyway:
`scripts/backup.sh`.

## 4. Hotfix flow

A hotfix is the same as a release, just faster and smaller:

1. Fix on `main` in a single commit prefixed `fix:`. Add or update a test
   in `test/` that fails without the fix.
2. `npm version patch --no-git-tag-version`, commit as `chore: release vX.Y.Z`.
3. Tag, push, `gh release create` with a one-line note saying what was
   broken and since which version.
4. Deploy the tag (section 3) and verify the specific thing that was broken
   on a real phone / the real URL, not only `/healthz`.

If the fix needs to be rolled back: `git checkout <previous tag>` on the
server and `docker compose up -d --build app`. Because tags are immutable
and the DB is not migrated by patch releases, rolling back is always safe.

## 5. Checklist before tagging

- [ ] `npm test` passes
- [ ] `README.md` API table and `.env.example` reflect the change
- [ ] Verified on the deployed site (or a local `docker compose up`), not
      just `npm run dev`, when the change touches the Dockerfile or Caddy
- [ ] Version in `package.json` matches the tag
