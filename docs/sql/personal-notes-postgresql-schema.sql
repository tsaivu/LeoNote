BEGIN;

CREATE EXTENSION IF NOT EXISTS pgcrypto;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'note_status_enum') THEN
        CREATE TYPE note_status_enum AS ENUM ('TODO', 'DOING', 'PENDING', 'DONE');
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'subtask_status_enum') THEN
        CREATE TYPE subtask_status_enum AS ENUM ('TODO', 'DONE');
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'note_priority_enum') THEN
        CREATE TYPE note_priority_enum AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');
    END IF;
END $$;

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at := NOW();
    RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION sync_completed_at_from_status()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    IF TG_ARGV[0] = 'note' THEN
        IF NEW.status = 'DONE' AND NEW.completed_at IS NULL THEN
            NEW.completed_at := NOW();
        ELSIF NEW.status <> 'DONE' THEN
            NEW.completed_at := NULL;
        END IF;
    ELSIF TG_ARGV[0] = 'subtask' THEN
        IF NEW.status = 'DONE' AND NEW.completed_at IS NULL THEN
            NEW.completed_at := NOW();
        ELSIF NEW.status <> 'DONE' THEN
            NEW.completed_at := NULL;
        END IF;
    END IF;

    RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION prevent_hard_delete_business_table()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    RAISE EXCEPTION 'Hard delete is not allowed on table %', TG_TABLE_NAME
        USING ERRCODE = 'P0001';
END;
$$;

CREATE OR REPLACE FUNCTION enforce_folder_parent_integrity()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
    has_cycle BOOLEAN;
BEGIN
    IF NEW.parent_id IS NULL THEN
        RETURN NEW;
    END IF;

    IF NEW.parent_id = NEW.id THEN
        RAISE EXCEPTION 'Folder cannot be its own parent'
            USING ERRCODE = '23514';
    END IF;

    WITH RECURSIVE ancestors AS (
        SELECT f.id, f.parent_id
        FROM folders f
        WHERE f.id = NEW.parent_id
          AND f.user_id = NEW.user_id
          AND f.deleted_at IS NULL
        UNION ALL
        SELECT parent.id, parent.parent_id
        FROM folders parent
        JOIN ancestors a ON a.parent_id = parent.id
        WHERE parent.user_id = NEW.user_id
          AND parent.deleted_at IS NULL
    )
    SELECT EXISTS (SELECT 1 FROM ancestors WHERE id = NEW.id) INTO has_cycle;

    IF has_cycle THEN
        RAISE EXCEPTION 'Folder cycle detected'
            USING ERRCODE = '23514';
    END IF;

    RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION protect_system_folder_soft_delete()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    IF OLD.is_system = TRUE AND OLD.deleted_at IS NULL AND NEW.deleted_at IS NOT NULL THEN
        RAISE EXCEPTION 'System folder cannot be soft deleted'
            USING ERRCODE = 'P0001';
    END IF;

    RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION validate_note_references()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM folders f
        WHERE f.id = NEW.folder_id
          AND f.user_id = NEW.user_id
          AND f.deleted_at IS NULL
    ) THEN
        RAISE EXCEPTION 'Note folder must exist, belong to the same user, and be active'
            USING ERRCODE = '23514';
    END IF;

    IF NOT EXISTS (
        SELECT 1
        FROM assignees a
        WHERE a.id = NEW.main_assignee_id
          AND a.user_id = NEW.user_id
          AND a.deleted_at IS NULL
          AND a.is_active = TRUE
    ) THEN
        RAISE EXCEPTION 'Main assignee must exist, belong to the same user, and be active'
            USING ERRCODE = '23514';
    END IF;

    RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION validate_subtask_references()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM notes n
        WHERE n.id = NEW.note_id
          AND n.user_id = NEW.user_id
          AND n.deleted_at IS NULL
    ) THEN
        RAISE EXCEPTION 'Subtask note must exist, belong to the same user, and be active'
            USING ERRCODE = '23514';
    END IF;

    IF NOT EXISTS (
        SELECT 1
        FROM assignees a
        WHERE a.id = NEW.assignee_id
          AND a.user_id = NEW.user_id
          AND a.deleted_at IS NULL
          AND a.is_active = TRUE
    ) THEN
        RAISE EXCEPTION 'Subtask assignee must exist, belong to the same user, and be active'
            USING ERRCODE = '23514';
    END IF;

    RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION validate_note_tag_references()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM notes n
        WHERE n.id = NEW.note_id
          AND n.user_id = NEW.user_id
          AND n.deleted_at IS NULL
    ) THEN
        RAISE EXCEPTION 'Note tag link requires an active note in the same user scope'
            USING ERRCODE = '23514';
    END IF;

    IF NOT EXISTS (
        SELECT 1
        FROM tags t
        WHERE t.id = NEW.tag_id
          AND t.user_id = NEW.user_id
          AND t.deleted_at IS NULL
    ) THEN
        RAISE EXCEPTION 'Note tag link requires an active tag in the same user scope'
            USING ERRCODE = '23514';
    END IF;

    RETURN NEW;
