const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const dataPath = process.env.MAIDS_JSON_PATH || path.join(root, 'maids.json');

const requiredFields = [
  'name',
  'birthday',
  'generation',
  'likes',
  'favorite_food',
  'one_liner',
  'image'
];

const optionalFields = [
  'status'
];

const allowedFields = new Set([...requiredFields, ...optionalFields]);
const allowedStatuses = new Set(['active', 'preparing']);

const fail = (messages) => {
  console.error('maids.json validation failed:');
  for (const message of messages) {
    console.error(`- ${message}`);
  }
  process.exit(1);
};

const isNonEmptyString = (value) =>
  typeof value === 'string' && value.trim().length > 0;

const isValidBirthday = (value) => {
  if (!isNonEmptyString(value)) return false;
  if (value.trim() === '?/?') return true;

  const match = value.trim().match(/^(\d{1,2})\/(\d{1,2})$/);
  if (!match) return false;

  const month = Number(match[1]);
  const day = Number(match[2]);
  if (!Number.isInteger(month) || !Number.isInteger(day)) return false;
  if (month < 1 || month > 12) return false;

  const daysInMonth = [31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  return day >= 1 && day <= daysInMonth[month - 1];
};

const existsCaseSensitive = (relativePath) => {
  const parts = relativePath.split(/[\\/]+/).filter(Boolean);
  let current = root;

  for (const part of parts) {
    if (!fs.existsSync(current)) return false;

    const entries = fs.readdirSync(current);
    if (!entries.includes(part)) return false;

    current = path.join(current, part);
  }

  return fs.existsSync(current);
};

let maids;
try {
  maids = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
} catch (error) {
  fail([`Invalid JSON syntax: ${error.message}`]);
}

const errors = [];

if (!Array.isArray(maids)) {
  errors.push('Root value must be an array.');
} else {
  const names = new Map();

  maids.forEach((maid, index) => {
    const label = `entry #${index + 1}${maid && maid.name ? ` (${maid.name})` : ''}`;

    if (!maid || typeof maid !== 'object' || Array.isArray(maid)) {
      errors.push(`${label}: must be an object.`);
      return;
    }

    for (const field of requiredFields) {
      if (!(field in maid)) {
        errors.push(`${label}: missing required field "${field}".`);
      }
    }

    for (const field of Object.keys(maid)) {
      if (!allowedFields.has(field)) {
        errors.push(`${label}: unknown field "${field}".`);
      }
    }

    if (!isNonEmptyString(maid.name)) {
      errors.push(`${label}: "name" must be a non-empty string.`);
    } else if (names.has(maid.name)) {
      errors.push(`${label}: duplicate name also used by entry #${names.get(maid.name)}.`);
    } else {
      names.set(maid.name, index + 1);
    }

    if ('status' in maid && !allowedStatuses.has(maid.status)) {
      errors.push(`${label}: "status" must be active or preparing.`);
    }

    if (!isValidBirthday(maid.birthday)) {
      errors.push(`${label}: "birthday" must be M/D or ?/?.`);
    }

    if (!isNonEmptyString(maid.generation)) {
      errors.push(`${label}: "generation" must be a non-empty string.`);
    }

    if (!Array.isArray(maid.likes)) {
      errors.push(`${label}: "likes" must be an array.`);
    } else if (maid.likes.length === 0) {
      errors.push(`${label}: "likes" must contain at least one item.`);
    } else {
      maid.likes.forEach((like, likeIndex) => {
        if (!isNonEmptyString(like)) {
          errors.push(`${label}: likes[${likeIndex}] must be a non-empty string.`);
        }
      });
    }

    if (!isNonEmptyString(maid.favorite_food)) {
      errors.push(`${label}: "favorite_food" must be a non-empty string.`);
    }

    if (!isNonEmptyString(maid.one_liner)) {
      errors.push(`${label}: "one_liner" must be a non-empty string.`);
    }

    if (!isNonEmptyString(maid.image)) {
      errors.push(`${label}: "image" must be a non-empty string.`);
    } else {
      const normalized = maid.image.replace(/\\/g, '/');

      if (path.isAbsolute(normalized) || normalized.includes('..')) {
        errors.push(`${label}: "image" must be a relative path inside img/.`);
      } else if (!normalized.startsWith('img/')) {
        errors.push(`${label}: "image" must start with img/.`);
      } else if (!existsCaseSensitive(normalized)) {
        errors.push(`${label}: image file not found with exact casing: ${maid.image}`);
      }
    }
  });
}

if (errors.length) {
  fail(errors);
}

console.log(`maids.json validation passed (${maids.length} entries).`);
