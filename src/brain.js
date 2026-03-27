// LLM Brain — pet's intelligence powered by Claude CLI (Haiku)

import { Command } from '@tauri-apps/plugin-shell';

// Run a shell command and stream stdout to avoid buffer overflow on large output
function runShellStream(script) {
  return new Promise(function(resolve, reject) {
    var chunks = [];
    var child = Command.create('bash', ['-lc', script]);
    child.on('close', function(data) {
      resolve({ code: data.code, stdout: chunks.join('') });
    });
    child.on('error', reject);
    child.stdout.on('data', function(line) { chunks.push(line); });
    child.spawn();
  });
}

export let PET_DATA_PATH = '';
let petDataReady = false;

async function resolvePetDataPaths() {
  // Tauri binary runs from src-tauri/, so walk up to find project root (where package.json lives)
  const result = await Command.create('bash', ['-lc',
    'dir=$(pwd); while [ ! -f "$dir/package.json" ] && [ "$dir" != "/" ]; do dir=$(dirname "$dir"); done; echo "$dir"'
  ]).execute();
  const projectRoot = (result.stdout || '').trim();
  const dataPath = projectRoot + '/.pet-data';
  return { dataPath, projectRoot };
}

// Structured config loaded from frontmatter
let config = {
  pet: { name: 'Mochi', born: '' },
  owner: { name: '' },
  sprite: 'tabby_cat',
  screen_interval_min: 2,
};