END;
$$;

CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username TEXT NOT NULL,
    email TEXT NULL,
    password_hash TEXT NOT NULL,
    display_name TEXT NULL,
    timezone TEXT NOT NULL DEFAULT 'Asia/Ho_Chi_Minh',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ NULL,
    CONSTRAINT chk_users_username_not_blank CHECK (btrim(username) <> ''),
    CONSTRAINT chk_users_email_not_blank CHECK (email IS NULL OR btrim(email) <> ''),
    CONSTRAINT chk_users_password_hash_not_blank CHECK (btrim(password_hash) <> ''),
    CONSTRAINT chk_users_timezone_not_blank CHECK (btrim(timezone) <> '')
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_users_username_active
ON users (lower(username))
WHERE deleted_at IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS uq_users_email_active
ON users (lower(email))
WHERE deleted_at IS NULL AND email IS NOT NULL;

CREATE TABLE IF NOT EXISTS refresh_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    token_hash TEXT NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    revoked_at TIMESTAMPTZ NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT fk_refresh_tokens_user
        FOREIGN KEY (user_id) REFERENCES users(id) ON UPDATE RESTRICT ON DELETE RESTRICT,
    CONSTRAINT chk_refresh_tokens_token_hash_not_blank CHECK (btrim(token_hash) <> ''),
    CONSTRAINT chk_refresh_tokens_expiry CHECK (expires_at > created_at)
);

CREATE INDEX IF NOT EXISTS idx_refresh_tokens_user_id ON refresh_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_expires_at ON refresh_tokens(expires_at);
CREATE UNIQUE INDEX IF NOT EXISTS uq_refresh_tokens_token_hash ON refresh_tokens(token_hash);

CREATE TABLE IF NOT EXISTS assignees (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    name TEXT NOT NULL,
    phone TEXT NULL,
    email TEXT NULL,
    note TEXT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ NULL,
    CONSTRAINT fk_assignees_user
        FOREIGN KEY (user_id) REFERENCES users(id) ON UPDATE RESTRICT ON DELETE RESTRICT,
    CONSTRAINT uq_assignees_id_user UNIQUE (id, user_id),
    CONSTRAINT chk_assignees_name_not_blank CHECK (btrim(name) <> ''),
    CONSTRAINT chk_assignees_email_blank_or_value CHECK (email IS NULL OR btrim(email) <> ''),
    CONSTRAINT chk_assignees_phone_blank_or_value CHECK (phone IS NULL OR btrim(phone) <> '')
);

CREATE INDEX IF NOT EXISTS idx_assignees_user_id ON assignees(user_id);
CREATE INDEX IF NOT EXISTS idx_assignees_user_active ON assignees(user_id, is_active);
CREATE UNIQUE INDEX IF NOT EXISTS uq_assignees_user_name_active
ON assignees (user_id, lower(name))
WHERE deleted_at IS NULL;

