SET @has_permissions := (
	SELECT COUNT(*)
	FROM information_schema.tables
	WHERE table_schema = DATABASE()
		AND table_name = 'permissions'
);

SET @sql_permissions := IF(
	@has_permissions > 0,
	'ALTER TABLE `permissions` ALTER COLUMN `updatedAt` DROP DEFAULT',
	'SELECT 1'
);

PREPARE stmt_permissions FROM @sql_permissions;
EXECUTE stmt_permissions;
DEALLOCATE PREPARE stmt_permissions;

SET @has_roles := (
	SELECT COUNT(*)
	FROM information_schema.tables
	WHERE table_schema = DATABASE()
		AND table_name = 'roles'
);

SET @sql_roles := IF(
	@has_roles > 0,
	'ALTER TABLE `roles` ALTER COLUMN `updatedAt` DROP DEFAULT',
	'SELECT 1'
);

PREPARE stmt_roles FROM @sql_roles;
EXECUTE stmt_roles;
DEALLOCATE PREPARE stmt_roles;
