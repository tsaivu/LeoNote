export type Folder = {
  id: string;
  parent_id?: string | null;
  name: string;
  sort_order: number;
  is_system: boolean;
  deleted_at?: string | null;
};
