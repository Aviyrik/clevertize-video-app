// My Projects card: the "Generated Commercial" area plays the video inline instead of opening the project,
// and the like/dislike bar keeps its clicks to itself.
const test = require("node:test");
const assert = require("node:assert");
const fs = require("fs");
const path = require("path");

const lib = fs.readFileSync(path.join(__dirname, "../src/components/v2/ScriptLibraryView.jsx"), "utf8");
const rating = fs.readFileSync(path.join(__dirname, "../src/components/v2/VideoRatingControls.jsx"), "utf8");

test("the video area toggles an inline player and never opens the project", () => {
  const block = lib.slice(lib.indexOf("{/* Video Section (if generated)"), lib.indexOf("{/* Creative Video Rating"));
  assert.ok(block.includes("onClick={(e) => e.stopPropagation()} // the video area plays the video"), "clicks in the video area stay there");
  assert.ok(block.includes("onClick={togglePlay}"), "the play area toggles the player");
  assert.ok(/<video\s[\s\S]*src=\{proj\.videoUrl\}/.test(block), "an inline player plays the project's video");
  assert.ok(block.includes("onError="), "a video that can't load shows a message instead of a broken player");
  assert.ok(lib.includes("e.stopPropagation();\n              if (canPlay) setPlayingVideoId") || lib.includes("e.stopPropagation();\r\n              if (canPlay) setPlayingVideoId"), "toggling stops the card's open-project click");
});

test("like/dislike clicks never reach the card", () => {
  assert.ok(rating.includes("onClick={(e) => e.stopPropagation()}"), "the rating bar swallows its clicks");
  assert.ok(lib.includes("<ProjectRatingBar"), "the rating bar is still on the card");
});

test("the rating bar calls all its hooks before deciding not to render", () => {
  const body = rating.slice(rating.indexOf("export function ProjectRatingBar"));
  const earlyReturn = body.indexOf("if (!eligible)");
  assert.ok(earlyReturn > 0, "eligibility is checked");
  const hooksAfter = body.slice(earlyReturn, body.indexOf("return (")).match(/\buse(State|Effect|Ref|Memo|Callback)\(/g);
  assert.equal(hooksAfter, null, "no hook runs after the early return");
  assert.ok(body.indexOf("useEffect(") < earlyReturn);
});
