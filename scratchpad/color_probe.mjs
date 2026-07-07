import * as THREE from 'three';
console.log('ColorManagement.enabled =', THREE.ColorManagement.enabled);
const hexes = {
  about: '#ff2d9c', services: '#05d9e8', works: '#b14dff',
  career: '#ff9e2c', contact: '#1f8fff',
};
const luma = (c) => 0.2126*c.r + 0.7152*c.g + 0.0722*c.b;
for (const [k,h] of Object.entries(hexes)) {
  const c = new THREE.Color(h);
  console.log(k.padEnd(9), h, 'linear rgb=', c.r.toFixed(3), c.g.toFixed(3), c.b.toFixed(3), 'luma=', luma(c).toFixed(4));
}
