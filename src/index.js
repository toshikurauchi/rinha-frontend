const INDENT = "    ";
const PAGE_SIZE = 20; // Number of lines in each page
const SHOW_PAGE_NUMBERS = 5; // Number of page numbers to show in pagination

// Globals
let lines = [];
let totalPages = 0;

function showError(errorMsg) {
  errorMsg.classList.add("visible");

  const loadJSONBtn = document.getElementById("load-json");
  loadJSONBtn.disabled = false;

  const loadingIndicator = document.getElementById("loading-indicator");
  loadingIndicator.classList.add("hidden");
}

function hideError(errorMsg) {
  errorMsg.classList.remove("visible");
}

async function loadJSONFile(file, errorMsg) {
  const stream = file.stream().pipeThrough(new TextDecoderStream());
  const reader = stream.getReader();
  let jsonString = "";

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      jsonString += value;
    }
  } finally {
    reader.releaseLock();
  }

  try {
    const data = JSON.parse(jsonString);
    const jsonViewer = showObject(data, file.name);
    const fileForm = document.querySelector(".file-form");

    fileForm.classList.add("hidden");
    jsonViewer.classList.remove("hidden");
    if (totalPages > 1) {
      showPagination();
    }
  } catch (e) {
    console.log(e);
    showError(errorMsg);
    return;
  }
}

function showPagination() {
  const paginationContainer = document.querySelector(".pagination-container");
  paginationContainer.classList.remove("hidden");
}

function registerPageListener(button, getNewPage) {
  button.addEventListener("click", (event) => {
    event.preventDefault();
    const newPage = getNewPage();
    renderPage(newPage);
  });
}

function showObject(obj, filename) {
  const section = document.getElementById("json-viewer");
  const title = document.getElementById("filename");
  addText(title, filename);

  lines = buildLines(obj);
  totalPages = Math.ceil(lines.length / PAGE_SIZE);

  renderPage(0);

  return section;
}

function buildLines(obj) {
  const lines = [];
  const isArray = Array.isArray(obj);

  let indentation = 0;
  if (isArray) {
    lines.push(newLine(indentation, null, null, true, "["));
    indentation++;
  }

  const newLines = objToLines(obj, isArray, indentation);
  newLines.forEach((line) => lines.push(line));
  // Can't do lines.push(...newLines); because it breaks for very large files

  if (isArray) {
    indentation--;
    lines.push(newLine(indentation, null, null, true, "]"));
  }

  return lines;
}

function newLine(indentation, key, value, isArray, bracket) {
  return {
    indentation,
    key,
    value,
    isArray,
    bracket,
  };
}

function renderPage(pageIdx) {
  const contentContainer = document.getElementById("content-container");
  contentContainer.innerHTML = "";

  const startIdx = pageIdx * PAGE_SIZE;
  const endIdx = Math.min((pageIdx + 1) * PAGE_SIZE, lines.length);

  for (let i = startIdx; i < endIdx; i++) {
    renderLine(lines[i], contentContainer);
  }

  renderPagination(pageIdx);
}

function renderPagination(pageIdx) {
  const paginationContainer = document.getElementById("pagination-container");
  paginationContainer.innerHTML = "";

  if (pageIdx > 0) {
    createPageLink("«", 0, pageIdx, paginationContainer, true);
    createPageLink("‹", pageIdx - 1, pageIdx, paginationContainer, true);
  }

  createPageLink(1, 0, pageIdx, paginationContainer);

  const pagesInEachSide = Math.floor((SHOW_PAGE_NUMBERS - 1) / 2);
  let startIdx = Math.max(0, pageIdx - pagesInEachSide);
  if (totalPages - pageIdx < pagesInEachSide) {
    startIdx = Math.max(0, totalPages - SHOW_PAGE_NUMBERS);
  }
  const lastIdx = Math.min(totalPages - 2, startIdx + SHOW_PAGE_NUMBERS - 1);

  if (startIdx > 1) {
    createElement("span", null, paginationContainer, "...");
  }

  for (let i = startIdx; i <= lastIdx; i++) {
    if (i === 0) continue;
    createPageLink(i + 1, i, pageIdx, paginationContainer);
  }

  if (lastIdx < totalPages - 2) {
    createElement("span", null, paginationContainer, "...");
  }

  createPageLink(totalPages, totalPages - 1, pageIdx, paginationContainer);

  if (pageIdx < totalPages - 1) {
    createPageLink("›", pageIdx + 1, pageIdx, paginationContainer, true);
    createPageLink("»", totalPages - 1, pageIdx, paginationContainer, true);
  }
}

