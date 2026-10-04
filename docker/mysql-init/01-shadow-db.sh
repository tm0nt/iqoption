#!/bin/bash
# Rights for Prisma's shadow database.
#
# `prisma migrate dev` diffs the schema against a throwaway database it creates
# and drops on each run, named `prisma_migrate_shadow_db_<uuid>`. The
# application user owns only its own schema, so without this the first migration
# fails with P3014 and nothing explains which grant is missing.
#
# The wildcard covers that prefix and nothing else: this does not let the user
# create a database of any other name.
#
# A shell script rather than a .sql file, because only these see the container's
# environment — and the user's name comes from it.
#
# Runs once, when the data directory is first created.
set -euo pipefail

mysql -u root -p"${MYSQL_ROOT_PASSWORD}" <<SQL
GRANT ALL PRIVILEGES ON \`prisma\_migrate\_shadow\_db%\`.* TO '${MYSQL_USER}'@'%';
FLUSH PRIVILEGES;
SQL

echo "granted shadow-database rights to ${MYSQL_USER}"
