import * as THREE from 'three';

// ===== 星座データ定義 =====
// 季節ごとの分類と球体内側配置:
// - 正面(lon中心 0°)  : 夏の星座
// - 左側(lon中心 90°) : 秋の星座
// - 背面(lon中心 180°): 冬の星座
// - 右側(lon中心 270°): 春の星座

// 球面座標変換式（度数→ラジアン変換してから使用）:
// const latR = lat * Math.PI / 180;
// const lonR = lon * Math.PI / 180;
// x = r * Math.cos(latR) * Math.cos(lonR)
// y = r * Math.sin(latR)
// z = r * Math.cos(latR) * Math.sin(lonR)

/**
 * lat: 緯度
 * lon: 経度
 */

/** ===== 夏の星座（lon中心: 0° 付近、-60°〜60° に分散配置）===== */
const SUMMER = [
  {
    name: '琴座', stars: [
      { name: 'Vega',       lat: 39,  lon: -10, size: 4.0 },
      { name: 'Sheliak',    lat: 33,  lon: -5,  size: 2.0 },
      { name: 'Sulafat',    lat: 33,  lon: -2,  size: 2.0 },
      { name: 'Delta1',     lat: 36,  lon: -4,  size: 1.8 },
      { name: 'Zeta',       lat: 38,  lon: -3,  size: 1.8 },
    ],
    lines: [[0,1],[1,2],[0,4],[4,3],[3,1],[2,3]],
  },
  {
    name: '白鳥座', stars: [
      { name: 'Deneb',      lat: 45,  lon: 15,  size: 3.8 },
      { name: 'Albireo',    lat: 28,  lon: 10,  size: 2.5 },
      { name: 'Sadr',       lat: 40,  lon: 12,  size: 2.8 },
      { name: 'Gienah',     lat: 33,  lon: 8,   size: 2.2 },
      { name: 'Delta',      lat: 45,  lon: 9,   size: 2.2 },
    ],
    lines: [[0,2],[2,1],[2,4],[4,3]],
  },
  {
    name: '鷲座', stars: [
      { name: 'Altair',     lat: 9,   lon: -5,  size: 3.8 },
      { name: 'Tarazed',    lat: 11,  lon: -6,  size: 2.5 },
      { name: 'Alshain',    lat: 7,   lon: -4,  size: 2.0 },
      { name: 'Delta',      lat: 3,   lon: -8,  size: 2.0 },
      { name: 'Zeta',       lat: 14,  lon: -10, size: 2.0 },
    ],
    lines: [[1,0],[0,2],[3,0],[0,4]],
  },
  {
    name: '射手座', stars: [
      { name: 'Kaus Australis', lat: -34, lon: 10,  size: 3.5 },
      { name: 'Nunki',          lat: -26, lon: 15,  size: 3.0 },
      { name: 'Kaus Media',     lat: -29, lon: 8,   size: 2.8 },
      { name: 'Kaus Borealis',  lat: -25, lon: 7,   size: 2.5 },
      { name: 'Rukbat',         lat: -40, lon: 5,   size: 2.3 },
      { name: 'Arkab',          lat: -44, lon: 7,   size: 2.3 },
      { name: 'Ascella',        lat: -30, lon: 18,  size: 2.5 },
      { name: 'Phi',            lat: -27, lon: 20,  size: 2.0 },
    ],
    lines: [[0,2],[2,3],[3,1],[1,7],[7,6],[0,4],[4,5],[2,0],[6,0]],
  },
  {
    name: '蠍座', stars: [
      { name: 'Antares',  lat: -26, lon: -18, size: 4.0 },
      { name: 'Graffias', lat: -19, lon: -25, size: 2.8 },
      { name: 'Dschubba', lat: -22, lon: -26, size: 2.8 },
      { name: 'Sargas',   lat: -43, lon: -10, size: 2.8 },
      { name: 'Shaula',   lat: -37, lon: -8,  size: 3.2 },
      { name: 'Lesath',   lat: -37, lon: -9,  size: 2.2 },
      { name: 'Alniyat',  lat: -26, lon: -20, size: 2.2 },
      { name: 'Tau',      lat: -28, lon: -17, size: 2.2 },
    ],
    lines: [[1,2],[2,0],[0,6],[6,7],[7,3],[3,4],[4,5]],
  },
  {
    name: '天秤座', stars: [
      { name: 'Zubenelgenubi', lat: -16, lon: -32, size: 2.8 },
      { name: 'Zubeneschamali',lat: -9,  lon: -33, size: 3.0 },
      { name: 'Brachium',      lat: -26, lon: -34, size: 2.3 },
      { name: 'Upsilon',       lat: -28, lon: -30, size: 2.0 },
    ],
    lines: [[0,1],[0,2],[2,3],[1,3]],
  },
  {
    name: 'ヘルクレス座', stars: [
      { name: 'Kornephoros', lat: 21,  lon: -20, size: 3.0 },
      { name: 'Zeta',        lat: 32,  lon: -22, size: 2.8 },
      { name: 'Pi',          lat: 37,  lon: -15, size: 2.5 },
      { name: 'Eta',         lat: 39,  lon: -22, size: 2.5 },
      { name: 'Sigma',       lat: 42,  lon: -17, size: 2.2 },
      { name: 'Tau',         lat: 31,  lon: -12, size: 2.2 },
      { name: 'Iota',        lat: 46,  lon: -28, size: 2.0 },
      { name: 'Theta',       lat: 37,  lon: -28, size: 2.0 },
    ],
    lines: [[0,1],[1,3],[3,2],[2,5],[1,7],[7,3],[3,4],[4,6]],
  },
  {
    name: '龍座', stars: [
      { name: 'Eltanin',  lat: 51,  lon: -30, size: 3.3 },
      { name: 'Rastaban', lat: 52,  lon: -20, size: 2.8 },
      { name: 'Aldhibah', lat: 72,  lon: -20, size: 2.5 },
      { name: 'Altais',   lat: 67,  lon: 25,  size: 2.8 },
      { name: 'Eta',      lat: 61,  lon: 50,  size: 2.3 },
      { name: 'Theta',    lat: 59,  lon: 40,  size: 2.3 },
      { name: 'Iota',     lat: 59,  lon: 30,  size: 2.3 },
    ],
    lines: [[0,1],[1,2],[2,3],[3,4],[4,5],[5,6],[6,3]],
  },
  {
    name: '蛇遣い座', stars: [
      { name: 'Rasalhague', lat: 12,  lon: -25, size: 3.3 },
      { name: 'Sabik',      lat: -16, lon: -22, size: 2.8 },
      { name: 'Zeta',       lat: -11, lon: -28, size: 2.5 },
      { name: 'Eta',        lat: -16, lon: -30, size: 2.5 },
      { name: 'Delta',      lat: -3,  lon: -20, size: 2.2 },
      { name: 'Epsilon',    lat: 4,   lon: -18, size: 2.2 },
      { name: 'Beta',       lat: 5,   lon: -30, size: 2.2 },
    ],
    lines: [[0,5],[5,4],[4,1],[1,2],[2,3],[0,6],[6,2]],
  },
];

