# Phase 2: nanoKONTROL2 MIDI 接続テスト手順

## 1) 事前準備
- **Chrome** を使用してください（Web MIDI / `performance.memory` 前提）
- `file://` 直開きではなく、**ローカルサーバ**で起動します

```bash
cd "/Users/taro.co/Desktop/taroco.vj/liveVj" && python3 -m http.server 8000
```

ブラウザで `http://localhost:8000/` を開きます。

## 2) nanoKONTROL2 の確認
- nanoKONTROL2 を USB 接続
- macOS の **Audio MIDI設定**（Audio MIDI Setup）でデバイスが見えるか確認

## 3) Chrome 側の動作確認
ページを開いたら、DevTools Console に以下が出るのを確認します:
- **MIDI接続成功**: `✓ MIDI connected: nanoKONTROL2 ...`
- **未接続/非対応**: `⚠️ MIDI not available, using keyboard fallback`

右上の DebugUI にも `MIDI Status` が表示されます。

## 4) MIDI マッピング（実装済み範囲）

### フェーダー（CC 0-7）
- **Fader 1 (CC0)**: 粒子数（10,000〜500,000 / 対数）
- **Fader 2 (CC1)**: 彩度（0..1）
- **Fader 3 (CC2)**: 明度（0.2..1.0）
- **Fader 4 (CC3)**: 色相（0..1）
- **Fader 5 (CC4)**: 回転X（-0.01..0.01 rad/frame）
- **Fader 6 (CC5)**: 回転Y（-0.01..0.01 rad/frame）
- **Fader 7 (CC6)**: 色変化速度（0.5..2.0倍）
- **Fader 8 (CC7)**: ノイズ強度（0..1）

### ノブ（CC 16-23）
Phase 3 向けに **ParamStoreへ値を保持**します（画面効果への反映は未実装）:
- **Knob 1 (CC16)**: bloomStrength (0..2)
- **Knob 2 (CC17)**: trailStrength (0..1)
- **Knob 3 (CC18)**: warpStrength (0..0.3)
- **Knob 4 (CC19)**: glitchStrength (0..1)
- **Knob 5 (CC20)**: aberrationStrength (0..5px)

### ボタンS（CC 32-39）
- **S1 (CC32)**: Effect Set A トグル（状態のみ）
- **S2 (CC33)**: Effect Set B トグル（状態のみ）
- **S8 (CC39)**: 全リセット

## 5) キーボードフォールバック（MIDI未接続時）
- **Q/A**: 粒子数 ±5000
- **W/S**: 彩度 ±0.01
- **E/D**: 明度 ±0.01（下限0.2）
- **R/F**: 色相 ±0.01（wrap）
- **1/2/3**: Effect Set A/B トグル、全OFF
- **Cmd+R / Ctrl+R**: 内部リセット
- **H**: Debug UI 表示切替

## 6) よくあるトラブル
- **Consoleに “WebMIDI not supported”**: Chrome以外、または権限/環境の問題です
- **nanoKONTROL2 が見つからない**:
  - デバイス名が `nanoKONTROL2` を含むか確認（OS側での表示名）
  - 既に別アプリが専有していないか確認
- **反応はあるがカクつく**:
  - 粒子数を下げる（Fader1）
  - 画面解像度/外部ディスプレイ/録画など負荷要因を確認

