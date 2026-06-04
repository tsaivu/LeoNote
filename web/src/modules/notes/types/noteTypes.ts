export type NoteItem = {
  id: string;
  title: string;
  content?: string | null;
  folder: {
    id: string;
    name: string;
  };
  main_assignee: {
    id: string;
    name: string;
    is_active: boolean;
  };
  assignees: Array<{
    id: string;
    name: string;
    is_active: boolean;
  }>;
  status: string;
  priority: string;
  deadline_at: string | null;
  completed_at?: string | null;
  tags: Array<{
    id: string;
    name: string;
    slug: string;
  }>;
  subtasks: Array<{
    id: string;
    title: string;
    content?: string | null;
    assignee: {
      id: string;
      name: string;
      is_active: boolean;
    };
    priority: string;
    deadline_at: string | null;
    status: string;
    sort_order: number;
    completed_at?: string | null;
  }>;
  created_at: string;
  updated_at: string;
  deleted_at?: string | null;
};

export type SubtaskPayload = {
  id?: string | null;
  title: string;
  content?: string | null;
  assignee_id: string;
  priority: string;
  deadline_at?: string | null;
  status: string;
  sort_order: number;
};

export type NotePayload = {
  title: string;
  content?: string | null;
  folder_id?: string | null;
  main_assignee_id: string;
  assignee_ids: string[];
  status: string;
  priority: string;
  deadline_at?: string | null;
  tag_ids: string[];
  subtasks: SubtaskPayload[];
};

export type NoteComment = {
  id: string;
  note_id: string;
  author_user_id: string;
  author_name: string;
  content: string;
  kind: "COMMENT" | "TIMELINE_NOTE";
  created_at: string;
  updated_at: string;
  deleted_at?: string | null;
};

export type NoteCommentPayload = {
  content: string;
  kind?: "COMMENT" | "TIMELINE_NOTE";
};
