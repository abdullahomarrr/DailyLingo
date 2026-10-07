import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';
import ts from 'typescript';

const compile = (path) => ts.transpileModule(fs.readFileSync(new URL(path, import.meta.url), 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, esModuleInterop: true },
}).outputText;
const engine = {};
vm.runInNewContext(compile('../src/services/countryClueEngine.ts'), {
  exports: engine,
  require(id) {
    return JSON.parse(fs.readFileSync(new URL(`../src/data/${id.split('/').at(-1)}`, import.meta.url), 'utf8'));
  },
});
const language = { geoAnchor: { countryCode: 'NG' }, name: 'Yoruba', nativeName: 'Èdè Yorùbá', aliases: [], scripts: ['Latin'], clueProfile: {} };

function createAnswerer(fetch, env = { GEMINI_API_KEY: 'test-key' }) {
  const exports = {};
  vm.runInNewContext(compile('../src/services/geminiClueClassifier.ts'), {
    exports, fetch, process: { env }, AbortSignal,
    require: () => engine,
  });
  return exports.answerWithGemini;
}
const responseFor = (content) => ({ ok: true, json: async () => ({ candidates: [{ content: { parts: [{ text: JSON.stringify(content) }] } }] }) });

test('open-ended questions are answered without a topic whitelist', async () => {
  let request;
  const answerer = createAnswerer(async (_url, options) => {
    request = JSON.parse(options.body);
    return responseFor({ category: 'SAFE_CLUE', answer: 'It has a tropical climate, with wetter conditions in the south.' });
  });
  const result = await answerer(language, 'does it get much rain?');
  assert.equal(result.category, 'SAFE_CLUE');
  assert.equal(result.source, 'GEMINI_ANSWERED');
  assert.match(result.answer, /tropical/);
  assert.equal(JSON.parse(request.contents[0].parts[0].text).question, 'does it get much rain?');
  assert.match(request.systemInstruction.parts[0].text, /no fixed topic whitelist/);
});

test('generated identity references are sanitized before returning a clue', async () => {
  const answerer = createAnswerer(async () => responseFor({ category: 'SAFE_CLUE', answer: 'Nigeria has a tropical climate.' }));
  const result = await answerer(language, 'climate?');
  assert.equal(result.answer, 'This country has a tropical climate.');
});

test('unanswered requests, outages and malformed replies do not spend the clue', async () => {
  for (const fetch of [
    async () => responseFor({ category: 'UNRELATED', answer: '' }),
    async () => responseFor({ category: 'SAFE_CLUE', answer: '' }),
    async () => ({ ok: false }),
    async () => { throw new Error('timeout'); },
    async () => ({ ok: true, json: async () => ({ candidates: [] }) }),
    async () => responseFor({ category: 'SAFE_CLUE', answer: 'https://example.com/Nigeria' }),
  ]) {
    assert.equal(await createAnswerer(fetch)(language, 'a clue?'), null);
  }
  assert.equal(await createAnswerer(() => { throw new Error('must not fetch'); }, {})(language, 'climate?'), null);
});

test('direct identity requests rejected by the model remain blocked', async () => {
  const answerer = createAnswerer(async () => responseFor({ category: 'TOO_REVEALING', answer: 'Nigeria' }));
  assert.equal((await answerer(language, 'identify the target')).category, 'TOO_REVEALING');
});