// ===== 秋の星座（lon中心: 90° 付近、30°〜150° に分散配置）=====
const AUTUMN = [
  {
    name: 'カシオペヤ座', stars: [
      { name: 'Schedar',  lat: 56, lon: 60,  size: 3.2 },
      { name: 'Caph',     lat: 59, lon: 52,  size: 2.8 },
      { name: 'Gamma',    lat: 61, lon: 65,  size: 2.8 },
      { name: 'Ruchbah',  lat: 60, lon: 73,  size: 2.3 },
      { name: 'Epsilon',  lat: 64, lon: 79,  size: 2.3 },
    ],
    lines: [[1,0],[0,2],[2,3],[3,4]],
  },
  {
    name: 'ペガスス座', stars: [
      { name: 'Markab',   lat: 15,  lon: 90,  size: 3.0 },
      { name: 'Scheat',   lat: 28,  lon: 85,  size: 3.0 },
      { name: 'Algenib',  lat: 15,  lon: 100, size: 2.5 },
      { name: 'Enif',     lat: 10,  lon: 75,  size: 3.0 },
      { name: 'Matar',    lat: 30,  lon: 73,  size: 2.3 },
      { name: 'Biham',    lat: 6,   lon: 86,  size: 2.0 },
    ],
    lines: [[0,1],[1,2],[2,0],[0,3],[3,4],[0,5]],
  },
  {
    name: 'アンドロメダ座', stars: [
      { name: 'Alpheratz', lat: 29,  lon: 100, size: 3.3 },
      { name: 'Mirach',    lat: 36,  lon: 110, size: 3.0 },
      { name: 'Almach',    lat: 42,  lon: 120, size: 3.0 },
      { name: 'Delta',     lat: 31,  lon: 105, size: 2.3 },
      { name: 'Pi',        lat: 34,  lon: 115, size: 2.0 },
    ],
    lines: [[0,3],[3,1],[1,4],[4,2]],
  },
  {
    name: 'ペルセウス座', stars: [
      { name: 'Mirfak',   lat: 50,  lon: 115, size: 3.5 },
      { name: 'Algol',    lat: 41,  lon: 110, size: 3.0 },
      { name: 'Zeta',     lat: 56,  lon: 125, size: 2.5 },
      { name: 'Epsilon',  lat: 40,  lon: 118, size: 2.5 },
      { name: 'Delta',    lat: 48,  lon: 108, size: 2.3 },
      { name: 'Alpha',    lat: 50,  lon: 115, size: 2.3 },
    ],
    lines: [[1,3],[3,0],[0,4],[0,2],[4,5]],
  },
  {
    name: '牡羊座', stars: [
      { name: 'Hamal',    lat: 23,  lon: 120, size: 3.3 },
      { name: 'Sheratan', lat: 21,  lon: 125, size: 2.8 },
      { name: 'Mesarthim',lat: 19,  lon: 126, size: 2.3 },
      { name: 'Botein',   lat: 18,  lon: 132, size: 2.0 },
    ],
    lines: [[0,1],[1,2],[2,3]],
  },
  {
    name: '魚座', stars: [
      { name: 'Eta',    lat: 15,  lon: 115, size: 2.5 },
      { name: 'Omega',  lat: 7,   lon: 110, size: 2.3 },
      { name: 'Iota',   lat: 6,   lon: 118, size: 2.3 },
      { name: 'Theta',  lat: 6,   lon: 122, size: 2.0 },
      { name: 'Gamma',  lat: 3,   lon: 128, size: 2.0 },
      { name: 'Kappa',  lat: -1,  lon: 115, size: 2.0 },
    ],
    lines: [[1,0],[0,2],[2,3],[3,4],[1,5],[5,2]],
  },
  {
    name: '水瓶座', stars: [
      { name: 'Sadalsuud',  lat: -6,  lon: 80,  size: 3.0 },
      { name: 'Sadalmelik', lat: -1,  lon: 88,  size: 2.8 },
      { name: 'Skat',       lat: -16, lon: 95,  size: 2.5 },
      { name: 'Zeta',       lat: -1,  lon: 92,  size: 2.3 },
      { name: 'Eta',        lat: -1,  lon: 96,  size: 2.0 },
    ],
    lines: [[0,1],[1,3],[3,4],[1,2]],
  },
  {
    name: '山羊座', stars: [
      { name: 'Deneb Algedi', lat: -16, lon: 65,  size: 3.0 },
      { name: 'Dabih',        lat: -15, lon: 48,  size: 2.8 },
      { name: 'Algedi',       lat: -12, lon: 47,  size: 2.5 },
      { name: 'Nashira',      lat: -17, lon: 60,  size: 2.3 },
      { name: 'Zeta',         lat: -23, lon: 55,  size: 2.0 },
    ],
    lines: [[2,1],[1,4],[4,3],[3,0],[0,4]],
  },
  {
    name: '鯨座', stars: [
      { name: 'Diphda',  lat: -18, lon: 115, size: 3.3 },
      { name: 'Menkar',  lat: 4,   lon: 130, size: 3.0 },
      { name: 'Mira',    lat: -3,  lon: 125, size: 2.5 },
      { name: 'Tau',     lat: -16, lon: 120, size: 2.5 },
      { name: 'Iota',    lat: -9,  lon: 108, size: 2.3 },
      { name: 'Theta',   lat: -9,  lon: 112, size: 2.3 },
    ],
    lines: [[1,2],[2,3],[3,0],[0,4],[4,5],[5,3]],
  },
];

