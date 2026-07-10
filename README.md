# LiveVJ — ライブVJ用パーティクルシステム

Three.js による 10 万〜50 万粒子の発光球体と、キーボード制御・ポストエフェクト・レイヤー・プリセットを備えた VJ 用アプリケーション。

## 必要環境

- **ブラウザ**: Chrome 最新版（WebGL2 想定）
- **実行**: ローカルサーバ必須（`file://` では ES modules のため動作しない）

## インストール・起動

```bash
# root
cd liveVj
python3 -m http.server 8000
```

ブラウザで **http://localhost:8000/** を開く。

## 使い方

### キーボード操作一覧
同時押し可

#### 基本パラメータ（連続入力）
キーを押し続けると値が連続的に変化。

##### 粒子制御
| キー | 機能 | 備考 |
|------|------|------|
| Q | 粒子数 増加 | +5,000/秒 |
| A | 粒子数 減少 | -5,000/秒 |
| Shift+Q | 粒子数 大幅増加 | +50,000/秒 |
| Shift+A | 粒子数 大幅減少 | -50,000/秒 |

##### 色制御（HSL）
| キー | 機能 | 範囲 |
|------|------|------|
| W | 彩度 増加 | 0.0-1.0 |
| S | 彩度 減少 | 0.0-1.0 |
| E | 明度 増加 | 0.2-1.0 |
| D | 明度 減少 | 0.2-1.0 |
| R | 色相 +回転 | 0.0-1.0 (ループ) |
| F | 色相 -回転 | 0.0-1.0 (ループ) |

##### 回転制御
| キー | 機能 | 範囲 |
|------|------|------|
| T | X軸回転速度 増加 | -0.01〜0.01 rad/frame |
| G | X軸回転速度 減少 | -0.01〜0.01 rad/frame |
| Y | Y軸回転速度 増加 | -0.01〜0.01 rad/frame |
| H | Y軸回転速度 減少 | -0.01〜0.01 rad/frame |

##### その他
| キー | 機能 | 範囲 |
|------|------|------|
| U | 色変化速度 増加 | 0.5-2.0倍 |
| J | 色変化速度 減少 | 0.5-2.0倍 |
| I | ノイズ強度 増加 | 0.0-1.0 |
| K | ノイズ強度 減少 | 0.0-1.0 |

#### エフェクト強度制御（連続入力）

##### エフェクトセットA（ブルーム+トレイル+ワープ）
| キー | 機能 | 範囲 |
|------|------|------|
| Z | ブルーム強度 増加 | 0.0-2.0 |
| X | ブルーム強度 減少 | 0.0-2.0 |
| C | トレイル強度 増加 | 0.0-1.0 |
| V | トレイル強度 減少 | 0.0-1.0 |
| B | ワープ強度 増加 | 0.0-0.3 |
| N | ワープ強度 減少 | 0.0-0.3 |

##### エフェクトセットB（グリッチ+色収差）
| キー | 機能 | 範囲 |
|------|------|------|
| M | グリッチ強度 増加 | 0.0-1.0 |
| , | グリッチ強度 減少 | 0.0-1.0 |
| . | 色収差強度 増加 | 0.0-5.0px |
| / | 色収差強度 減少 | 0.0-5.0px |

#### トグル操作（1回押下）

##### エフェクト・パターン
| キー | 機能 |
|------|------|
| 1 | エフェクトセットA（ブルーム+トレイル+ワープ）ON/OFF |
| 2 | エフェクトセットB（グリッチ+色収差）ON/OFF |
| 3 | Constellation パターン ON/OFF |
| 4 | PhotoFog パターン ON/OFF |
| 5 | Microbe パターン ON/OFF |
| 6 | Water Surface パターン ON/OFF |

##### プリセット
| キー | 機能 |
|------|------|
| 7 | プリセット1 呼び出し |
| 8 | プリセット2 呼び出し |
| Cmd+1/2/3 | 現在状態をスロット1/2/3に保存 |
| Shift+1/2/3 | スロット1/2/3から読み込み |

##### システム
| キー | 機能 |
|------|------|
| 0 | 全リセット（初期状態に戻る）|
| P | デバッグUI 表示切替 |

### 初期パラメータ

初期値：

```
粒子数: 100,000
色相: 0.0（赤）
彩度: 0.0（白）
明度: 0.9（明るい）
回転速度X: 0.001
回転速度Y: 0.002
ノイズ強度: 0.2
色変化速度: 1.0倍

ブルーム強度: 0.8
トレイル強度: 0.0
ワープ強度: 0.0
グリッチ強度: 0.0
色収差強度: 0.0

エフェクトセットA: OFF
エフェクトセットB: OFF

Milky Way パターン: ON
Rain パターン: ON
Microbe パターン: ON
Water Surface パターン: ON
```

### プリセット作成ガイド

1. キーボードで好みの状態を作る。
2. **Cmd+1**（または 2, 3）で現在の状態をスロットに保存。
3. 別シーンでは **Shift+1**（または 2, 3）でそのスロットを呼び出し。
4. ファイルベースのプリセットは `presets.json` を編集してください。


## プロジェクト構成

```
liveVj/
├── index.html
├── presets.json          # プリセット定義
├── assets/               # 画像等のアセット
│   └── images/
├── js/
│   ├── main.js           # エントリ・メインループ
│   ├── config/           # パラメータ設定
│   │   └── params.js
│   ├── core/             # レンダラ・リサイズ
│   │   ├── renderer.js
│   │   └── resize.js
│   ├── effects/          # ポストエフェクト
│   │   ├── effectSystem.js
│   │   ├── glitchShader.js
│   │   ├── trailShader.js
│   │   ├── warpShader.js
│   │   └── aberrationShader.js
│   ├── gl/               # WebGL ユーティリティ
│   │   ├── shaderLoader.js
│   │   └── uniforms.js
│   ├── input/            # キーボード制御
│   │   └── keyboardHandler.js
│   ├── layers/           # レイヤー管理
│   │   ├── layer.js
│   │   └── layerManager.js
│   ├── patterns/         # VJ パターン
│   │   ├── patternManager.js
│   │   ├── constellation/
│   │   │   └── ConstellationPattern.js
│   │   ├── microbe/      # 微生物パターン
│   │   │   ├── MicrobePattern.js
│   │   │   ├── Cyanobacteria.js
│   │   │   ├── Mikazukimo.js
│   │   │   ├── Rappamushi.js
│   │   │   ├── Temarimushi.js
│   │   │   └── Tsuriganemushi.js
│   │   ├── photoFog/
│   │   │   └── PhotoFogPattern.js
│   │   └── waterSurface/
│   │       └── WaterSurfacePattern.js
│   ├── presets/          # プリセット読み込み・保存
│   │   └── presetLoader.js
│   ├── scenes/           # シーン管理
│   │   └── particleSphere.js
│   ├── state/            # 状態管理
│   │   └── paramStore.js
│   ├── ui/               # デバッグ UI
│   │   └── debugUI.js
│   └── utils/            # ユーティリティ
│       ├── colorCycle.js
│       └── perfMonitor.js
└── shaders/              # GLSL シェーダー
    ├── color.glsl
    ├── common.glsl
    ├── fields.glsl
    ├── fragment.glsl
    ├── particle.frag
    ├── particle.vert
    ├── particles.glsl
    └── vertex.glsl
```

## 技術仕様

- **Three.js**: r160 (CDN)
- **WebGL**: 2.0
- **JavaScript**: Vanilla JS（フレームワークなし）
- **目標**: 60fps 維持、メモリ 3GB 以下

## ライセンス

プロジェクトのライセンスに従ってください。
