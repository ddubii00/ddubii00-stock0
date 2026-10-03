import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const root = new URL("../", import.meta.url);

test("relative URLs work at the root and under /stock0-7/", () => {
  for (const base of ["https://example.com/", "https://example.com/stock0-7/"]) {
    const prefix = new URL(base).pathname;
    assert.equal(new URL("./login", base).pathname, `${prefix}login`);
    assert.equal(new URL("./", base).pathname, prefix);
    assert.equal(new URL("./api/data", base).pathname, `${prefix}api/data`);
    assert.equal(new URL("./api/sync", base).pathname, `${prefix}api/sync`);
    assert.equal(new URL("./styles.css", base).pathname, `${prefix}styles.css`);
    assert.equal(new URL("./app.js", base).pathname, `${prefix}app.js`);
  }
});

test("application uses relative navigation, API, and asset URLs", async () => {
  const [server, app, index] = await Promise.all([
    readFile(new URL("server.js", root), "utf8"),
    readFile(new URL("public/app.js", root), "utf8"),
    readFile(new URL("public/index.html", root), "utf8")
  ]);

  assert.match(server, /action="\.\/login"/);
  assert.match(server, /location: "\.\/"/);
  assert.equal((server.match(/location: "\.\/login"/g) || []).length, 2);
  assert.equal((app.match(/fetch\("\.\/api\/data"/g) || []).length, 2);
  assert.equal((app.match(/fetch\("\.\/api\/sync"/g) || []).length, 2);
  assert.match(index, /href="\.\/styles\.css"/);
  assert.match(index, /src="\.\/app\.js"/);
});
