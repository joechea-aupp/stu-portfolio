-- DDL-only migration for compatibility with restricted shadow DB users.
-- Any legacy duplicate user_roles rows should be cleaned manually before this
-- migration if present, then uniqueness is enforced at the schema level.

ALTER TABLE user_roles
ADD CONSTRAINT user_roles_user_id_key UNIQUE (user_id);
