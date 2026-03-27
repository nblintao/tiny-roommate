import { describe, it, expect } from 'vitest';
import { CHARACTERS, VOICE, voice, registerCharacter, removeCharacter, getSpriteSrc, isCustomCharacter } from '../characters.js';

describe('CHARACTERS', () => {
  var characterKeys = Object.keys(CHARACTERS).filter(k => k !== '_default');

  it('every character has defaultName and displayName', () => {
    characterKeys.forEach(key => {
      expect(CHARACTERS[key].defaultName, key + ' missing defaultName').toBeTruthy();
      expect(CHARACTERS[key].displayName, key + ' missing displayName').toBeTruthy();
    });
  });

  it('every character has a matching VOICE entry', () => {
    characterKeys.forEach(key => {
      expect(VOICE[key], key + ' missing from VOICE').toBeDefined();
    });
  });

  it('every VOICE entry has all required fields', () => {
    var required = ['greet', 'acks', 'petHold', 'petLines', 'petFallback', 'tapLines', 'tapFallback', 'chatFallback'];
    Object.keys(VOICE).forEach(key => {
      required.forEach(field => {
        expect(VOICE[key][field], key + ' missing ' + field).toBeDefined();
      });
    });
  });

  it('voice() returns _default for unknown sprite', () => {
    var result = voice({ currentSprite: 'nonexistent_thing' });
    expect(result).toBe(VOICE._default);
  });

  it('voice() returns correct entry for known sprite', () => {
    var result = voice({ currentSprite: 'tabby_cat' });
    expect(result).toBe(VOICE.tabby_cat);
  });

  it('every character has a sprite file referenced', () => {
    // Sprite files should be at public/sprites/{key}.png
    // This test just verifies the naming convention is consistent
    characterKeys.forEach(key => {
      expect(key).toMatch(/^[a-z][a-z0-9_]*$/, key + ' has invalid sprite key format');
    });
  });
});

describe('custom characters', () => {
  var testKey = '__test_custom_char';

  it('registerCharacter adds a custom character', () => {
    registerCharacter(testKey, 'Test Char', 'data:image/png;base64,abc', { defaultName: 'Testy' });
    expect(CHARACTERS[testKey]).toBeDefined();
    expect(CHARACTERS[testKey].displayName).toBe('Test Char');
    expect(CHARACTERS[testKey].defaultName).toBe('Testy');
    expect(CHARACTERS[testKey].custom).toBe(true);
    expect(VOICE[testKey]).toBeDefined();
  });

  it('getSpriteSrc returns custom data URL for custom character', () => {
    expect(getSpriteSrc(testKey)).toBe('data:image/png;base64,abc');
  });

  it('getSpriteSrc returns /sprites/ path for built-in character', () => {
    expect(getSpriteSrc('tabby_cat')).toBe('/sprites/tabby_cat.png');
  });

  it('isCustomCharacter returns true for custom, false for built-in', () => {
    expect(isCustomCharacter(testKey)).toBe(true);
    expect(isCustomCharacter('tabby_cat')).toBe(false);
  });

  it('removeCharacter deletes a custom character', () => {
    removeCharacter(testKey);
    expect(CHARACTERS[testKey]).toBeUndefined();
    expect(VOICE[testKey]).toBeUndefined();
  });

  it('removeCharacter does not delete built-in characters', () => {
    removeCharacter('tabby_cat');
    expect(CHARACTERS.tabby_cat).toBeDefined();
  });
});