/**  ===== 冬の星座（lon中心: 180° 付近、120°〜240° に分散配置）===== */
const WINTER = [
  {
    name: 'オリオン座', stars: [
      { name: 'Betelgeuse', lat: 7,   lon: 175, size: 4.0 },
      { name: 'Rigel',      lat: -8,  lon: 170, size: 4.0 },
      { name: 'Bellatrix',  lat: 6,   lon: 168, size: 2.8 },
      { name: 'Saiph',      lat: -10, lon: 173, size: 2.8 },
      { name: 'Alnilam',    lat: -1,  lon: 172, size: 2.3 },
      { name: 'Alnitak',    lat: -2,  lon: 174, size: 2.3 },
      { name: 'Mintaka',    lat: 0,   lon: 170, size: 2.3 },
    ],
    lines: [[0,2],[2,6],[6,4],[4,5],[5,3],[3,1],[1,0],[6,5]],
  },
  {
    name: '牡牛座', stars: [
      { name: 'Aldebaran', lat: 17,  lon: 155, size: 3.8 },
      { name: 'Elnath',    lat: 29,  lon: 160, size: 3.0 },
      { name: 'Alcyone',   lat: 24,  lon: 148, size: 2.8 },
      { name: 'Zeta',      lat: 21,  lon: 155, size: 2.5 },
      { name: 'Theta',     lat: 16,  lon: 152, size: 2.3 },
      { name: 'Gamma',     lat: 19,  lon: 158, size: 2.3 },
    ],
    lines: [[2,4],[4,0],[0,3],[3,5],[5,1],[0,1]],
  },
  {
    name: '双子座', stars: [
      { name: 'Pollux',   lat: 28,  lon: 185, size: 3.8 },
      { name: 'Castor',   lat: 32,  lon: 183, size: 3.5 },
      { name: 'Alhena',   lat: 16,  lon: 187, size: 2.8 },
      { name: 'Wasat',    lat: 22,  lon: 184, size: 2.3 },
      { name: 'Mebsuda',  lat: 25,  lon: 181, size: 2.3 },
      { name: 'Tejat',    lat: 23,  lon: 178, size: 2.5 },
      { name: 'Alzirr',   lat: 13,  lon: 185, size: 2.0 },
    ],
    lines: [[1,4],[4,5],[0,3],[3,2],[2,6],[1,0],[4,3]],
  },
  {
    name: '大犬座', stars: [
      { name: 'Sirius',   lat: -17, lon: 185, size: 4.5 },
      { name: 'Adhara',   lat: -29, lon: 182, size: 3.3 },
      { name: 'Wezen',    lat: -26, lon: 188, size: 3.0 },
      { name: 'Mirzam',   lat: -18, lon: 178, size: 2.8 },
      { name: 'Aludra',   lat: -29, lon: 192, size: 2.5 },
      { name: 'Omicron2', lat: -24, lon: 180, size: 2.3 },
    ],
    lines: [[0,3],[0,1],[1,5],[5,2],[2,4],[0,2]],
  },
  {
    name: '子犬座', stars: [
      { name: 'Procyon',  lat: 5,   lon: 192, size: 3.8 },
      { name: 'Gomeisa',  lat: 8,   lon: 189, size: 2.5 },
    ],
    lines: [[0,1]],
  },
  {
    name: 'ウサギ座', stars: [
      { name: 'Arneb',  lat: -18, lon: 170, size: 3.0 },
      { name: 'Nihal',  lat: -21, lon: 172, size: 2.8 },
      { name: 'Gamma',  lat: -22, lon: 167, size: 2.3 },
      { name: 'Delta',  lat: -21, lon: 165, size: 2.3 },
    ],
    lines: [[0,1],[1,2],[2,3],[3,0]],
  },
  {
    name: 'エリダヌス座', stars: [
      { name: 'Achernar', lat: -57, lon: 160, size: 3.8 },
      { name: 'Cursa',    lat: -5,  lon: 172, size: 2.8 },
      { name: 'Zaurak',   lat: -14, lon: 165, size: 2.5 },
      { name: 'Rana',     lat: -10, lon: 158, size: 2.3 },
      { name: 'Acamar',   lat: -40, lon: 155, size: 3.0 },
    ],
    lines: [[1,2],[2,3],[3,4],[4,0]],
  },
  {
    name: 'きりん座', stars: [
      { name: 'Beta',  lat: 60,  lon: 170, size: 2.8 },
      { name: 'Alpha', lat: 67,  lon: 180, size: 2.5 },
      { name: 'Gamma', lat: 72,  lon: 155, size: 2.3 },
      { name: 'CS',    lat: 77,  lon: 170, size: 2.0 },
    ],
    lines: [[0,1],[1,3],[3,2],[0,2]],
  },
  {
    name: 'やまねこ座', stars: [
      { name: 'Alpha', lat: 34,  lon: 198, size: 2.8 },
      { name: '38Lyn', lat: 37,  lon: 193, size: 2.3 },
      { name: '10UMa', lat: 42,  lon: 183, size: 2.0 },
      { name: '31Lyn', lat: 45,  lon: 188, size: 2.0 },
    ],
    lines: [[0,1],[1,3],[3,2]],
  },
];