function shellQuote(value) {
  return "'" + String(value).replace(/'/g, `'\\''`) + "'";
}

async function runShell(script) {
  return Command.create('bash', ['-lc', script]).execute();
}

async function seedPetDataIfNeeded(projectRoot) {
  var dataPath = shellQuote(projectRoot + '/.pet-data');
  var templatePath = shellQuote(projectRoot + '/.pet-data-template');
  var now = new Date();
  var timestamp = now.toISOString();
  // If .pet-data doesn't exist, copy from template and stamp born date
  await runShell(
    '[ -d ' + dataPath + ' ] || { cp -R ' + templatePath + ' ' + dataPath +
    ' && perl -i -pe ' + shellQuote('s/^born:.*/born: ' + timestamp + '/') + ' ' + dataPath + '/config.md; }'
  );
}

export async function ensurePetDataPath() {
  if (petDataReady && PET_DATA_PATH) return PET_DATA_PATH;
  const { dataPath, projectRoot } = await resolvePetDataPaths();
  await seedPetDataIfNeeded(projectRoot);
  PET_DATA_PATH = dataPath;
  petDataReady = true;
  return PET_DATA_PATH;
}

// --- Custom sprite management ---

export async function loadCustomSprites() {
  var petDataPath = await ensurePetDataPath();
  var spritesDir = petDataPath + '/sprites';
  // Ensure sprites directory exists
  await runShell('mkdir -p ' + shellQuote(spritesDir));
  // List PNG files
  var result = await runShell('ls ' + shellQuote(spritesDir) + '/*.png 2>/dev/null || true');
  var files = (result.stdout || '').trim().split('\n').filter(Boolean);
  var sprites = [];
  for (var i = 0; i < files.length; i++) {
    var filePath = files[i].trim();
    if (!filePath) continue;
    var key = filePath.split('/').pop().replace(/\.png$/, '');
    // Use streaming read to avoid stdout buffer overflow on large PNGs
    var b64Result = await runShellStream('base64 < ' + shellQuote(filePath));
    var b64 = (b64Result.stdout || '').replace(/\s/g, '');
    if (!b64) continue;

    var entry = {
      key: key,
      displayName: key.replace(/_/g, ' ').replace(/\b\w/g, function(c) { return c.toUpperCase(); }),
      dataUrl: 'data:image/png;base64,' + b64,
      voice: null,
    };

    // Try reading companion JSON metadata
    var jsonPath = spritesDir + '/' + key + '.json';
    try {
      var jsonResult = await runShell('cat ' + shellQuote(jsonPath) + ' 2>/dev/null');
      var jsonText = (jsonResult.stdout || '').trim();
      if (jsonText) {
        var meta = JSON.parse(jsonText);
        if (meta.displayName) entry.displayName = meta.displayName;
        if (meta.defaultName) entry.defaultName = meta.defaultName;
        if (meta.voice) entry.voice = meta.voice;
      }
    } catch (e) {
      // No JSON file or invalid JSON — that's fine
    }

    sprites.push(entry);
  }
  return sprites;
}

export async function importCustomSprite(fileName, srcPath) {
  var { projectRoot } = await resolvePetDataPaths();
  var petDataPath = await ensurePetDataPath();
  var spritesDir = petDataPath + '/sprites';
  var destPath = spritesDir + '/' + fileName;
  var script = projectRoot + '/scripts/process-spritesheet-v4.py';
  await runShell('mkdir -p ' + shellQuote(spritesDir));
  // Find a working python3 (homebrew or system)
  var py = 'python3';
  var pyCheck = await runShell('/opt/homebrew/bin/python3 -c "import numpy" 2>/dev/null && echo ok');
  if ((pyCheck.stdout || '').trim() === 'ok') py = '/opt/homebrew/bin/python3';
  // Run the sprite sheet processor (handles background removal, de-spill, resize)
  var result = await runShell(
    py + ' ' + shellQuote(script) +
    ' ' + shellQuote(srcPath) +
    ' -o ' + shellQuote(destPath) +
    ' --cols 8 --rows 9 --target 128'
  );
  if (result.code !== 0) {
    throw new Error('Sprite processing failed: ' + (result.stderr || ''));
  }
}

export async function deleteCustomSprite(key) {
  var petDataPath = await ensurePetDataPath();
  var filePath = petDataPath + '/sprites/' + key + '.png';
  await runShell('rm -f ' + shellQuote(filePath));
}

// --- Sprite spec prompt ---

export async function readSpecPrompt() {
  var { projectRoot } = await resolvePetDataPaths();
  var result = await runShell('cat ' + shellQuote(projectRoot + '/SPRITE-SPEC.md'));
  var text = (result.stdout || '');
  // Extract the code block under "## Generation Prompt"
  var match = text.match(/## Generation Prompt[\s\S]*?```\n([\s\S]*?)```/);
  return match ? match[1].trim() : '';
}

// --- File picker via osascript ---

export async function pickAndReadPng() {
  var result = await runShell(
    "osascript -e 'POSIX path of (choose file of type {\"public.png\"} with prompt \"Choose a sprite sheet PNG\")'"
  );
  var filePath = (result.stdout || '').trim();
  if (!filePath) return null;
  var fileName = filePath.split('/').pop();
  return { fileName: fileName, filePath: filePath };
}

// --- Frontmatter parsing ---

function parseFrontmatter(text) {
  const match = text.match(/^---\n([\s\S]*?)\n---/);
  if (!match) return { fields: {}, body: text };
  const fields = {};
  for (const line of match[1].split('\n')) {
    const idx = line.indexOf(':');
    if (idx > 0) {
      fields[line.slice(0, idx).trim()] = line.slice(idx + 1).trim();
    }
  }
  return { fields, body: text.slice(match[0].length).trim() };
}

function serializeFrontmatter(fields, body) {
  const lines = Object.entries(fields).map(([k, v]) => k + ': ' + v);
  return '---\n' + lines.join('\n') + '\n---\n\n' + body + '\n';
}

// --- File I/O via shell ---

async function readPetFile(filename) {
  try {
    const petDataPath = await ensurePetDataPath();
    const result = await runShell('cat ' + shellQuote(petDataPath + '/' + filename));
    return (result.stdout || '').trim();
  } catch {
    return '';
  }
}

async function writePetFile(filename, content) {
  try {
    const petDataPath = await ensurePetDataPath();
    // Use base64 to avoid shell escaping issues
    const b64 = btoa(unescape(encodeURIComponent(content)));
    await runShell('mkdir -p ' + shellQuote((petDataPath + '/' + filename).split('/').slice(0, -1).join('/')) + ' && echo "' + b64 + '" | base64 -d > ' + shellQuote(petDataPath + '/' + filename));
  } catch (err) {
    console.error('Failed to write ' + filename + ':', err);
  }
}

// --- Config loading/saving ---

export async function loadConfig() {
  const configRaw = await readPetFile('config.md');

  if (configRaw) {
    const { fields } = parseFrontmatter(configRaw);
    if (fields.pet_name) config.pet.name = fields.pet_name;
    if (fields.born) config.pet.born = fields.born;
    if (fields.owner_name) config.owner.name = fields.owner_name;
    if (fields.sprite) config.sprite = fields.sprite;
    if (fields.screen_interval_min) config.screen_interval_min = Number(fields.screen_interval_min) || 2;
  }

  return { ...config, pet: { ...config.pet }, owner: { ...config.owner } };
}

var configWriteQueue = Promise.resolve();

export function saveConfigField(key, value) {
  // Update in-memory config immediately
  if (key === 'pet_name') config.pet.name = value;
  if (key === 'born') config.pet.born = value;
  if (key === 'owner_name') config.owner.name = value;
  if (key === 'sprite') config.sprite = value;
  if (key === 'screen_interval_min') config.screen_interval_min = Number(value) || 2;

  // Queue file writes so concurrent calls don't clobber each other
  configWriteQueue = configWriteQueue.then(async function() {
    const raw = await readPetFile('config.md');
    const { fields, body } = parseFrontmatter(raw);
    fields[key] = value;
    await writePetFile('config.md', serializeFrontmatter(fields, body));
  }).catch(function(err) {
    console.error('Failed to save config field ' + key + ':', err);
  });

  return configWriteQueue;
}

export function getConfig() {
  return { ...config, pet: { ...config.pet }, owner: { ...config.owner } };
}

// --- System prompt ---

function buildSystemPrompt() {
  let prompt = 'Read the CLAUDE.md in your working directory for instructions.';
  if (config.pet.name) {
    prompt += ' Your name is ' + config.pet.name + '.';
  }
  if (config.owner.name) {
    prompt += ' Call your owner "' + config.owner.name + '".';
  }
  prompt += ' Then respond to the situation below.';
  return prompt;
}

// --- Activity log ---

let activityLog = [];

export function logActivity(entry) {
  const time = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  activityLog.push({ time, ...entry });
  if (activityLog.length > 50) activityLog.shift();

  const description = entry.description || entry.type || '';
  if (description && claudeAvailable) {
    claudeInPetDir([
      '--print', '--output-format', 'text', '--model', 'haiku',
      '--tools', 'Write,Edit', '--dangerously-skip-permissions',
      '-p', 'Append this line to me-journal.md (do NOT overwrite existing content, use Edit to add at the end): "- [' + time + '] ' + description.replace(/"/g, '\\"') + '"',
    ]).catch(err => console.error('Failed to write journal:', err));
  }
}

export function getActivityLog() {
  return [...activityLog];
}

// --- LLM response parsing ---

export function parseResponse(raw) {
  var text = '';
  var state = 'idle';
  var reactions = [];

  // Find the last JSON object in the output (skip any reasoning the LLM leaked)
  var jsonMatch = raw.match(/\{[\s\S]*?\}/g);
  if (jsonMatch) {
    for (var i = jsonMatch.length - 1; i >= 0; i--) {
      try {
        var parsed = JSON.parse(jsonMatch[i]);
        if (parsed.state) {
          state = parsed.state;
          if (parsed.text) text = parsed.text;
          if (parsed.r && Array.isArray(parsed.r)) reactions = parsed.r.slice(0, 2);
          // Fall back to text appearing before the JSON block
          if (!text) {
            var beforeJson = raw.slice(0, raw.indexOf(jsonMatch[i])).trim();
            if (beforeJson) text = beforeJson.replace(/^["']|["']$/g, '').trim();
          }
          break;
        }
      } catch {}
    }
  }

  // Clean up: strip markdown, code blocks, tool artifacts, reasoning
  if (text) {
    text = text
      .replace(/```[\s\S]*?```/g, '')           // code blocks
      .replace(/```\w*/g, '')                    // unclosed code fences
      .replace(/\*\*([^*]+)\*\*/g, '$1')        // **bold**
      .replace(/\*([^*]+)\*/g, '$1')            // *italic*
      .replace(/<[^>]+>[\s\S]*?<\/[^>]+>/g, '') // XML tags
      .replace(/^---[\s\S]*?---/gm, '')         // frontmatter blocks
      .replace(/^#+ .*/gm, '')                  // headings
      .replace(/^- .*/gm, '')                   // list items
      .trim();

    // Take only the last meaningful line (likely the actual dialogue)
    var lines = text.split('\n').map(function(l) { return l.trim(); }).filter(Boolean);
    if (lines.length > 1) text = lines[lines.length - 1];

    if (text.length > 80) {
      var firstSentence = text.match(/^[^.!?。！？]+[.!?。！？]/);
      if (firstSentence) text = firstSentence[0].trim();
    }
  }

  return { text, state, reactions };
}

