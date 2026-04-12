-- Keep only one role row per user before enforcing uniqueness.
-- Priority: ADMIN_SUPER > ADMIN_MANAGER > ADMIN_STAFF > ROLE_ASSIGNER > others.
DELETE ur
FROM user_roles ur
JOIN user_roles ur_keep ON ur.user_id = ur_keep.user_id
JOIN roles r ON r.id = ur.role_id
JOIN roles rk ON rk.id = ur_keep.role_id
WHERE
  CASE rk.name
    WHEN 'ADMIN_SUPER' THEN 4
    WHEN 'ADMIN_MANAGER' THEN 3
    WHEN 'ADMIN_STAFF' THEN 2
    WHEN 'ROLE_ASSIGNER' THEN 1
    ELSE 0
  END > CASE r.name
    WHEN 'ADMIN_SUPER' THEN 4
    WHEN 'ADMIN_MANAGER' THEN 3
    WHEN 'ADMIN_STAFF' THEN 2
    WHEN 'ROLE_ASSIGNER' THEN 1
    ELSE 0
  END
  OR (
    CASE rk.name
      WHEN 'ADMIN_SUPER' THEN 4
      WHEN 'ADMIN_MANAGER' THEN 3
      WHEN 'ADMIN_STAFF' THEN 2
      WHEN 'ROLE_ASSIGNER' THEN 1
      ELSE 0
    END = CASE r.name
      WHEN 'ADMIN_SUPER' THEN 4
      WHEN 'ADMIN_MANAGER' THEN 3
      WHEN 'ADMIN_STAFF' THEN 2
      WHEN 'ROLE_ASSIGNER' THEN 1
      ELSE 0
    END
    AND ur_keep.id > ur.id
  );

ALTER TABLE user_roles
ADD CONSTRAINT user_roles_user_id_key UNIQUE (user_id);
