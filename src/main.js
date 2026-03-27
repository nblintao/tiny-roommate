// TinyRoommate — Main Entry Point
import { getCurrentWindow } from '@tauri-apps/api/window';
import { SpriteAnimator, getSpriteRenderOptions } from './sprite.js';
import { trackActivity } from './signals.js';
import { loadConfig, loadCustomSprites } from './brain.js';
import { voice, registerCharacter, getSpriteSrc, CHARACTERS } from './characters.js';
import { initHearts } from './hearts.js';
import { initBubble } from './bubble-manager.js';
import { initBehavior } from './behavior.js';
import { initInteraction } from './interaction.js';
import { initSettings } from './settings.js';

// Shared state object — passed to all modules
var pet = {
  canvas: document.getElementById('pet'),
  appWindow: getCurrentWindow(),
  sprite: null,
  currentSprite: 'tabby_cat',
  petName: 'Mochi',
  ownerName: '',
  isWalking: false,
  llmBusy: false,
  dragStarted: false,
  lastInteractionTime: 0,
  lastScreenCapture: 0,
  lastScreenContext: null,
  mouseNearPet: false,
  // Filled by init functions
  showBubble: null,
  gainHeart: null,
  isSick: false,
  walkRandomDirection: null,
  voice: function() { return voice(pet); },
};

pet.sprite = new SpriteAnimator(
  pet.canvas,
  '/sprites/' + pet.currentSprite + '.png',
  getSpriteRenderOptions(pet.currentSprite)
);
trackActivity();

// Init modules
var hearts = initHearts(pet);
pet.gainHeart = hearts.gainHeart;
Object.defineProperty(pet, 'isSick', { get: function() { return hearts.isSick; } });

var bubble = initBubble(pet);
pet.showBubble = bubble.showBubble;

var behavior = initBehavior(pet);
pet.walkRandomDirection = behavior.walkRandomDirection;

initInteraction(pet);
initSettings(pet);

// Animation loop
function animationLoop(timestamp) {
  pet.sprite.update(timestamp);
  requestAnimationFrame(animationLoop);
}
requestAnimationFrame(animationLoop);

// Load config, custom characters, and start
loadConfig().then(function(cfg) {
  pet.petName = cfg.pet.name;
  pet.ownerName = cfg.owner.name;

  // Load custom sprites, then apply saved character
  return loadCustomSprites().then(function(customSprites) {
    customSprites.forEach(function(s) {
      registerCharacter(s.key, s.displayName, s.dataUrl, {
        defaultName: s.defaultName,
        voice: s.voice,
      });
    });
  }).catch(function(err) {
    console.error('Failed to load custom sprites:', err);
  }).then(function() {
    if (cfg.sprite && cfg.sprite !== pet.currentSprite) {
      // Only apply if the character actually exists (built-in or custom)
      if (CHARACTERS[cfg.sprite]) {
        pet.currentSprite = cfg.sprite;
        pet.sprite.image.src = getSpriteSrc(pet.currentSprite);
        pet.sprite.edgeClear = getSpriteRenderOptions(pet.currentSprite).edgeClear || 0;
      }
    }

    // Refresh settings picker with custom characters
    if (pet._refreshSpritePicker) pet._refreshSpritePicker();
  });
}).then(function() {
  document.getElementById('chat-input').placeholder = 'Say something to ' + pet.petName + '...';
  hearts.updateTogether();
}).catch(function(err) {
  console.error('Failed to load config/sprites:', err);
});

behavior.start();
