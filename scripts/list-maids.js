const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const maidsPath = path.join(root, 'maids.json');
const maids = JSON.parse(fs.readFileSync(maidsPath, 'utf8'));

const generationOrder = ['初代', '弐代目', '三代目', '四代目', '五代目', '六代目', '七代目'];
const generationRank = generation => {
  const index = generationOrder.indexOf(generation);
  return index === -1 ? Number.MAX_SAFE_INTEGER : index;
};

const isPreparing = maid => maid.status === 'preparing';
const sortMaids = list => list.slice().sort((a, b) =>
  generationRank(a.generation) - generationRank(b.generation) ||
  (a.name || '').localeCompare(b.name || '', 'ja')
);

const active = maids.filter(maid => !isPreparing(maid));
const preparing = maids.filter(isPreparing);

console.log(`掲載中: ${maids.length}名 / 公開中: ${active.length}名 / 準備中: ${preparing.length}名`);
console.log('');

for (const maid of sortMaids(maids)) {
  const status = isPreparing(maid) ? '準備中' : '公開中';
  console.log(`${maid.name} | ${maid.generation} | ${maid.birthday} | ${status} | ${maid.image}`);
}