/**  ===== 春の星座（lon中心: 270° 付近、210°〜330° に分散配置）===== */
const SPRING = [
  {
    name: '獅子座', stars: [
      { name: 'Regulus',  lat: 12,  lon: 240, size: 3.8 },
      { name: 'Denebola', lat: 14,  lon: 265, size: 3.0 },
      { name: 'Algieba',  lat: 20,  lon: 242, size: 3.0 },
      { name: 'Zosma',    lat: 21,  lon: 258, size: 2.5 },
      { name: 'Adhafera', lat: 24,  lon: 244, size: 2.3 },
      { name: 'Eta',      lat: 17,  lon: 238, size: 2.3 },
      { name: 'Mu',       lat: 26,  lon: 250, size: 2.0 },
    ],
    lines: [[5,0],[0,2],[2,4],[4,6],[6,3],[3,1],[2,3]],
  },
  {
    name: '大熊座', stars: [
      { name: 'Dubhe',   lat: 62,  lon: 255, size: 3.3 },
      { name: 'Merak',   lat: 56,  lon: 255, size: 2.8 },
      { name: 'Phecda',  lat: 54,  lon: 268, size: 2.8 },
      { name: 'Megrez',  lat: 58,  lon: 273, size: 2.3 },
      { name: 'Alioth',  lat: 56,  lon: 283, size: 3.3 },
      { name: 'Mizar',   lat: 55,  lon: 291, size: 2.8 },
      { name: 'Alkaid',  lat: 49,  lon: 297, size: 2.8 },
    ],
    lines: [[0,1],[1,2],[2,3],[3,4],[4,5],[5,6]],
  },
  {
    name: '牛飼座', stars: [
      { name: 'Arcturus', lat: 19,  lon: 270, size: 4.0 },
      { name: 'Izar',     lat: 27,  lon: 268, size: 2.8 },
      { name: 'Muphrid',  lat: 19,  lon: 265, size: 2.5 },
      { name: 'Seginus',  lat: 38,  lon: 264, size: 2.5 },
      { name: 'Rho',      lat: 30,  lon: 258, size: 2.0 },
      { name: 'Tau',      lat: 17,  lon: 260, size: 2.0 },
    ],
    lines: [[0,2],[0,1],[1,3],[3,4],[0,5],[5,4]],
  },
  {
    name: '乙女座', stars: [
      { name: 'Spica',    lat: -11, lon: 280, size: 4.0 },
      { name: 'Zavijava', lat: 1,   lon: 260, size: 2.5 },
      { name: 'Porrima',  lat: -1,  lon: 270, size: 2.8 },
      { name: 'Auva',     lat: 3,   lon: 275, size: 2.3 },
      { name: 'Vindemiatrix', lat: 11, lon: 272, size: 2.8 },
      { name: 'Heze',     lat: -1,  lon: 280, size: 2.0 },
    ],
    lines: [[1,2],[2,3],[3,0],[3,4],[0,5]],
  },
  {
    name: '蟹座', stars: [
      { name: 'Acubens',  lat: 12,  lon: 218, size: 2.5 },
      { name: 'Asellus B',lat: 21,  lon: 220, size: 2.3 },
      { name: 'Asellus A',lat: 22,  lon: 218, size: 2.3 },
      { name: 'Iota',     lat: 29,  lon: 215, size: 2.0 },
      { name: 'Beta',     lat: 9,   lon: 215, size: 2.0 },
    ],
    lines: [[3,2],[2,1],[1,4],[0,1],[0,4]],
  },
  {
    name: '小熊座', stars: [
      { name: 'Polaris',  lat: 89,  lon: 270, size: 3.5 },
      { name: 'Kochab',   lat: 74,  lon: 230, size: 3.0 },
      { name: 'Pherkad',  lat: 72,  lon: 250, size: 2.5 },
      { name: 'Epsilon',  lat: 78,  lon: 280, size: 2.0 },
      { name: 'Zeta',     lat: 78,  lon: 295, size: 2.0 },
    ],
    lines: [[0,3],[3,4],[4,2],[2,1],[1,0]],
  },
  {
    name: '海蛇座', stars: [
      { name: 'Alphard',  lat: -9,  lon: 225, size: 3.5 },
      { name: 'Gamma',    lat: -23, lon: 220, size: 2.5 },
      { name: 'Zeta',     lat: 6,   lon: 215, size: 2.3 },
      { name: 'Theta',    lat: -16, lon: 234, size: 2.3 },
      { name: 'Nu',       lat: -17, lon: 240, size: 2.0 },
      { name: 'Iota',     lat: -5,  lon: 247, size: 2.0 },
    ],
    lines: [[2,0],[0,1],[0,3],[3,4],[4,5]],
  },
];