CREATE TABLE IF NOT EXISTS folders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    parent_id UUID NULL,
    name TEXT NOT NULL,
    sort_order INTEGER NOT NULL DEFAULT 0,
    is_system BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ NULL,
    CONSTRAINT fk_folders_user
        FOREIGN KEY (user_id) REFERENCES users(id) ON UPDATE RESTRICT ON DELETE RESTRICT,
    CONSTRAINT uq_folders_id_user UNIQUE (id, user_id),
    CONSTRAINT chk_folders_name_not_blank CHECK (btrim(name) <> ''),
    CONSTRAINT chk_folders_not_self_parent CHECK (parent_id IS NULL OR parent_id <> id),
    CONSTRAINT chk_folders_system_name CHECK (is_system = FALSE OR lower(name) = 'inbox'),
    CONSTRAINT fk_folders_parent_same_user
        FOREIGN KEY (parent_id, user_id) REFERENCES folders(id, user_id)
        ON UPDATE RESTRICT ON DELETE RESTRICT
);

CREATE INDEX IF NOT EXISTS idx_folders_user_id ON folders(user_id);
CREATE INDEX IF NOT EXISTS idx_folders_parent_id ON folders(parent_id);
CREATE UNIQUE INDEX IF NOT EXISTS uq_folders_user_parent_name_active
ON folders (user_id, COALESCE(parent_id, '00000000-0000-0000-0000-000000000000'::uuid), lower(name))
WHERE deleted_at IS NULL;
CREATE UNIQUE INDEX IF NOT EXISTS uq_folders_user_single_inbox
ON folders (user_id)
WHERE is_system = TRUE AND deleted_at IS NULL;

CREATE TABLE IF NOT EXISTS tags (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    name TEXT NOT NULL,
    slug TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ NULL,
    CONSTRAINT fk_tags_user
        FOREIGN KEY (user_id) REFERENCES users(id) ON UPDATE RESTRICT ON DELETE RESTRICT,
    CONSTRAINT uq_tags_id_user UNIQUE (id, user_id),
    CONSTRAINT chk_tags_name_not_blank CHECK (btrim(name) <> ''),
    CONSTRAINT chk_tags_slug_not_blank CHECK (btrim(slug) <> ''),
    CONSTRAINT chk_tags_slug_normalized CHECK (slug = lower(slug))
);

CREATE INDEX IF NOT EXISTS idx_tags_user_id ON tags(user_id);
CREATE UNIQUE INDEX IF NOT EXISTS uq_tags_user_slug_active
ON tags (user_id, slug)
WHERE deleted_at IS NULL;

CREATE TABLE IF NOT EXISTS notes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    folder_id UUID NOT NULL,
    main_assignee_id UUID NOT NULL,
    title TEXT NOT NULL,
    content TEXT NULL,
    status note_status_enum NOT NULL DEFAULT 'TODO',
    priority note_priority_enum NOT NULL DEFAULT 'MEDIUM',
    deadline_at TIMESTAMPTZ NOT NULL,
    completed_at TIMESTAMPTZ NULL,
    search_text TEXT NOT NULL DEFAULT '',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ NULL,
    CONSTRAINT fk_notes_user
        FOREIGN KEY (user_id) REFERENCES users(id) ON UPDATE RESTRICT ON DELETE RESTRICT,
    CONSTRAINT uq_notes_id_user UNIQUE (id, user_id),
    CONSTRAINT fk_notes_folder_same_user
        FOREIGN KEY (folder_id, user_id) REFERENCES folders(id, user_id)
        ON UPDATE RESTRICT ON DELETE RESTRICT,
    CONSTRAINT fk_notes_main_assignee_same_user
        FOREIGN KEY (main_assignee_id, user_id) REFERENCES assignees(id, user_id)
        ON UPDATE RESTRICT ON DELETE RESTRICT,
    CONSTRAINT chk_notes_title_not_blank CHECK (btrim(title) <> ''),
    CONSTRAINT chk_notes_search_text_not_null CHECK (search_text IS NOT NULL),
    CONSTRAINT chk_notes_completed_at_consistency CHECK (
        (status = 'DONE' AND completed_at IS NOT NULL)
        OR (status <> 'DONE' AND completed_at IS NULL)
    )
);

