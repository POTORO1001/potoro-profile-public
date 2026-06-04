const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');

const templates = {
  'operations/join.json': {
    type: 'join',
    maid: {
      name: 'ここに名前',
      birthday: '1/23',
      generation: '七代目',
      likes: [
        '好きなもの1',
        '好きなもの2'
      ],
      favorite_food: '好きな食べ物',
      one_liner: 'ひとことメッセージ',
      image: 'img/example.jpg'
    }
  },
  'operations/join-preparing.json': {
    type: 'join',
    maid: {
      name: 'ここに名前',
      status: 'preparing',
      birthday: '?/?',
      generation: '七代目',
      likes: [
        '準備中'
      ],
      favorite_food: '準備中',
      one_liner: 'プロフィール準備中です♡',
      image: 'img/profile preparation.png'
    }
  },
  'operations/retire.json': {
    type: 'retire',
    name: 'ここに退店する名前'
  }
};

for (const [relativePath, content] of Object.entries(templates)) {
  const filePath = path.join(root, relativePath);
  fs.writeFileSync(filePath, `${JSON.stringify(content, null, 2)}\n`, 'utf8');
  console.log(`Reset ${relativePath}`);
}