const ALL_CONSTELLATIONS = [...SUMMER, ...AUTUMN, ...WINTER, ...SPRING];
const SEASON_RANGES = {
  summer: { start: 0,                    end: SUMMER.length },
  autumn: { start: SUMMER.length,        end: SUMMER.length + AUTUMN.length },
  winter: { start: SUMMER.length + AUTUMN.length, end: SUMMER.length + AUTUMN.length + WINTER.length },
  spring: { start: SUMMER.length + AUTUMN.length + WINTER.length, end: ALL_CONSTELLATIONS.length },
};

// ===== 球面座標→3D座標の変換ヘルパー =====
function toVec3(lat, lon, r) {
  const latR = lat * Math.PI / 180;
  const lonR = lon * Math.PI / 180;
  return new THREE.Vector3(
    r * Math.cos(latR) * Math.cos(lonR),
    r * Math.sin(latR),
    r * Math.cos(latR) * Math.sin(lonR)
  );
}

// ===== ConstellationPattern クラス =====
export class ConstellationPattern {

  constructor(scene) {
    this.scene = scene;
    this.visible = false;

    // Z軸に23°傾けたグループ（地軸の傾きを再現）
    this.group = new THREE.Group();
    this.group.rotation.z = 23 * Math.PI / 180;
    this.group.renderOrder = 1;
    this.group.visible = this.visible;
    scene.add(this.group);

    this._buildStars();
    this._buildLines();
  }

