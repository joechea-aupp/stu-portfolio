#!/bin/sh
set -eu

# Allow Prisma Migrate to create/drop its shadow database during development.
mysql -uroot -p"${MYSQL_ROOT_PASSWORD}" <<SQL
GRANT CREATE, DROP, REFERENCES, ALTER, INDEX ON *.* TO '${MYSQL_USER}'@'%';
FLUSH PRIVILEGES;
SQL
