import assert from 'node:assert/strict';
import test from 'node:test';
import {
  loadLanguageFromStorage,
  SUPPORTED_LANGUAGES,
  TRANSLATIONS,
} from './i18n';
import { BuildingType, ZombieArchetype } from './types';

test('i18n defaults to English (en) as primary language and lists all 5 required languages', () => {
  const defaultLang = loadLanguageFromStorage();
  assert.equal(defaultLang, 'en');
  assert.deepEqual(
    SUPPORTED_LANGUAGES.map((l) => l.code),
    ['en', 'id', 'zh', 'vi', 'ru']
  );
});

test('all 5 languages (en, id, zh, vi, ru) provide complete translations for UI, buildings, upgrade paths, tasks, and zombies', () => {
  const buildings: BuildingType[] = [
    'palisade',
    'watchtower',
    'spiketrap',
    'campfire',
    'catapult',
    'guardtent',
  ];
  const zombies: ZombieArchetype[] = [
    'shamble',
    'grinner',
    'grumble',
    'gawp',
    'brine',
    'baron',
    'swift_stumbler',
    'armored_undead',
    'bone_howler',
  ];

  for (const { code } of SUPPORTED_LANGUAGES) {
    const t = TRANSLATIONS[code];
    assert.ok(t, `Missing translation dictionary for ${code}`);
    assert.ok(t.tagline.length > 5);
    assert.ok(t.playRunBtn(3).length > 3);
    assert.ok(t.padChooseBuildHeader('NW Pad').length > 5);
    assert.ok(t.translateTaskTitle('build_5_structures', '').length > 5);
    assert.ok(t.translatePadLabel(1, '').length > 3);
    assert.ok(t.translateLanternName('amber_default', '').length > 3);

    for (const b of buildings) {
      const bTrans = t.buildings[b];
      assert.ok(bTrans.name.length > 0, `${code} missing building name for ${b}`);
      assert.ok(bTrans.shortRole.length > 0, `${code} missing shortRole for ${b}`);
      assert.ok(bTrans.paths.pathA.name.length > 0, `${code} missing pathA name for ${b}`);
      assert.ok(bTrans.paths.pathB.name.length > 0, `${code} missing pathB name for ${b}`);
    }

    for (const z of zombies) {
      const zTrans = t.zombies[z];
      assert.ok(zTrans.name.length > 0, `${code} missing zombie name for ${z}`);
      assert.ok(zTrans.specialTrait.length > 0, `${code} missing specialTrait for ${z}`);
      assert.ok(zTrans.tacticalCounter.length > 0, `${code} missing tacticalCounter for ${z}`);
    }
  }
});