  // ------- 星の点を構築 -------
  _buildStars() {
    const R = 2.35; // 球体内側の半径

    // 全星座の全星を1つのBufferGeometryにまとめる
    // 各星に「カメラ正面からの角度」を事前計算してattributeとして持たせ、
    // Shaderでトーンを制御する

    const allStars = [];
    ALL_CONSTELLATIONS.forEach(con => {
      con.stars.forEach(s => {
        allStars.push({ ...s, constellation: con.name });
      });
    });

    const count = allStars.length;
    const positions = new Float32Array(count * 3);
    const sizes     = new Float32Array(count);
    const lonAttrib = new Float32Array(count); // lon値をShaderに渡す（トーン計算用）

    allStars.forEach((s, i) => {
      const v = toVec3(s.lat, s.lon, R);
      positions[i * 3]     = v.x;
      positions[i * 3 + 1] = v.y;
      positions[i * 3 + 2] = v.z;
      sizes[i]     = s.size;
      lonAttrib[i] = s.lon * Math.PI / 180; // ラジアンで渡す
    });

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('aSize',    new THREE.BufferAttribute(sizes,     1));
    geometry.setAttribute('aLon',     new THREE.BufferAttribute(lonAttrib, 1));

    const material = new THREE.ShaderMaterial({
      uniforms: {
        uRotationY: { value: 0.0 }, // 現在のY軸回転角（カメラ正面判定に使用）
      },
      vertexShader: `
        attribute float aSize;
        attribute float aLon;
        varying float vTone;
        uniform float uRotationY;

        void main() {
          // カメラ正面(lon=0°)からの角度差でトーンを計算
          // groupのY軸回転を考慮してカメラ正面に近い星を明るくする
          float lonDiff = aLon + uRotationY;
          // -PI〜PI に正規化
          lonDiff = mod(lonDiff + 3.14159265, 6.28318530) - 3.14159265;
          // 正面(0)で1.0、背面(PI)で0.35
          vTone = 0.35 + 0.65 * (1.0 - abs(lonDiff) / 3.14159265);

          vec4 mvPos = modelViewMatrix * vec4(position, 1.0);
          gl_Position  = projectionMatrix * mvPos;
          gl_PointSize = aSize * vTone * (100.0 / -mvPos.z);
        }
      `,
      fragmentShader: `
        varying float vTone;

        void main() {
          vec2  uv   = gl_PointCoord - 0.5;
          float dist = length(uv);
          if (dist > 0.5) discard;

          float core = exp(-dist * dist * 70.0);
          float glow = exp(-dist * dist *  10.0) * 0.2;
          float alpha = (core + glow) * vTone;

          // 青白ベース、コア中心は白に近づける
          vec3 baseColor = vec3(0.72, 0.85, 1.0); // 青白
          vec3 col = mix(baseColor, vec3(1.0), core * 0.7);

          gl_FragColor = vec4(col, alpha);
        }
      `,
      transparent:  true,
      depthWrite:   false,
      blending:     THREE.AdditiveBlending,
    });

    this.starPoints = new THREE.Points(geometry, material);
    this.group.add(this.starPoints);
  }