function createPageLink(text, pageIdx, currentPageIdx, parent, isSpecial) {
  if (pageIdx === currentPageIdx) {
    return createElement("span", null, parent, text);
  } else {
    const className = isSpecial ? "special" : null;
    const link = createElement("a", className, parent, text);
    link.href = `?page=${pageIdx + 1}`;
    registerPageListener(link, () => pageIdx);
    return link;
  }
}

function renderLine(line, contentElement) {
  const lineElement = createElement("div", "json-line", contentElement);

  addIndentation(lineElement, line.indentation);

  const container = createElement("span", "content", lineElement);
  addKey(container, line.key, line.isArray);
  addValue(container, line.value);
  addBracket(container, line.bracket);

  return lineElement;
}

function addIndentation(lineElement, indentation) {
  for (let i = 0; i < indentation; i++) {
    createElement("span", "indent", lineElement, INDENT);
  }
}

function addKey(lineElement, key, isArray) {
  if (!key) return;
  const classList = ["json-key"];
  if (isArray) classList.push("array-idx");
  createElement("span", classList.join(" "), lineElement, `${key}: `);
}

function addValue(lineElement, value) {
  if (value === null) return;
  addText(lineElement, value);
}

function addBracket(lineElement, bracket) {
  if (!bracket) return;
  createElement("span", "bracket", lineElement, bracket);
}

function objToLines(obj, isArray, indentation) {
  const lines = [];

  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      let value = obj[key];

      if (value !== null && typeof value === "object") {
        const isNewArray = Array.isArray(value);
        lines.push(
          newLine(indentation, key, null, isArray, isNewArray ? "[" : null)
        );
        const newLines = objToLines(value, isNewArray, indentation + 1);
        newLines.forEach((line) => lines.push(line));
        if (isNewArray) {
          lines.push(newLine(indentation, null, null, isArray, "]"));
        }
      } else {
        if (value === null) {
          value = "null";
        } else if (typeof value === "string") {
          value = `"${value}"`;
        } else {
          value = value.toString();
        }

        lines.push(newLine(indentation, key, value, isArray));
      }
    }
  }

  return lines;
}

function createElement(tagName, className, parent, text) {
  const element = document.createElement(tagName);
  if (className) {
    element.className = className;
  }
  if (parent) {
    parent.appendChild(element);
  }
  if (text) {
    addText(element, text);
  }

  return element;
}

function addText(parent, text) {
  const textNode = document.createTextNode(text);
  parent.appendChild(textNode);
}

document.addEventListener("DOMContentLoaded", () => {
  const fileInput = document.getElementById("upload-file-input");
  const loadJSONBtn = document.getElementById("load-json");
  const errorMsg = document.querySelector(".error-msg");
  const loadingIndicator = document.getElementById("loading-indicator");

  fileInput.addEventListener("change", () => {
    hideError(errorMsg);
    if (fileInput.files.length === 0) {
      return;
    }
    loadJSONBtn.disabled = true;
    loadingIndicator.classList.remove("hidden");
    loadJSONFile(fileInput.files[0], errorMsg);
  });

  loadJSONBtn.addEventListener("click", () => {
    fileInput.click();
  });
});
