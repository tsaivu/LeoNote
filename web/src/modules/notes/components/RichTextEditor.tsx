import { useEffect, useRef, useState } from "react";

import { sanitizeRichTextHtml } from "../../../shared/lib/richText";

type RichTextEditorProps = {
  id: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
};

const toolbarActions: Array<{ command: string; label: string; value?: string }> = [
  { command: "bold", label: "B" },
  { command: "italic", label: "I" },
  { command: "underline", label: "U" },
  { command: "insertUnorderedList", label: "List" },
  { command: "createLink", label: "Link", value: "" },
];

export function RichTextEditor({ id, value, onChange, placeholder }: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement | null>(null);
  const [activeCommands, setActiveCommands] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (!editorRef.current) {
      return;
    }
    const normalized = sanitizeRichTextHtml(value);
    if (editorRef.current.innerHTML !== normalized) {
      editorRef.current.innerHTML = normalized;
    }
  }, [value]);

  function emitChange() {
    if (!editorRef.current) {
      return;
    }
    onChange(sanitizeRichTextHtml(editorRef.current.innerHTML));
    updateToolbarState();
  }

  function updateToolbarState() {
    setActiveCommands({
      bold: document.queryCommandState("bold"),
      italic: document.queryCommandState("italic"),
      underline: document.queryCommandState("underline"),
      insertUnorderedList: document.queryCommandState("insertUnorderedList"),
      createLink: document.queryCommandState("createLink"),
    });
  }

  function runCommand(command: string) {
    if (!editorRef.current) {
      return;
    }
    editorRef.current.focus();
    if (command === "createLink") {
      const url = window.prompt("Enter URL");
      if (!url) {
        return;
      }
      document.execCommand(command, false, url);
    } else {
      document.execCommand(command, false);
    }
    emitChange();
  }

  useEffect(() => {
    function handleSelectionChange() {
      const selection = document.getSelection();
      if (!selection || !editorRef.current) {
        return;
      }
      const anchorNode = selection.anchorNode;
      if (anchorNode && editorRef.current.contains(anchorNode)) {
        updateToolbarState();
      }
    }

    document.addEventListener("selectionchange", handleSelectionChange);
    return () => document.removeEventListener("selectionchange", handleSelectionChange);
  }, []);

  return (
    <div className="rich-editor-shell">
      <div className="rich-toolbar">
        {toolbarActions.map((action) => (
          <button
            className={`rich-toolbar-button${activeCommands[action.command] ? " active" : ""}`}
            key={action.command}
            type="button"
            onMouseDown={(event) => event.preventDefault()}
            onClick={() => runCommand(action.command)}
          >
            {action.label}
          </button>
        ))}
      </div>
      <div
        id={id}
        ref={editorRef}
        className="rich-editor-input"
        contentEditable
        data-placeholder={placeholder ?? ""}
        onInput={emitChange}
        onKeyUp={updateToolbarState}
        onMouseUp={updateToolbarState}
        suppressContentEditableWarning
      />
    </div>
  );
}
