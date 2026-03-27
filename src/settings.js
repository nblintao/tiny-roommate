// Settings panel, context menu, sprite selection

import { invoke } from '@tauri-apps/api/core';
import { SpriteAnimator, getSpriteRenderOptions } from './sprite.js';
import { saveConfigField, getConfig, importCustomSprite, deleteCustomSprite, readSpecPrompt, pickAndReadPng, loadCustomSprites } from './brain.js';
import { CHARACTERS, getSpriteSrc, registerCharacter, removeCharacter, isCustomCharacter } from './characters.js';
import { t, setLocale, getLocale, detectLocale, applyI18nToDOM } from './i18n.js';

var SETTINGS_SIZE = { width: 560, height: 580 };

var PREVIEW_SEQUENCE = [
  { state: 'idle', duration: 1100 },
  { state: 'looking_around', duration: 1300 },
  { state: 'walk', duration: 1100 },
  { state: 'happy', duration: 1500 },
  { state: 'playful', duration: 1500 },
];

function buildSpritePicker(container, pet) {
  container.innerHTML = '';
  Object.keys(CHARACTERS).forEach(function(key) {
    if (key === '_default') return;
    var char = CHARACTERS[key];
    var btn = document.createElement('button');
    btn.className = 'sprite-option';
    if (key === pet.currentSprite) btn.classList.add('active');
    btn.dataset.sprite = key;

    // Wrapper for canvas + delete button
    var canvasWrap = document.createElement('div');
    canvasWrap.className = 'sprite-preview-wrap';

    var cvs = document.createElement('canvas');
    cvs.className = 'sprite-preview';
    cvs.dataset.src = getSpriteSrc(key);
    cvs.width = 128;
    cvs.height = 128;
    canvasWrap.appendChild(cvs);

    // Delete button for custom characters
    if (isCustomCharacter(key)) {
      var del = document.createElement('span');
      del.className = 'sprite-delete';
      del.textContent = '\u00d7';
      del.title = t('ui.remove');
      del.dataset.spriteKey = key;
      canvasWrap.appendChild(del);
    }

    var span = document.createElement('span');
    span.textContent = char.displayName || key;
    btn.appendChild(canvasWrap);
    btn.appendChild(span);
    container.appendChild(btn);
  });

  // "Add custom" button
  var addBtn = document.createElement('button');
  addBtn.className = 'sprite-option sprite-add';
  addBtn.id = 'sprite-add-btn';
  var addIcon = document.createElement('div');
  addIcon.className = 'sprite-add-icon';
  addIcon.textContent = '+';
  var addLabel = document.createElement('span');
  addLabel.textContent = t('ui.import');
  addBtn.appendChild(addIcon);
  addBtn.appendChild(addLabel);
  container.appendChild(addBtn);
}

