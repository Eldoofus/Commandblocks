const presstick=20; const timerid=0; const blocksize=Vars.tilesize*1.5;
const animspeed=40;
const boostcolor=Color.valueOf("ffbb77");
const boostblock = newEffect(20, e => {
  Draw.color(boostcolor);
  Lines.stroke(e.fout() * 4);
  Lines.square(e.x, e.y, e.fin() * 11.5);
});
const boostpad = extendContent(Block, "boostpad", {
  placed(tile) {
    this.super$placed(tile);
    tile.ent().timer.reset(timerid,presstick+1);
  },
  draw(tile) {
    Draw.rect(this.animRegion[Mathf.floorPositive((Time.time()%160)/animspeed)], tile.drawx(), tile.drawy());
    /*
    if(!tile.ent().timer.check(timerid,presstick)){
      Draw.blend(Blending.additive);
      Draw.alpha((presstick-tile.ent().timer.getTime(timerid))/presstick/1.5);
      Draw.rect(this.topRegion, tile.drawx(), tile.drawy());
      Draw.color();
      Draw.blend();
    }
    */
  },
  unitOn(tile,unit){
    if(tile.ent().timer.check(timerid,presstick)){
      Sounds.flame.at(tile.worldx(),tile.worldy(),0.3);
      Effects.effect(boostblock, tile.drawx(), tile.drawy());
    }
    tile.ent().timer.reset(timerid,0);
    unit.velocity().add(unit.velocity().x*Time.delta()*3,unit.velocity().y*Time.delta()*3);
  },
  update(tile){
    this.super$update(tile);
    Units.nearby(tile.worldx(),tile.worldy(),blocksize,blocksize,cons(e => {
      this.unitOn(tile,e);
    }));
  },
  load(){
    this.super$load();
    this.animRegion=[];
    for(var i=0;i<4;i++){
      this.animRegion.push(Core.atlas.find(this.name+"-"+i));
    }
    this.topRegion=Core.atlas.find(this.name+"-top");
  }
});