CREATE INDEX IF NOT EXISTS idx_notes_user_id ON notes(user_id);
CREATE INDEX IF NOT EXISTS idx_notes_user_status ON notes(user_id, status);
CREATE INDEX IF NOT EXISTS idx_notes_user_priority ON notes(user_id, priority);
CREATE INDEX IF NOT EXISTS idx_notes_user_deadline ON notes(user_id, deadline_at);
CREATE INDEX IF NOT EXISTS idx_notes_user_folder ON notes(user_id, folder_id);
CREATE INDEX IF NOT EXISTS idx_notes_user_assignee ON notes(user_id, main_assignee_id);
CREATE INDEX IF NOT EXISTS idx_notes_user_deleted ON notes(user_id, deleted_at);
CREATE INDEX IF NOT EXISTS idx_notes_search_text ON notes(user_id, search_text);

CREATE TABLE IF NOT EXISTS note_tags (
    note_id UUID NOT NULL,
    tag_id UUID NOT NULL,
    user_id UUID NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (note_id, tag_id),
    CONSTRAINT fk_note_tags_note_same_user
        FOREIGN KEY (note_id, user_id) REFERENCES notes(id, user_id)
        ON UPDATE RESTRICT ON DELETE RESTRICT,
    CONSTRAINT fk_note_tags_tag_same_user
        FOREIGN KEY (tag_id, user_id) REFERENCES tags(id, user_id)
        ON UPDATE RESTRICT ON DELETE RESTRICT
);

CREATE INDEX IF NOT EXISTS idx_note_tags_tag_id ON note_tags(tag_id);
CREATE INDEX IF NOT EXISTS idx_note_tags_user_id ON note_tags(user_id);

CREATE TABLE IF NOT EXISTS subtasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    note_id UUID NOT NULL,
    assignee_id UUID NOT NULL,
    title TEXT NOT NULL,
    status subtask_status_enum NOT NULL DEFAULT 'TODO',
    sort_order INTEGER NOT NULL DEFAULT 0,
    completed_at TIMESTAMPTZ NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ NULL,
    CONSTRAINT fk_subtasks_user
        FOREIGN KEY (user_id) REFERENCES users(id) ON UPDATE RESTRICT ON DELETE RESTRICT,
    CONSTRAINT uq_subtasks_id_user UNIQUE (id, user_id),
    CONSTRAINT fk_subtasks_note_same_user
        FOREIGN KEY (note_id, user_id) REFERENCES notes(id, user_id)
        ON UPDATE RESTRICT ON DELETE RESTRICT,
    CONSTRAINT fk_subtasks_assignee_same_user
        FOREIGN KEY (assignee_id, user_id) REFERENCES assignees(id, user_id)
        ON UPDATE RESTRICT ON DELETE RESTRICT,
    CONSTRAINT chk_subtasks_title_not_blank CHECK (btrim(title) <> ''),
    CONSTRAINT chk_subtasks_completed_at_consistency CHECK (
        (status = 'DONE' AND completed_at IS NOT NULL)
        OR (status <> 'DONE' AND completed_at IS NULL)
    )
);

CREATE INDEX IF NOT EXISTS idx_subtasks_user_id ON subtasks(user_id);
CREATE INDEX IF NOT EXISTS idx_subtasks_note_id ON subtasks(note_id);
CREATE INDEX IF NOT EXISTS idx_subtasks_user_note ON subtasks(user_id, note_id);
CREATE INDEX IF NOT EXISTS idx_subtasks_user_assignee ON subtasks(user_id, assignee_id);
CREATE INDEX IF NOT EXISTS idx_subtasks_user_status ON subtasks(user_id, status);
CREATE INDEX IF NOT EXISTS idx_subtasks_user_deleted ON subtasks(user_id, deleted_at);

DROP TRIGGER IF EXISTS trg_users_set_updated_at ON users;
CREATE TRIGGER trg_users_set_updated_at
BEFORE UPDATE ON users
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_assignees_set_updated_at ON assignees;
CREATE TRIGGER trg_assignees_set_updated_at
BEFORE UPDATE ON assignees
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_folders_set_updated_at ON folders;
CREATE TRIGGER trg_folders_set_updated_at
BEFORE UPDATE ON folders
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_tags_set_updated_at ON tags;
CREATE TRIGGER trg_tags_set_updated_at
BEFORE UPDATE ON tags
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_notes_set_updated_at ON notes;
CREATE TRIGGER trg_notes_set_updated_at
BEFORE UPDATE ON notes
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_subtasks_set_updated_at ON subtasks;
CREATE TRIGGER trg_subtasks_set_updated_at
BEFORE UPDATE ON subtasks
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_notes_sync_completed_at ON notes;
CREATE TRIGGER trg_notes_sync_completed_at
BEFORE INSERT OR UPDATE OF status, completed_at ON notes
FOR EACH ROW
EXECUTE FUNCTION sync_completed_at_from_status('note');

