function showError(errorMsg) {
  errorMsg.classList.add("visible");
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

    document.addEventListener("scroll", () => {
      renderLines();
    });
  } catch (e) {
    console.log(e);
    showError(errorMsg);
    return;
  }
}

function getMaxScroll() {
  return (
    Math.max(
      document.body.scrollHeight,
      document.body.offsetHeight,
      document.documentElement.clientHeight,
      document.documentElement.scrollHeight,
      document.documentElement.offsetHeight
    ) - window.innerHeight
  );
}

let lines = [];
let contentElement = null;
let lastRenderedIndex = -1;
function showObject(obj, filename) {
  const main = document.getElementsByTagName("main")[0];

  const section = createElement("section", "json-viewer hidden", main);
  createElement("h1", "filename", section, filename);

  lines = buildLines(obj);
  contentElement = createElement("div", "content-container", section);

  renderLines();

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

function renderLines() {
  setTimeout(() => {
    renderNextLine();
  }, 0);
}

const PRERENDER_FACTOR = 5; // How many full height screens to prerender
const MAX_RENDER_LINES = 1000; // How many lines to render at once
function renderNextLine() {
  if (
    !contentElement ||
    !lines ||
    !lines.length ||
    lastRenderedIndex === lines.length - 1 ||
    window.scrollY < getMaxScroll() - PRERENDER_FACTOR * window.innerHeight
  )
    return;

  for (
    let i = 0;
    i < MAX_RENDER_LINES && lastRenderedIndex < lines.length - 1;
    i++
  ) {
    lastRenderedIndex++;
    renderLine(lines[lastRenderedIndex], contentElement);
  }

  setTimeout(renderNextLine, 0);
}

function renderLine(line, contentElement) {
  const lineElement = createElement("div", "json-line", contentElement);

  addIndentation(lineElement, line.indentation);

  const container = createElement("span", "content", lineElement);
  addKey(container, line.key, line.isArray);
  addValue(container, line.value);
  addBracket(container, line.bracket);
}

function addIndentation(lineElement, indentation) {
  for (let i = 0; i < indentation; i++) {
    createElement("span", "indent", lineElement, "    ");
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

function getBrackets(obj) {
  if (Array.isArray(obj)) {
    return [
      true,
      createElement("span", "bracket", null, "["),
      createElement("span", "bracket", null, "]"),
    ];
  }
  return [false, null, null];
}

function objToHTML(obj, isArray, parent) {
  isArray = !!isArray; // Convert to boolean
  const classList = [];
  if (isArray) {
    classList.push("array-idx");
  }
  const className = classList.join(" ");

  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      const value = obj[key];

      const item = createElement("li", className, parent);
      createElement("span", "obj-key", item, `${key}: `);
      if (value === null) {
        addText(item, "null");
      } else if (typeof value === "object") {
        const [isArray, openBracket, closeBracket] = getBrackets(value);

        if (openBracket) item.appendChild(openBracket);
        const contentElement = createElement("ul", null, item);
        if (closeBracket) item.appendChild(closeBracket);

        objToHTML(value, isArray, contentElement);
      } else if (typeof value === "string") {
        addText(item, `"${value}"`);
      } else {
        addText(item, value);
      }
    }
  }
}

function objToLines(obj, isArray, indentation) {
  const lines = [];

  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      let value = obj[key];

      if (typeof value === "object") {
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

function createLine(parent) {
  return createElement("div", "json-line", parent);
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

  fileInput.addEventListener("change", () => {
    hideError(errorMsg);
    if (fileInput.files.length === 0) {
      return;
    }
    loadJSONFile(fileInput.files[0], errorMsg);
  });

  loadJSONBtn.addEventListener("click", () => {
    fileInput.click();
  });
});