// --- Claude CLI ---

var claudeAvailable = null; // null = unchecked, true/false after check

export async function checkClaudeCli() {
  if (claudeAvailable !== null) return claudeAvailable;
  try {
    var result = await Command.create('claude', ['--version']).execute();
    claudeAvailable = result.code === 0;
  } catch {
    claudeAvailable = false;
  }
  return claudeAvailable;
}

export function isClaudeAvailable() {
  return claudeAvailable === true;
}

function claudeInPetDir(args) {
  return ensurePetDataPath().then(function(petDataPath) {
    return Command.create('claude', args, { cwd: petDataPath }).execute();
  });
}

export async function think(context) {
  if (!claudeAvailable) return null;

  const recentActivity = activityLog.length > 0
    ? '\nRecent activity log:\n' + activityLog.slice(-5).map(a => '- ' + a.time + ': ' + (a.description || a.type)).join('\n')
    : '';

  const systemPrompt = buildSystemPrompt();
  const fullPrompt = systemPrompt + recentActivity + '\n\nCurrent situation: ' + context + '\n\nRespond:';

  try {
    const result = await claudeInPetDir([
      '--print',
      '--output-format', 'text',
      '--model', 'haiku',
      '--tools', 'Read,Write,Edit',
      '--dangerously-skip-permissions',
      '-p', fullPrompt,
    ]);

    const output = (result.stdout || '').trim();
    console.log('🐱 Raw LLM:', output);

    if (output) {
      return parseResponse(output);
    }
  } catch (err) {
    console.error('🐱 LLM error:', err);
  }

  return null;
}

// --- Daily digest ---

export async function generateDailyDigest() {
  if (!claudeAvailable || activityLog.length < 3) return null;

  const logText = activityLog.map(a => `${a.time}: ${a.description || a.type}`).join('\n');
  const petName = config.pet.name || 'Mochi';

  try {
    const result = await Command.create('claude', [
      '--print',
      '--output-format', 'text',
      '--model', 'haiku',
      '-p', `You are ${petName} the cat. Summarize your owner's day in 2-3 short sentences based on this activity log. Be casual and cute, like a cat observing its human.\n\nActivity log:\n${logText}\n\nDaily summary:`,
    ]).execute();

    return (result.stdout || '').trim();
  } catch {
    return null;
  }
}