DROP TRIGGER IF EXISTS trg_notes_validate_refs ON notes;
CREATE TRIGGER trg_notes_validate_refs
BEFORE INSERT OR UPDATE OF user_id, folder_id, main_assignee_id, deleted_at ON notes
FOR EACH ROW
WHEN (NEW.deleted_at IS NULL)
EXECUTE FUNCTION validate_note_references();

DROP TRIGGER IF EXISTS trg_subtasks_sync_completed_at ON subtasks;
CREATE TRIGGER trg_subtasks_sync_completed_at
BEFORE INSERT OR UPDATE OF status, completed_at ON subtasks
FOR EACH ROW
EXECUTE FUNCTION sync_completed_at_from_status('subtask');

DROP TRIGGER IF EXISTS trg_subtasks_validate_refs ON subtasks;
CREATE TRIGGER trg_subtasks_validate_refs
BEFORE INSERT OR UPDATE OF user_id, note_id, assignee_id, deleted_at ON subtasks
FOR EACH ROW
WHEN (NEW.deleted_at IS NULL)
EXECUTE FUNCTION validate_subtask_references();

DROP TRIGGER IF EXISTS trg_note_tags_validate_refs ON note_tags;
CREATE TRIGGER trg_note_tags_validate_refs
BEFORE INSERT OR UPDATE OF user_id, note_id, tag_id ON note_tags
FOR EACH ROW
EXECUTE FUNCTION validate_note_tag_references();

DROP TRIGGER IF EXISTS trg_folders_parent_integrity ON folders;
CREATE TRIGGER trg_folders_parent_integrity
BEFORE INSERT OR UPDATE OF parent_id, user_id ON folders
FOR EACH ROW
EXECUTE FUNCTION enforce_folder_parent_integrity();

DROP TRIGGER IF EXISTS trg_folders_protect_system_delete ON folders;
CREATE TRIGGER trg_folders_protect_system_delete
BEFORE UPDATE OF deleted_at ON folders
FOR EACH ROW
EXECUTE FUNCTION protect_system_folder_soft_delete();

DROP TRIGGER IF EXISTS trg_users_prevent_delete ON users;
CREATE TRIGGER trg_users_prevent_delete
BEFORE DELETE ON users
FOR EACH ROW
EXECUTE FUNCTION prevent_hard_delete_business_table();

DROP TRIGGER IF EXISTS trg_assignees_prevent_delete ON assignees;
CREATE TRIGGER trg_assignees_prevent_delete
BEFORE DELETE ON assignees
FOR EACH ROW
EXECUTE FUNCTION prevent_hard_delete_business_table();

DROP TRIGGER IF EXISTS trg_folders_prevent_delete ON folders;
CREATE TRIGGER trg_folders_prevent_delete
BEFORE DELETE ON folders
FOR EACH ROW
EXECUTE FUNCTION prevent_hard_delete_business_table();

DROP TRIGGER IF EXISTS trg_tags_prevent_delete ON tags;
CREATE TRIGGER trg_tags_prevent_delete
BEFORE DELETE ON tags
FOR EACH ROW
EXECUTE FUNCTION prevent_hard_delete_business_table();

DROP TRIGGER IF EXISTS trg_notes_prevent_delete ON notes;
CREATE TRIGGER trg_notes_prevent_delete
BEFORE DELETE ON notes
FOR EACH ROW
EXECUTE FUNCTION prevent_hard_delete_business_table();

DROP TRIGGER IF EXISTS trg_subtasks_prevent_delete ON subtasks;
CREATE TRIGGER trg_subtasks_prevent_delete
BEFORE DELETE ON subtasks
FOR EACH ROW
EXECUTE FUNCTION prevent_hard_delete_business_table();

COMMIT;
