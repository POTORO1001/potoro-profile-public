const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');

const root = path.resolve(__dirname, '..');
const maidsPath = path.join(root, 'maids.json');
const operationPath = path.resolve(root, process.argv[2] || '');
const dryRun = process.argv.includes('--dry-run');

const requiredMaidFields = [
  'name',
  'birthday',
  'generation',
  'likes',
  'favorite_food',
  'one_liner',
  'image'
];

const placeholderTexts = [
  'ここに名前',
  '好きなもの1',
  '好きなもの2',
  '好きな食べ物',
  'ひとことメッセージ',
  'img/example.jpg',
  'ここに退店する名前'
];

const usage = () => {
  console.error('Usage: node scripts/apply-maid-operation.js operations/join.json [--dry-run]');
  console.error('       node scripts/apply-maid-operation.js operations/retire.json [--dry-run]');
  process.exit(1);
};

const fail = (message) => {
  console.error(`operation failed: ${message}`);
  process.exit(1);
};

const readJson = (filePath, label) => {
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch (error) {
    fail(`${label} is not valid JSON: ${error.message}`);
  }
};

const isNonEmptyString = value =>
  typeof value === 'string' && value.trim().length > 0;

const containsPlaceholder = value => {
  if (typeof value === 'string') {
    return placeholderTexts.includes(value.trim());
  }

  if (Array.isArray(value)) {
    return value.some(containsPlaceholder);
  }

  if (value && typeof value === 'object') {
    return Object.values(value).some(containsPlaceholder);
  }

  return false;
};

const normalizeMaid = maid => {
  const normalized = {};

  for (const field of requiredMaidFields) {
    normalized[field] = maid[field];
  }

  if (maid.status) {
    normalized.status = maid.status;
  }

  return normalized;
};

const formatMaids = maids => `${JSON.stringify(maids, null, 2)}\n`;

const writeMaids = maids => {
  fs.writeFileSync(maidsPath, formatMaids(maids), 'utf8');
};

const validateCandidate = maids => {
  const tempPath = path.join(os.tmpdir(), `potoro-maids-${Date.now()}-${Math.random().toString(16).slice(2)}.json`);
  fs.writeFileSync(tempPath, formatMaids(maids), 'utf8');

  const result = spawnSync(process.execPath, [path.join(root, 'scripts', 'validate-maids.js')], {
    cwd: root,
    encoding: 'utf8',
    env: {
      ...process.env,
      MAIDS_JSON_PATH: tempPath
    }
  });

  fs.rmSync(tempPath, { force: true });

  if (result.stdout) process.stdout.write(result.stdout);
  if (result.stderr) process.stderr.write(result.stderr);
  if (result.status !== 0) process.exit(result.status || 1);
};

const validate = () => {
  const result = spawnSync(process.execPath, [path.join(root, 'scripts', 'validate-maids.js')], {
    cwd: root,
    encoding: 'utf8'
  });

  if (result.stdout) process.stdout.write(result.stdout);
  if (result.stderr) process.stderr.write(result.stderr);
  if (result.status !== 0) process.exit(result.status || 1);
};

if (!process.argv[2]) {
  usage();
}

if (!fs.existsSync(operationPath)) {
  fail(`operation file not found: ${path.relative(root, operationPath)}`);
}

const operation = readJson(operationPath, 'operation file');
const maids = readJson(maidsPath, 'maids.json');

if (containsPlaceholder(operation)) {
  fail('operation file still contains placeholder text. Please fill in the template before running it.');
}

if (!Array.isArray(maids)) {
  fail('maids.json root must be an array.');
}

if (operation.type === 'join') {
  const maid = operation.maid;

  if (!maid || typeof maid !== 'object' || Array.isArray(maid)) {
    fail('"maid" must be an object for join operations.');
  }

  for (const field of requiredMaidFields) {
    if (!(field in maid)) {
      fail(`join maid is missing "${field}".`);
    }
  }

  if (!isNonEmptyString(maid.name)) {
    fail('join maid "name" must be a non-empty string.');
  }

  if (maids.some(current => current.name === maid.name)) {
    fail(`"${maid.name}" already exists in maids.json.`);
  }

  maids.push(normalizeMaid(maid));

  validateCandidate(maids);

  if (dryRun) {
    console.log(`[dry-run] "${maid.name}" would be added.`);
  } else {
    console.log(`Added "${maid.name}" to maids.json.`);
  }
} else if (operation.type === 'retire') {
  if (!isNonEmptyString(operation.name)) {
    fail('retire operation "name" must be a non-empty string.');
  }

  const index = maids.findIndex(maid => maid.name === operation.name);
  if (index === -1) {
    fail(`"${operation.name}" was not found in maids.json.`);
  }

  const [removed] = maids.splice(index, 1);

  validateCandidate(maids);

  if (dryRun) {
    console.log(`[dry-run] "${removed.name}" would be removed. Image remains: ${removed.image}`);
  } else {
    console.log(`Removed "${removed.name}" from maids.json. Image remains: ${removed.image}`);
  }
} else {
  fail('"type" must be "join" or "retire".');
}

if (!dryRun) validate();
