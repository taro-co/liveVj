# LiveVJ — ライブVJ用パーティクルシステム

Three.js による 10 万〜50 万粒子の発光球体と、nanoKONTROL2 MIDI 制御・ポストエフェクト・レイヤー・プリセットを備えた VJ 用アプリケーションです。

## 必要環境

- **ブラウザ**: Chrome 最新版（WebGL2 / Web MIDI API 想定）
- **実行**: ローカルサーバ必須（`file://` では ES modules のため動作しません）

## インストール・起動

```bash
# リポジトリのルートで
cd liveVj
python3 -m http.server 8000
```

ブラウザで **http://localhost:8000/** を開いてください。

## 使い方

- **MIDI**: nanoKONTROL2 を USB 接続すると自動検出し、フェーダー・ノブ・ボタンで制御できます。
- **キーボード**: MIDI 未接続時は Q/A, W/S, E/D, R/F で粒子数・彩度・明度・色相を操作できます。
- **エフェクト**: キー 1/2/3 または MIDI ボタン S1/S2 でエフェクトセットの ON/OFF。
- **プリセット**: ボタン S6/S7 でプリセット 1/2 呼び出し。Cmd+1/2/3 で保存、Shift+1/2/3 で保存スロット読み込み。
- **リセット**: Cmd+R / Ctrl+R または ボタン S8。
- **デバッグ**: H キーでパラメータパネル表示切替。

詳細は [LIVE_MANUAL.md](./LIVE_MANUAL.md) を参照してください。

## プロジェクト構成

```
liveVj/
├── index.html
├── presets.json          # プリセット定義（Phase 3）
├── js/
│   ├── main.js           # エントリ・メインループ
│   ├── core/             # レンダラ・リサイズ
│   ├── scenes/           # 粒子球体 (ParticleSphere)
│   ├── effects/          # EffectComposer, ブルーム, トレイル, ワープ, グリッチ, 色収差
│   ├── layers/           # レイヤー管理
│   ├── presets/          # プリセット読み込み・保存
│   ├── input/            # MIDI, キーボード
│   ├── state/            # パラメータ平滑化 (ParamStore)
│   └── ui/               # デバッグ UI
└── shaders/              # 粒子用 GLSL
```

## 技術仕様

- **Three.js**: r160 (CDN)
- **WebGL**: 2.0
- **JavaScript**: Vanilla JS（フレームワークなし）
- **目標**: 60fps 維持、メモリ 3GB 以下

## ライセンス

プロジェクトのライセンスに従ってください。
