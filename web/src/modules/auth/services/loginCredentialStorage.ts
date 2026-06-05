export type LoginCredentialSaveMode = "none" | "session" | "permanent";

export type StoredLoginCredentials = {
  username: string;
  password: string;
  saveMode: LoginCredentialSaveMode;
};

const CREDENTIALS_KEY = "leonote_login_credentials";

function parseCredentials(rawValue: string | null, saveMode: LoginCredentialSaveMode): StoredLoginCredentials | null {
  if (!rawValue) {
    return null;
  }
  try {
    const parsed = JSON.parse(rawValue) as Partial<StoredLoginCredentials>;
    return {
      username: parsed.username ?? "",
      password: parsed.password ?? "",
      saveMode,
    };
  } catch {
    return null;
  }
}

export const loginCredentialStorage = {
  load(): StoredLoginCredentials {
    const permanentCredentials = parseCredentials(localStorage.getItem(CREDENTIALS_KEY), "permanent");
    if (permanentCredentials) {
      return permanentCredentials;
    }

    const sessionCredentials = parseCredentials(sessionStorage.getItem(CREDENTIALS_KEY), "session");
    if (sessionCredentials) {
      return sessionCredentials;
    }

    return {
      username: "",
      password: "",
      saveMode: "none",
    };
  },
  save(username: string, password: string, saveMode: LoginCredentialSaveMode) {
    localStorage.removeItem(CREDENTIALS_KEY);
    sessionStorage.removeItem(CREDENTIALS_KEY);

    if (saveMode === "none") {
      return;
    }

    const payload = JSON.stringify({ username, password });
    if (saveMode === "permanent") {
      localStorage.setItem(CREDENTIALS_KEY, payload);
      return;
    }
    sessionStorage.setItem(CREDENTIALS_KEY, payload);
  },
};
