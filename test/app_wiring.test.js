// App.jsx wires every screen together, and a prop like activeBusiness={activeBusiness} that names a
// variable App never defines builds fine but crashes the whole app after login (ReferenceError).
// This checks that every `prop={name}` in App.jsx names something App.jsx actually declares.
const test = require("node:test");
const assert = require("node:assert");
const fs = require("fs");
const path = require("path");

function undefinedPropValues(src) {
  const declared = new Set();
  const addList = (list) => list
    .split(",")
    .map((x) => x.trim().replace(/^\.\.\./, "").split(/[:=]/).pop().trim())
    .filter((x) => /^[A-Za-z_$][\w$]*$/.test(x))
    .forEach((x) => declared.add(x));
  for (const m of src.matchAll(/\b(?:const|let|var|function|class)\s+([A-Za-z_$][\w$]*)/g)) declared.add(m[1]);
  for (const m of src.matchAll(/\b(?:const|let|var)\s*\[([^\]]*)\]/g)) addList(m[1]);
  for (const m of src.matchAll(/\b(?:const|let|var)\s*\{([^}]*)\}/g)) addList(m[1]);
  for (const m of src.matchAll(/import\s+([A-Za-z_$][\w$]*)?\s*,?\s*(?:\{([^}]*)\})?\s*from/g)) {
    if (m[1]) declared.add(m[1]);
    if (m[2]) addList(m[2].replace(/\bas\b/g, ":"));
  }
  for (const m of src.matchAll(/\(([^()]*)\)\s*=>/g)) addList(m[1].replace(/[{}[\]]/g, ","));
  for (const m of src.matchAll(/([A-Za-z_$][\w$]*)\s*=>/g)) declared.add(m[1]);
  for (const m of src.matchAll(/function\s*[\w$]*\s*\(([^)]*)\)/g)) addList(m[1].replace(/[{}[\]]/g, ","));
  const globals = new Set(["undefined", "null", "true", "false", "window", "document", "console", "Math", "Date", "JSON", "Object", "Array", "String", "Number", "Boolean", "Promise", "React", "localStorage", "navigator"]);
  const missing = new Set();
  for (const m of src.matchAll(/\s[\w-]+=\{([A-Za-z_$][\w$]*)\}/g)) {
    if (!declared.has(m[1]) && !globals.has(m[1])) missing.add(m[1]);
  }
  return [...missing];
}

test("every prop={name} in App.jsx names a variable App.jsx declares", () => {
  const app = fs.readFileSync(path.join(__dirname, "../src/App.jsx"), "utf8");
  assert.deepEqual(undefinedPropValues(app), []);
});

test("the check catches the post-login crash (activeBusiness / activeView never defined)", () => {
  const broken = "const [activeAppView] = useState('hub');\n<FeedbackModal activeBusiness={activeBusiness} activeView={activeView} other={activeAppView} />";
  assert.deepEqual(undefinedPropValues(broken), ["activeBusiness", "activeView"]);
});