function showImportGuide(pet, onDone) {
  var overlay = document.getElementById('import-guide-overlay');
  if (!overlay) {
    overlay = document.createElement('div');
    overlay.id = 'import-guide-overlay';
    overlay.innerHTML =
      '<div class="import-guide-panel">' +
        '<div class="import-guide-header">' +
          '<h3 data-i18n="ui.importTitle">Import Custom Character</h3>' +
          '<button class="import-guide-close" id="import-guide-close">&times;</button>' +
        '</div>' +
        '<div class="import-guide-body">' +
          '<div class="import-guide-prompt">' +
            '<div class="prompt-label" data-i18n="ui.importPromptLabel">Copy this prompt for AI image generation (Gemini, ChatGPT, Midjourney, etc.):</div>' +
            '<div class="prompt-text" id="import-prompt-text" data-i18n="ui.importLoading">Loading...</div>' +
            '<button class="prompt-copy" id="import-copy-prompt" data-i18n="ui.copy">Copy</button>' +
          '</div>' +
          '<div class="import-guide-actions">' +
            '<button class="import-btn" id="import-select-file" data-i18n="ui.importChooseFile">Choose PNG file...</button>' +
          '</div>' +
        '</div>' +
      '</div>';
    document.body.appendChild(overlay);
  }

  applyI18nToDOM(overlay);
  overlay.classList.add('show');

  // Load prompt from SPRITE-SPEC.md
  var promptEl = document.getElementById('import-prompt-text');
  var cachedPrompt = '';
  readSpecPrompt().then(function(prompt) {
    cachedPrompt = prompt;
    promptEl.textContent = prompt || t('ui.importSpecNotFound');
  });

  var closeBtn = document.getElementById('import-guide-close');
  var selectBtn = document.getElementById('import-select-file');

  function close() {
    overlay.classList.remove('show');
    closeBtn.removeEventListener('click', close);
    overlay.removeEventListener('click', onOverlayClick);
  }

  function onOverlayClick(e) {
    if (e.target === overlay) close();
  }

  closeBtn.addEventListener('click', close);
  overlay.addEventListener('click', onOverlayClick);

  var copyBtn = document.getElementById('import-copy-prompt');
  copyBtn.onclick = function() {
    if (!cachedPrompt) return;
    navigator.clipboard.writeText(cachedPrompt).then(function() {
      copyBtn.textContent = t('ui.copied');
      setTimeout(function() { copyBtn.textContent = t('ui.copy'); }, 1500);
    });
  };

  selectBtn.onclick = function() {
    var errEl = overlay.querySelector('.import-error');
    if (!errEl) {
      errEl = document.createElement('div');
      errEl.className = 'import-error';
      overlay.querySelector('.import-guide-actions').appendChild(errEl);
    }
    errEl.textContent = '';

    pickAndReadPng().then(function(result) {
      if (!result) return;
      errEl.textContent = t('ui.importProcessing');
      selectBtn.style.pointerEvents = 'none';
      selectBtn.style.opacity = '0.5';
      return doImport(result.fileName, result.filePath, pet, onDone).then(function() {
        close();
      });
    }).catch(function(err) {
      console.error('Import failed:', err);
      errEl.textContent = t('ui.importError');
      selectBtn.style.pointerEvents = '';
      selectBtn.style.opacity = '';
    });
  };
}

function doImport(fileName, srcPath, pet, onDone) {
  // Derive key from filename
  var key = fileName.replace(/\.png$/, '').toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');
  if (!key) key = 'custom_' + Date.now();

  // Avoid collision with built-in characters
  if (CHARACTERS[key] && !isCustomCharacter(key)) {
    key = key + '_custom';
  }

  var displayName = key.replace(/_/g, ' ').replace(/\b\w/g, function(c) { return c.toUpperCase(); });

  // Process sprite sheet (background removal, de-spill, resize to 1024×1152)
  return importCustomSprite(key + '.png', srcPath).then(function() {
    // Re-read the processed file for the data URL
    return loadCustomSprites();
  }).then(function(sprites) {
    var match = sprites.find(function(s) { return s.key === key; });
    if (match) {
      registerCharacter(key, displayName, match.dataUrl);
    }
    if (onDone) onDone();
  });
}

