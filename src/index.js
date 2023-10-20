const INDENT = "    ";

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
  } catch (e) {
    console.log(e);
    showError(errorMsg);
    return;
  }
}

const MAX_BLOCKS = 3; // Number of content divs that exist at any given time
const OTHER_BLOCKS = (MAX_BLOCKS - 1) / 2; // Number of content divs that exist on either side of the middle block
const BLOCK_SIZE = 100; // Number of lines in each content div
let lines = [];
const contentBlocks = [];
let currentMiddleBlock = Math.floor(MAX_BLOCKS / 2);

function showObject(obj, filename) {
  const section = document.getElementById("json-viewer");
  const title = document.getElementById("filename");
  addText(title, filename);

  for (let i = 0; i < MAX_BLOCKS; i++) {
    const block = document.getElementById(`content-${i}`);
    contentBlocks.push(block);
    block.innerHTML = ""; // Clear block
    block.style.setProperty("--block-index", i - 1);
  }

  lines = buildLines(obj);

  renderBlock(contentBlocks[currentMiddleBlock], 0);

  // We do this so there's time for the browser to render the first block
  setTimeout(() => {
    setProperties(section);
  }, 0);

  setupScrollListener(section);

  return section;
}

const measureCanvas = document.getElementById("measure-canvas");
const measureCtx = measureCanvas.getContext("2d");

function setProperties(section) {
  const firstLine = document.querySelector(".json-line");
  const lineHeight = firstLine.getBoundingClientRect().height;
  let maxLength = 0;
  let longestLine = null;
  for (let line of lines) {
    const length = getLineLength(line);
    if (length > maxLength) {
      maxLength = length;
      longestLine = line;
    }
  }

  measureCtx.font = getComputedStyle(firstLine).font;
  const minWidth = Math.ceil(measureCtx.measureText(longestLine.value).width);

  section.style.setProperty("--min-line-width", `${minWidth}px`);
  section.style.setProperty("--block-height", `${lineHeight * BLOCK_SIZE}px`);
  section.style.setProperty(
    "--object-height",
    `${Math.ceil(lineHeight * lines.length)}px`
  );

  // Render next blocks
  for (let i = 0; i < OTHER_BLOCKS && lines.length > BLOCK_SIZE * i; i++) {
    const blockIdx = i + 1;
    if (BLOCK_SIZE * blockIdx >= lines.length) break;
    renderBlock(contentBlocks[currentMiddleBlock + blockIdx], blockIdx);
  }
}

function setupScrollListener(section) {
  const container = document.querySelector(".content-container");
  document.addEventListener("scroll", () => {
    const screenCenter =
      window.scrollY - container.offsetTop + window.innerHeight / 2;
    const blockHeight = parseFloat(
      section.style.getPropertyValue("--block-height")
    );
    const centerBlockIdx = Math.floor(screenCenter / blockHeight);
    updateBlocks(centerBlockIdx);
  });
}

function updateBlocks(centerBlockIdx) {
  const middleBlock = findMiddleBlock(centerBlockIdx);
  if (middleBlock) {
    currentMiddleBlock = contentBlocks.indexOf(middleBlock);
  } else {
    currentMiddleBlock = Math.floor(MAX_BLOCKS / 2);
  }

  const firstBlockIdx = (centerBlockIdx - OTHER_BLOCKS) % MAX_BLOCKS;
  for (let i = 0; i < MAX_BLOCKS; i++) {
    const blockIdx = (firstBlockIdx + i + MAX_BLOCKS) % MAX_BLOCKS; // add MAX_BLOCKS to make sure it's positive
    const block = contentBlocks[blockIdx];
    const newBlockIdx = centerBlockIdx + i - OTHER_BLOCKS;
    if (block.style.getPropertyValue("--block-index") === newBlockIdx) continue;
    renderBlock(block, newBlockIdx);
  }
}

function findMiddleBlock(centerBlockIdx) {
  for (let block of contentBlocks) {
    if (block.style.getPropertyValue("--block-index") === centerBlockIdx) {
      return block;
    }
  }
  return null;
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

function getLineLength(line) {
  let lineString = "";
  if (line.indentation) lineString += INDENT.repeat(line.indentation);
  if (line.key) lineString += line.key + ": ";
  if (line.value) lineString += line.value;
  if (line.bracket) lineString += line.bracket;
  return lineString.length;
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

function renderBlock(block, blockIdx) {
  block.innerHTML = ""; // Clear block
  block.style.setProperty("--block-index", blockIdx);

  if (blockIdx < 0) return;

  const startIdx = blockIdx * BLOCK_SIZE;
  const endIdx = Math.min((blockIdx + 1) * BLOCK_SIZE, lines.length);

  for (let i = startIdx; i < endIdx; i++) {
    renderLine(lines[i], block);
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