  // ------- 星座線を構築 -------
  _buildLines() {
    const R = 2.35;

    // 全接続線を1つのLineSegmentsにまとめる
    const vertArr = [];
    const lonArr  = [];

    ALL_CONSTELLATIONS.forEach(con => {
      con.lines.forEach(([a, b]) => {
        const vA = toVec3(con.stars[a].lat, con.stars[a].lon, R);
        const vB = toVec3(con.stars[b].lat, con.stars[b].lon, R);
        vertArr.push(vA.x, vA.y, vA.z);
        vertArr.push(vB.x, vB.y, vB.z);
        // 線の中間点のlonでトーンを代表させる
        const midLon = (con.stars[a].lon + con.stars[b].lon) / 2 * Math.PI / 180;
        lonArr.push(midLon, midLon);
      });
    });

    const positions = new Float32Array(vertArr);
    const lonAttrib = new Float32Array(lonArr);

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('aLon',     new THREE.BufferAttribute(lonAttrib, 1));

    const material = new THREE.ShaderMaterial({
      uniforms: {
        uRotationY: { value: 0.0 },
      },
      vertexShader: `
        attribute float aLon;
        varying float vTone;
        uniform float uRotationY;

        void main() {
          float lonDiff = aLon + uRotationY;
          lonDiff = mod(lonDiff + 3.14159265, 6.28318530) - 3.14159265;
          vTone = 0.25 + 0.75 * (1.0 - abs(lonDiff) / 3.14159265);

          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        varying float vTone;

        void main() {
          gl_FragColor = vec4(0.4, 0.6, 0.9, vTone * 0.8);
        }
      `,
      transparent: true,
      depthWrite:  false,
      blending:    THREE.AdditiveBlending,
    });

    this.lineSegments = new THREE.LineSegments(geometry, material);
    this.group.add(this.lineSegments);
  }

  // ------- 毎フレーム更新 -------
  update(dt) {
    // Y軸回転（Z軸23°傾きはgroupに固定済み）
    this.group.rotation.y += 0.0015 * dt * 60;

    // Shaderのurotationを同期（カメラ正面トーン計算用）
    const ry = this.group.rotation.y;
    this.starPoints.material.uniforms.uRotationY.value   = ry;
    this.lineSegments.material.uniforms.uRotationY.value = ry;
  }

  toggle() {
    this.visible = !this.visible;
    this.group.visible = this.visible;
  }

  dispose() {
    this.group.children.forEach(child => {
      if (child.geometry) child.geometry.dispose();
      if (child.material) child.material.dispose();
    });
    this.scene.remove(this.group);
  }
}