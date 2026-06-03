import { createBrowserRouter } from "react-router-dom";

import { App } from "./App";
import { AssigneeManagementPage } from "../modules/assignees/pages/AssigneeManagementPage";
import { LoginPage } from "../modules/auth/pages/LoginPage";
import { FolderManagementPage } from "../modules/folders/pages/FolderManagementPage";
import { NotesWorkspacePage } from "../modules/notes/pages/NotesWorkspacePage";
import { TrashPage } from "../modules/notes/pages/TrashPage";
import { TagManagementPage } from "../modules/tags/pages/TagManagementPage";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
    children: [
      { index: true, element: <NotesWorkspacePage /> },
      { path: "login", element: <LoginPage /> },
      { path: "trash", element: <TrashPage /> },
      { path: "settings/assignees", element: <AssigneeManagementPage /> },
      { path: "settings/folders", element: <FolderManagementPage /> },
      { path: "settings/tags", element: <TagManagementPage /> },
    ],
  },
]);
