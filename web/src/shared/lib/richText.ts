const ALLOWED_TAGS = new Set(["A", "B", "BR", "DIV", "EM", "I", "LI", "OL", "P", "STRONG", "U", "UL"]);

function sanitizeNode(node: Node, documentRef: Document): Node | null {
  if (node.nodeType === Node.TEXT_NODE) {
    return documentRef.createTextNode(node.textContent ?? "");
  }

  if (node.nodeType !== Node.ELEMENT_NODE) {
    return null;
  }

  const element = node as HTMLElement;
  if (!ALLOWED_TAGS.has(element.tagName)) {
    const fragment = documentRef.createDocumentFragment();
    Array.from(element.childNodes).forEach((child) => {
      const sanitizedChild = sanitizeNode(child, documentRef);
      if (sanitizedChild) {
        fragment.appendChild(sanitizedChild);
      }
    });
    return fragment;
  }

  const cleanElement = documentRef.createElement(element.tagName.toLowerCase());
  if (element.tagName === "A") {
    const href = element.getAttribute("href")?.trim() ?? "";
    if (href.startsWith("http://") || href.startsWith("https://") || href.startsWith("mailto:")) {
      cleanElement.setAttribute("href", href);
      cleanElement.setAttribute("target", "_blank");
      cleanElement.setAttribute("rel", "noreferrer");
    }
  }

  Array.from(element.childNodes).forEach((child) => {
    const sanitizedChild = sanitizeNode(child, documentRef);
    if (sanitizedChild) {
      cleanElement.appendChild(sanitizedChild);
    }
  });

  return cleanElement;
}

export function sanitizeRichTextHtml(value: string): string {
  if (typeof window === "undefined") {
    return value;
  }

  const parser = new DOMParser();
  const parsed = parser.parseFromString(value, "text/html");
  const sanitized = document.implementation.createHTMLDocument("");
  Array.from(parsed.body.childNodes).forEach((child) => {
    const cleanNode = sanitizeNode(child, sanitized);
    if (cleanNode) {
      sanitized.body.appendChild(cleanNode);
    }
  });
  return sanitized.body.innerHTML;
}

export function isRichTextEmpty(value: string | null | undefined): boolean {
  if (!value) {
    return true;
  }
  if (typeof window === "undefined") {
    return !value.replace(/<[^>]+>/g, "").trim();
  }
  const parser = new DOMParser();
  const parsed = parser.parseFromString(value, "text/html");
  return !(parsed.body.textContent ?? "").trim();
}
