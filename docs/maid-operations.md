# メイドプロフィール運用手順

`maids.json` を直接編集せず、`operations/` のフォーマットを埋めてから反映します。

基本の流れは、フォーマットを埋める、`--dry-run` で確認する、反映する、最後に検証する、の4つです。

## 現在の掲載メンバーを確認するとき

```powershell
& 'C:\Users\infop\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe' scripts\list-maids.js
```

## 入店したとき

1. 写真を `img/` に入れます。
2. `operations/join.json` を開きます。
3. 次の項目を埋めます。
   - `name`: 表示名
   - `birthday`: `11/2` のような月/日。不明なら準備中用フォーマットを使います。
   - `generation`: `七代目` など
   - `likes`: 好きなもの。1つ以上
   - `favorite_food`: 好きな食べ物
   - `one_liner`: ひとこと
   - `image`: `img/chii.JPG` のような画像パス
4. `ここに名前` などの仮文字が残っていないことを確認します。
5. 反映前チェックをします。

```powershell
& 'C:\Users\infop\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe' scripts\apply-maid-operation.js operations\join.json --dry-run
```

6. 問題なければ反映します。

```powershell
& 'C:\Users\infop\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe' scripts\apply-maid-operation.js operations\join.json
```

## プロフィール未確定で入店したとき

`operations/join-preparing.json` を使います。`name` と `generation` だけ先に入れ、写真がなければ `img/profile preparation.png` のままで大丈夫です。

`ここに名前` が残っている場合は反映できません。

反映前チェックをします。

```powershell
& 'C:\Users\infop\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe' scripts\apply-maid-operation.js operations\join-preparing.json --dry-run
```

問題なければ反映します。

```powershell
& 'C:\Users\infop\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe' scripts\apply-maid-operation.js operations\join-preparing.json
```

## 退店したとき

1. `operations/retire.json` を開きます。
2. `name` に退店するメイドさんの表示名を入れます。
3. `ここに退店する名前` が残っていないことを確認します。
4. 反映前チェックをします。

```powershell
& 'C:\Users\infop\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe' scripts\apply-maid-operation.js operations\retire.json --dry-run
```

5. 問題なければ反映します。

```powershell
& 'C:\Users\infop\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe' scripts\apply-maid-operation.js operations\retire.json
```

退店時、画像ファイルは自動削除しません。間違って必要な写真を消さないためです。

## フォーマットを書き戻したいとき

`operations/` のファイルは記入用フォーマットです。入力済みの内容を空に戻したいときは、また私に「入店フォーマットを初期状態に戻して」と頼めば戻せます。

`operations/test-join-preparing.json` は自動チェック用です。普段の入店・退店作業では触らなくて大丈夫です。

## 最後に必ず確認

```powershell
& 'C:\Users\infop\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe' scripts\validate-maids.js
```

`maids.json validation passed` と表示されればOKです。
