import fs from 'node:fs/promises';
async function replace(file, old, next) {
  const source=await fs.readFile(file,'utf8');
  if(source.split(old).length!==2)throw new Error(`Expected one matching block in ${file}`);
  await fs.writeFile(file,source.replace(old,next),'utf8');
}
await replace('src/HotelMap.tsx', 'return <section className={`map-panel', 'return <section id="floor-map" tabIndex={-1} className={`map-panel');
await replace('src/HotelMap.tsx', '<div className="map-scroll" ref={scroll}', '{routeFloors.length>0&&!routeFloors.includes(floor)&&<div className="map-floor-hint"><span>The selected route does not pass through this floor.</span><button className="text-button" onClick={()=>onFloor(routeFloors[0])}>Show route floor</button></div>}<div className="map-scroll" ref={scroll}');
await replace('src/FloorPlanStudio.tsx','<section className="review-panel"><h2>Review this floor</h2>','<section className="review-panel" id="studio-review" tabIndex={-1}><h2>Review this floor</h2>');
