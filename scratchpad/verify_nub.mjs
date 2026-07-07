// nub 端点の四角が正方形か bowtie(自己交差)か判定。
// 現状の頂点順: [tx-nx, tx+nx, -tx+nx, -tx-nx] を順に結ぶ。
// 端点中心 (ex,ey)、法線 n=(nx,ny)、接線 t=(-ny,nx)=(tx,ty)。
// 各コーナー = ex + (a*t + b*n)*tip の (a,b) 係数で表す。
function corners(order){
  return order.map(([a,b])=>({a,b})); // 単位正方形(tip=1)の (t係数, n係数)
}
// 現状の実装(コード通り): 展開すると (tx±nx, ...) は成分。単位で (a,b):
//  corner0: (t - n) -> a=+1,b=-1
//  corner1: (t + n) -> a=+1,b=+1
//  corner2: (-t + n)-> a=-1,b=+1
//  corner3: (-t - n)-> a=-1,b=-1
const current = corners([[+1,-1],[+1,+1],[-1,+1],[-1,-1]]);
function isSimpleSquare(cs){
  // 順に結んだ辺が隣接コーナー間で、対角線でない(=正しい巡回順)かを面積で判定。
  // shoelace 面積が 0 でなく、かつ 4辺の長さが等しければ正方形の単純多角形。
  let area=0;
  for(let i=0;i<4;i++){const p=cs[i],q=cs[(i+1)%4];area+=p.a*q.b-q.a*p.b;}
  area=Math.abs(area/2);
  const side=(p,q)=>Math.hypot(p.a-q.a,p.b-q.b);
  const sides=[0,1,2,3].map(i=>side(cs[i],cs[(i+1)%4]));
  return {area, sides};
}
const r=isSimpleSquare(current);
console.log('current order (a,b):', current.map(c=>`(${c.a},${c.b})`).join(' '));
console.log('shoelace area =', r.area, ' sides =', r.sides.map(s=>s.toFixed(3)).join(','));
console.log(r.area===4 ? 'SIMPLE SQUARE (area=4, side=2 each)' : (r.area===0?'DEGENERATE/BOWTIE (area=0)':`area=${r.area} -> not unit square`));

// 正しい巡回順(反時計回り): (t+n),(−t+n),(−t−n),(t−n) = TL,TR... 実座標で連続する順。
const fixed = corners([[+1,+1],[-1,+1],[-1,-1],[+1,-1]]);
const rf=isSimpleSquare(fixed);
console.log('\nfixed order (a,b):', fixed.map(c=>`(${c.a},${c.b})`).join(' '));
console.log('shoelace area =', rf.area, ' sides =', rf.sides.map(s=>s.toFixed(3)).join(','));
console.log(rf.area===4 ? 'SIMPLE SQUARE OK' : 'still wrong');
