#!/usr/bin/env bash
# Nightly SQLite backup (spec §8). Uses sqlite's online-backup command so a
# consistent copy is taken even mid-write. Add to cron on the VPS, e.g.:
#   15 3 * * * /opt/bitaqati/scripts/backup.sh /var/backups/bitaqati
set -euo pipefail

DEST_DIR="${1:?usage: backup.sh <dest-dir>}"
STAMP="$(date +%Y%m%d-%H%M%S)"
mkdir -p "$DEST_DIR"

# VACUUM INTO takes a consistent snapshot even while the app is writing
docker compose exec -T app node -e "
  const { DatabaseSync } = require('node:sqlite');
  const db = new DatabaseSync(process.env.DB_PATH);
  db.exec(\"VACUUM INTO '/data/backup.tmp.db'\");
"
docker compose cp app:/data/backup.tmp.db "$DEST_DIR/bitaqati-$STAMP.db"
docker compose exec -T app rm -f /data/backup.tmp.db

# keep the last 14
ls -1t "$DEST_DIR"/bitaqati-*.db | tail -n +15 | xargs -r rm --
echo "backup written: $DEST_DIR/bitaqati-$STAMP.db"
