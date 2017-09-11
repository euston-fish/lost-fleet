const NAMES = [
  'Assyrians',
  'Babylonians',
  'Choson',
  'Egyptians',
  'Greeks',
  'Hittites',
  'Minoans',
  'Persians',
  'Phoenicians',
  'Shang',
  'Sumerians',
  'Yamato',
  'Carthaginians',
  'Macedonians',
  'Palmyrans',
  'Romans'
];

Array.prototype.sample = function() {
  return this.splice(Math.random() * this.length, 1)[0];
}
