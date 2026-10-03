import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import test from 'node:test';

const root = new URL('../', import.meta.url);

test('relative URLs work at root and /stock0-7/', () => {
  for (const base of ['https://example.com/', 'https://example.com/stock0-7/']) {
    const prefix = new URL(base).pathname;
    assert.equal(new URL('./login', base).pathname, `${prefix}login`);
    assert.equal(new URL('./', base).pathname, prefix);
    assert.equal(new URL('./api/data', base).pathname, `${prefix}api/data`);
    assert.equal(new URL('./api/sync', base).pathname, `${prefix}api/sync`);
  }
});

test('server, Vite and React source retain relative subpath behavior', async () => {
  const [server, app, vite, index] = await Promise.all([
    readFile(new URL('server.js', root), 'utf8'),
    readFile(new URL('src/App.jsx', root), 'utf8'),
    readFile(new URL('vite.config.js', root), 'utf8'),
    readFile(new URL('index.html', root), 'utf8')
  ]);
  assert.match(server, /join\(__dirname, "dist"\)/);
  assert.match(server, /action="\.\/login"/);
  assert.match(server, /location: "\.\/"/);
  assert.equal((server.match(/location: "\.\/login"/g) || []).length, 2);
  assert.equal((app.match(/fetch\('\.\/api\/data'/g) || []).length, 2);
  assert.equal((app.match(/fetch\('\.\/api\/sync'/g) || []).length, 2);
  assert.match(vite, /base: '\.\/'/);
  assert.match(index, /src="\.\/src\/main\.jsx"/);
});

test('restored React dashboard declares the original key GUI elements', async () => {
  const sources = await Promise.all([
    'src/App.jsx',
    'src/components/MottoSection.jsx',
    'src/components/ChecklistSection.jsx',
    'src/components/DiarySection.jsx',
    'src/components/BackupSection.jsx'
  ].map((path) => readFile(new URL(path, root), 'utf8')));
  const html = sources.join('\n');
  for (const label of [
    '📈 주식투자 일일 점검기', '오늘의 종합 달성도', '투자 좌우명 진행',
    '점검사항 진행', '이번 주 평일 평균 달성도', '투자 좌우명 점검',
    '하루하루 점검사항', '투자 일기', '백업 받기 (Export)'
  ]) assert.ok(html.includes(label), `missing ${label}`);
  assert.match(html, /CalendarSection/);
});

test('production bundle uses relative assets and contains the React dashboard', async () => {
  const index = await readFile(new URL('dist/index.html', root), 'utf8');
  const assets = await readdir(new URL('dist/assets/', root));
  const script = assets.find((name) => name.endsWith('.js'));
  assert.ok(script, 'expected a Vite JavaScript bundle');
  const bundle = await readFile(new URL(`dist/assets/${script}`, root), 'utf8');
  assert.match(index, /\.\/assets\//);
  assert.match(bundle, /주식투자 일일 점검기/);
  assert.match(bundle, /오늘의 종합 달성도/);
});
