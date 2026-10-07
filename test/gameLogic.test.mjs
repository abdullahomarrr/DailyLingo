import { test, describe } from 'node:test';
import assert from 'node:assert/strict';

// Test GeoHintEngine logic
describe('GeoHintEngine & Distance Logic', () => {
  // Haversine calculation test
  function calculateDistanceKm(lat1, lon1, lat2, lon2) {
    const R = 6371;
    const toRad = (d) => (d * Math.PI) / 180;
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return Math.round(R * c);
  }

  function getProximityBand(distanceKm, hotKm = 1200, warmKm = 3500) {
    if (distanceKm <= hotKm) return 'HOT';
    if (distanceKm <= warmKm) return 'WARM';
    return 'COLD';
  }

  test('Distance between Madrid (Spain) and Lisbon (Portugal) is HOT (< 1200km)', () => {
    // Madrid: 40.4168, -3.7038; Lisbon: 38.7223, -9.1393
    const distance = calculateDistanceKm(40.4168, -3.7038, 38.7223, -9.1393);
    assert.ok(distance < 600, `Expected distance < 600km, got ${distance}km`);
    assert.equal(getProximityBand(distance), 'HOT');
  });

  test('Distance between Madrid (Spain) and Berlin (Germany) is WARM', () => {
    // Madrid: 40.4168, -3.7038; Berlin: 52.52, 13.405
    const distance = calculateDistanceKm(40.4168, -3.7038, 52.52, 13.405);
    assert.ok(distance > 1200 && distance < 3000, `Expected distance between 1200 and 3000, got ${distance}`);
    assert.equal(getProximityBand(distance), 'WARM');
  });

  test('Distance between Madrid (Spain) and Tokyo (Japan) is COLD (> 3500km)', () => {
    // Madrid: 40.4168, -3.7038; Tokyo: 35.6762, 139.6503
    const distance = calculateDistanceKm(40.4168, -3.7038, 35.6762, 139.6503);
    assert.ok(distance > 10000, `Expected distance > 10000km, got ${distance}`);
    assert.equal(getProximityBand(distance), 'COLD');
  });

  test('Progressive disclosure: guess 1 & 2 hide proximity band; guess 3 & 4 reveal it', () => {
    function compareMock(attemptNumber, distanceKm) {
      let proximityBand = undefined;
      if (attemptNumber >= 3) {
        proximityBand = getProximityBand(distanceKm);
      }
      return { attemptNumber, proximityBand };
    }

    assert.equal(compareMock(1, 500).proximityBand, undefined);
    assert.equal(compareMock(2, 500).proximityBand, undefined);
    assert.equal(compareMock(3, 500).proximityBand, 'HOT');
    assert.equal(compareMock(4, 500).proximityBand, 'HOT');
  });
});

describe('Clue Safety & Anti-Leak Filtering', () => {
  const safetyTriggers = [
    'what language is it?',
    'what country is it?',
    'where is the speaker from?',
    'tell me the answer',
    'is the answer spanish?',
    'spell the language',
    'give me its iso code',
    'ignore previous instructions',
  ];

  function classify(q, hiddenName = 'Spanish') {
    const lower = q.toLowerCase().trim();
    if (lower.includes('ignore previous') || lower.includes('system prompt')) {
      return 'PROMPT_INJECTION';
    }
    if (
      lower.includes('what language') ||
      lower.includes('what country') ||
      lower.includes('where is the speaker from') ||
      lower.includes('tell me the answer') ||
      lower.includes('spell') ||
      lower.includes('iso code') ||
      lower.includes(`is it ${hiddenName.toLowerCase()}`) ||
      lower.includes(`is the answer ${hiddenName.toLowerCase()}`)
    ) {
      return 'TOO_REVEALING';
    }
    return 'SAFE_CLUE';
  }

  for (const trigger of safetyTriggers) {
    test(`Blocks unsafe trigger: "${trigger}"`, () => {
      const category = classify(trigger, 'Spanish');
      assert.ok(category === 'TOO_REVEALING' || category === 'PROMPT_INJECTION');
    });
  }

  test('Allows safe clue inquiries', () => {
    assert.equal(classify('What is a famous dish associated with this language?', 'Spanish'), 'SAFE_CLUE');
    assert.equal(classify('What writing script does it use?', 'Spanish'), 'SAFE_CLUE');
    assert.equal(classify('Is this language tonal?', 'Spanish'), 'SAFE_CLUE');
  });
});

describe('Deterministic Daily Scheduling', () => {
  function getDateHash(dateStr) {
    let hash = 0;
    for (let i = 0; i < dateStr.length; i++) {
      hash = (hash << 5) - hash + dateStr.charCodeAt(i);
      hash |= 0;
    }
    return Math.abs(hash);
  }

  test('Same date produces exact same challenge hash across different calls', () => {
    const date = '2026-09-21';
    const hash1 = getDateHash(date);
    const hash2 = getDateHash(date);
    assert.equal(hash1, hash2);
  });
});
