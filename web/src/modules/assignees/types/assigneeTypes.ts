export type Assignee = {
  id: string;
  name: string;
  phone?: string | null;
  email?: string | null;
  note?: string | null;
  is_active: boolean;
  deleted_at?: string | null;
};