export function initSettings(pet) {
  var contextMenu = document.getElementById('context-menu');
  var settingsOverlay = document.getElementById('settings-overlay');
  var normalSize = null;
  var normalPos = null;
  var previewAnimId = null;
  var previewAnimators = [];
  var spriteContainer = document.getElementById('sprite-options');

  // Build sprite picker from CHARACTERS data
  buildSpritePicker(spriteContainer, pet);

  // --- Right-click context menu ---
  document.addEventListener('contextmenu', function(e) {
    e.preventDefault();
    contextMenu.classList.add('show');
    var menuH = contextMenu.offsetHeight;
    var menuW = contextMenu.offsetWidth;
    var winW = window.innerWidth;
    var winH = window.innerHeight;
    var x = Math.min(e.clientX, winW - menuW - 5);
    var y = e.clientY - menuH;
    if (y < 5) y = e.clientY;
    contextMenu.style.left = Math.max(5, x) + 'px';
    contextMenu.style.top = Math.max(5, y) + 'px';
  });

  document.addEventListener('click', function() {
    contextMenu.classList.remove('show');
  });

  // Settings button
  document.getElementById('menu-settings').addEventListener('click', function() {
    contextMenu.classList.remove('show');
    openSettings();
  });

  // Inspect Element
  document.getElementById('menu-inspect').addEventListener('click', function() {
    contextMenu.classList.remove('show');
    invoke('toggle_devtools').catch(function() {});
  });

  // Quit
  document.getElementById('menu-quit').addEventListener('click', function() {
    pet.appWindow.close();
  });

  // --- Settings panel ---
  function refreshPicker() {
    stopPreviewAnimations();
    buildSpritePicker(spriteContainer, pet);
    if (settingsOverlay.classList.contains('show')) {
      startPreviewAnimations();
    }
  }

  // Expose for main.js to call after loading custom characters
  pet._refreshSpritePicker = refreshPicker;

  function openSettings() {
    document.getElementById('setting-pet-name').value = pet.petName;
    document.getElementById('setting-owner-name').value = pet.ownerName;
    document.getElementById('setting-screen-interval-min').value = String(getConfig().screen_interval_min || 2);
    document.getElementById('setting-language').value = getConfig().language || 'auto';

    // Update interval option labels for current language
    var intervalSelect = document.getElementById('setting-screen-interval-min');
    Array.prototype.forEach.call(intervalSelect.options, function(opt) {
      opt.textContent = t('ui.minutes', { n: opt.value });
    });

    applyI18nToDOM();
    refreshPicker();

    // Resize window to fit settings panel
    pet.appWindow.outerPosition().then(function(pos) {
      normalPos = pos;
      return pet.appWindow.innerSize();
    }).then(function(sz) {
      normalSize = sz;
      var scale = window.devicePixelRatio || 1;
      return pet.appWindow.setSize({
        type: 'Physical',
        width: Math.round(SETTINGS_SIZE.width * scale),
        height: Math.round(SETTINGS_SIZE.height * scale)
      });
    }).then(function() {
      // Re-center around the old position
      if (normalPos && normalSize) {
        var scale = window.devicePixelRatio || 1;
        var dx = Math.round((SETTINGS_SIZE.width * scale - normalSize.width) / 2);
        var dy = Math.round((SETTINGS_SIZE.height * scale - normalSize.height) / 2);
        pet.appWindow.setPosition({
          type: 'Physical',
          x: Math.max(0, normalPos.x - dx),
          y: Math.max(0, normalPos.y - dy)
        }).catch(function() {});
      }
    }).catch(function() {});

    settingsOverlay.classList.add('show');
    startPreviewAnimations();
  }

  function closeSettings() {
    var newPetName = document.getElementById('setting-pet-name').value.trim();
    var newOwnerName = document.getElementById('setting-owner-name').value.trim();

    if (newPetName && newPetName !== pet.petName) {
      pet.petName = newPetName;
      saveConfigField('pet_name', pet.petName);
      document.getElementById('chat-input').placeholder = t('ui.chatPlaceholder', { petName: pet.petName });
      pet.showBubble(t('msg.renamed', { petName: pet.petName }), 3000, true);
    }

    if (newOwnerName !== pet.ownerName) {
      pet.ownerName = newOwnerName;
      saveConfigField('owner_name', pet.ownerName);
    }

    var newInterval = Number(document.getElementById('setting-screen-interval-min').value);
    if (newInterval && newInterval !== getConfig().screen_interval_min) {
      saveConfigField('screen_interval_min', newInterval);
    }

    var newLang = document.getElementById('setting-language').value;
    if (newLang !== (getConfig().language || 'auto')) {
      saveConfigField('language', newLang);
      var effectiveLocale = newLang === 'auto' ? detectLocale() : newLang;
      setLocale(effectiveLocale);
      applyI18nToDOM();
      document.getElementById('chat-input').placeholder = t('ui.chatPlaceholder', { petName: pet.petName });
    }

    settingsOverlay.classList.remove('show');
    stopPreviewAnimations();

    // Restore window size
    if (normalSize && normalPos) {
      pet.appWindow.setSize({ type: 'Physical', width: normalSize.width, height: normalSize.height }).then(function() {
        return pet.appWindow.setPosition({ type: 'Physical', x: normalPos.x, y: normalPos.y });
      }).catch(function() {});
    }
  }

  // Animated idle previews for character selection
  function startPreviewAnimations() {
    stopPreviewAnimations();

    var previews = document.querySelectorAll('.sprite-preview');
    previewAnimators = Array.prototype.map.call(previews, function(cvs, index) {
      var animator = new SpriteAnimator(cvs, cvs.dataset.src, Object.assign(
        { scale: 1 },
        getSpriteRenderOptions(cvs.dataset.src.split('/').pop().replace(/\.png$/, ''))
      ));
      return {
        animator: animator,
        sequenceIndex: index % PREVIEW_SEQUENCE.length,
        nextTransitionAt: 0
      };
    });

    function queueNextPreviewState(entry, ts, force) {
      if (!force && ts < entry.nextTransitionAt) return;

      var step = PREVIEW_SEQUENCE[entry.sequenceIndex];
      entry.animator.setState(step.state);
      entry.nextTransitionAt = ts + step.duration;
      entry.sequenceIndex = (entry.sequenceIndex + 1) % PREVIEW_SEQUENCE.length;
    }

    function animate(ts) {
      if (!settingsOverlay.classList.contains('show')) return;

      previewAnimators.forEach(function(entry, index) {
        if (!entry.nextTransitionAt) {
          queueNextPreviewState(entry, ts + index * 220, true);
        } else {
          queueNextPreviewState(entry, ts, false);
        }
        entry.animator.update(ts);
      });

      previewAnimId = requestAnimationFrame(animate);
    }

    previewAnimId = requestAnimationFrame(animate);
  }

  function stopPreviewAnimations() {
    if (previewAnimId) {
      cancelAnimationFrame(previewAnimId);
      previewAnimId = null;
    }
    previewAnimators = [];
  }

  document.getElementById('settings-close').addEventListener('click', closeSettings);
  settingsOverlay.addEventListener('click', function(e) {
    if (e.target === settingsOverlay) closeSettings();
  });

  // Event delegation for sprite selection and actions
  spriteContainer.addEventListener('click', function(e) {
    // Handle delete button
    var del = e.target.closest('.sprite-delete');
    if (del) {
      e.stopPropagation();
      var delKey = del.dataset.spriteKey;
      if (delKey && confirm(t('ui.removeConfirm', { name: CHARACTERS[delKey].displayName || delKey }))) {
        // If currently selected, switch to tabby_cat
        if (pet.currentSprite === delKey) {
          pet.currentSprite = 'tabby_cat';
          pet.sprite.image.src = getSpriteSrc('tabby_cat');
          pet.sprite.edgeClear = getSpriteRenderOptions('tabby_cat').edgeClear || 0;
          saveConfigField('sprite', 'tabby_cat');
          var defaultChar = CHARACTERS.tabby_cat;
          pet.petName = defaultChar.defaultName;
          document.getElementById('setting-pet-name').value = defaultChar.defaultName;
          document.getElementById('chat-input').placeholder = t('ui.chatPlaceholder', { petName: pet.petName });
          saveConfigField('pet_name', defaultChar.defaultName);
        }
        deleteCustomSprite(delKey).then(function() {
          removeCharacter(delKey);
          refreshPicker();
        });
      }
      return;
    }

    // Handle add button
    var addBtn = e.target.closest('.sprite-add');
    if (addBtn) {
      showImportGuide(pet, refreshPicker);
      return;
    }

    // Handle sprite selection
    var btn = e.target.closest('.sprite-option');
    if (!btn || btn.classList.contains('sprite-add')) return;

    var spriteName = btn.dataset.sprite;
    if (spriteName && spriteName !== pet.currentSprite) {
      // Only suggest default name if user hasn't customized it
      var oldCharInfo = CHARACTERS[pet.currentSprite] || CHARACTERS._default;
      var currentInput = document.getElementById('setting-pet-name').value.trim();
      var nameIsDefault = !currentInput || currentInput === oldCharInfo.defaultName;

      pet.currentSprite = spriteName;
      pet.sprite.image.src = getSpriteSrc(spriteName);
      pet.sprite.edgeClear = getSpriteRenderOptions(spriteName).edgeClear || 0;

      saveConfigField('sprite', spriteName);

      var charInfo = CHARACTERS[spriteName] || CHARACTERS._default;
      if (nameIsDefault) {
        pet.petName = charInfo.defaultName;
        document.getElementById('setting-pet-name').value = charInfo.defaultName;
        document.getElementById('chat-input').placeholder = t('ui.chatPlaceholder', { petName: pet.petName });
        saveConfigField('pet_name', charInfo.defaultName);
        pet.showBubble(t('msg.charChanged', { name: charInfo.defaultName }), 2000, true);
      }
    }
    spriteContainer.querySelectorAll('.sprite-option').forEach(function(b) {
      b.classList.toggle('active', b.dataset.sprite === pet.currentSprite);
    });
  });

  // Keyboard shortcut for Inspect
  document.addEventListener('keydown', function(e) {
    if (e.metaKey && e.altKey && e.key === 'i') {
      if (window.__TAURI_INTERNALS__) {
        window.__TAURI_INTERNALS__.invoke('plugin:webview|internal_toggle_devtools');
      }
    }
    if (e.key === 'Escape' && settingsOverlay.classList.contains('show')) {
      closeSettings();
    }
  });
}
