const cblist = ["commandblock","commandblockchained","commandblockrepeating"];
const KeyCode=Packages.arc.input.KeyCode;
const commandbFunc = this.global.commandblocks;
const timerid = 0;

const commandb = extendContent(MessageBlock, "commandb", {
  dialog: null,
  tempType: 0,
  tempCond: false,
  tempPower: true,
  tempDelay: 0,
  placed(tile) {
    this.super$placed(tile);
  },
  shouldShowConfigure(tile, player){
    return (!Vars.net.active())||player.isAdmin;
  },
  canPlaceOn(tile){
    return ((!Vars.net.active())||Vars.player.isAdmin)&&this.super$canPlaceOn(tile);
	},
	canBreak(tile){
		return((!Vars.net.active())||Vars.player.isAdmin)&&this.super$canBreak(tile);
	},
  handleDamage(tile,amount){
    return 0;
  },
  handleBulletHit(entity,bullet){
    entity.damage(0);
  },
  draw(tile) {
    const entity = tile.ent();
    Draw.rect(this.cmdRegion[entity.getType()][(entity.getCond())?1:0][tile.rotation()], tile.drawx(), tile.drawy());
  },
  drawRequestConfig(req, list){
    const value = req.config;
    try{
      Draw.rect(this.cmdRegion[value%4][Math.floor(value/8)%2][req.rotation], req.drawx(), req.drawy(), this.region.getWidth() * req.animScale * Draw.scl, this.region.getHeight() * req.animScale * Draw.scl, 0);
    }
    catch(err){
      print(err);
    }
  },
  load(){
    this.super$load();
    this.region = Core.atlas.find("commandblocks-commandb");
    this.dialog = new FloatingDialog(Core.bundle.get("command.title"));
    //this.dialog.addCloseButton();
    this.cmdRegion = [];
    for(var i=0;i<cblist.length;i++){
      var tmpi = [];
      for(var j=0;j<2;j++){
        var tmpj = [];
        for(var k=0;k<4;k++){
          tmpj.push(Core.atlas.find("commandblocks-commandb-"+i+"-"+j+"-"+k));
        }
        tmpi.push(tmpj);
      }
      this.cmdRegion.push(tmpi);
    }
  },
  update(tile){
    this.super$update(tile);
    var type = tile.ent().getType();
    if(tile.ent().getCond()){
      if(type == 0 && tile.ent().getRun() && !((!tile.ent().getPower())||tile.ent().cons.valid())) tile.ent().setRun(false);
      return; //conditional command blocks should be processed at its 'head'.
    }
    switch(type){
      case 0:
        this.updateImpulse(tile);
      break;
      case 1:
        //chained command blocks should be processed at its 'head'.
      break;
      case 2:
        this.updateRepeating(tile);
      break;
    }
  },
  updateImpulse(tile){
    if((!tile.ent().getPower())||tile.ent().cons.valid()){
      if(!tile.ent().getRun()){
        tile.ent().setRun(true);
        if(tile.ent().getDelay() == 0){
          var res = Boolean(commandbFunc.command(tile,tile.ent().message,tile,tile.ent().message,false));
          if(res && tile.ent().getErr() != "") tile.ent().setErr("");
          this.updateChains(tile, res);
        }
        else{
          Time.run(tile.ent().getDelay(),run(()=>{
            try{
              var res = Boolean(commandbFunc.command(tile,tile.ent().message,tile,tile.ent().message,false));
              if(res && tile.ent().getErr() != "") tile.ent().setErr("");
              this.updateChains(tile, res);
            }
            catch(err){}
          }));
        }
      }
    }
    else if(tile.ent().getRun()) tile.ent().setRun(false);
  },
  updateRepeating(tile){
    if((!tile.ent().getPower())||tile.ent().cons.valid()){
      if(tile.ent().getDelay() == 0){
        var res = Boolean(commandbFunc.command(tile,tile.ent().message,tile,tile.ent().message,false));
        if(res && tile.ent().getErr() != "") tile.ent().setErr("");
        this.updateChains(tile, res);
      }
      else if(tile.ent().timer.get(timerid, tile.ent().getDelay())){
        Time.run(tile.ent().getDelay(),run(()=>{
          try{
            var res = Boolean(commandbFunc.command(tile,tile.ent().message,tile,tile.ent().message,false));
            if(res && tile.ent().getErr() != "") tile.ent().setErr("");
            this.updateChains(tile, res);
          }
          catch(err){}
        }));
      }
    }
  },
  updateChained(tile){
    if((!tile.ent().getPower())||tile.ent().cons.valid()){
      if(tile.ent().getDelay() == 0){
        var res = Boolean(commandbFunc.command(tile,tile.ent().message,tile,tile.ent().message,false));
        if(res && tile.ent().getErr() != "") tile.ent().setErr("");
        this.updateChains(tile, res);
      }
      else{
        Time.run(tile.ent().getDelay(),run(()=>{
          try{
            var res = Boolean(commandbFunc.command(tile,tile.ent().message,tile,tile.ent().message,false));
            if(res && tile.ent().getErr() != "") tile.ent().setErr("");
            this.updateChains(tile, res);
          }
          catch(err){}
        }));
      }
    }
  },
  updateChains(tile, last){
    //update all the chain snek
    var next = tile.getNearby(tile.rotation());
    if(next.block().name != "commandblocks-commandb") return;//fuc:ohno: compatibility with legacy command blocks
    if(next.getNearby((next.rotation()+2)%4) != tile) return;//someone is bound to make loops if this is not a thing
    if(!(next.ent().getCond() || next.ent().getType()==1)) return;//already updated, it is the head
    switch(next.ent().getType()){
      case 0:
        if(last){
          this.updateImpulse(next);
        }
      break;
      case 1:
        if(next.ent().getCond()){
          if(last){
            this.updateChained(next);
          }
        }
        else{
          this.updateChained(next);
        }
      break;
      case 2:
        if(last){
          this.updateRepeating(next);
          /*
          if(next.ent().getDelay() == 0){
            var res = Boolean(commandbFunc.command(next,next.ent().message,next,next.ent().message,false));
            if(res && next.ent().getErr() != "") next.ent().setErr("");
            this.updateChains(next, res);
          }
          else{
            Time.run(next.ent().getDelay(),run(()=>{
              var res = Boolean(commandbFunc.command(next,next.ent().message,next,next.ent().message,false));
              if(res && next.ent().getErr() != "") next.ent().setErr("");
              this.updateChains(next, res);
            }));
          }
          */
        }
      break;
    }
  },
  buildConfiguration(tile, table){
    table.addImageButton(Icon.pencil, run(() => {
      this.dialog.cont.clear();
      try{
        this.setupDialog(tile, this.dialog);
      }
      catch(err){
        print(err);
      }
      this.dialog.show();
    })).size(40);
  },
  configured(tile, player, value){
    var ctype = value%4;
    var cpower = Math.floor(value/4) % 2;
    var ccond = Math.floor(value/8) % 2;
    var cdelay = Math.floor(value/16);
    tile.ent().setType(ctype);
    tile.ent().setPower(cpower);
    tile.ent().setCond(ccond);
    tile.ent().setDelay(cdelay);
  },
  addCommandType(popup, tbutton, ti){
    popup.cont.addImage(Core.atlas.find("commandblocks-commandb-"+ti)).size(8 * 4).pad(3).get().clicked(run(() => {
      this.tempType = ti;
      popup.hide();
      tbutton.replaceImage(Image(Core.atlas.find("commandblocks-commandb-"+this.tempType)));
    }));
  },
  setupDialog(tile, dialog){
    var cont = dialog.cont;
    var textarea = new TextArea(tile.ent().message.replace(/\n/g, "\r"));
    textarea.setMessageText(Core.bundle.get("command.command.textbox"));

    var error = tile.ent().getErr();
    this.tempType = tile.ent().getType();
    this.tempPower = tile.ent().getPower();
    this.tempCond = tile.ent().getCond();
    this.tempDelay = tile.ent().getDelay();
    var ta = null;

    cont.pane(cons(table => {
      table.margin(10).top();
      table.add(Core.bundle.get("command.command.name")).growX().left().color(Pal.accent);
      table.row();
      table.addImage().growX().height(3).pad(6).color(Pal.accent);
      table.row();

      ta = table.add(textarea).height(200).growX().pad(6).get();
      if(Vars.mobile){
        ta.tapped(run(() => {
          const input = new Input.TextInput();
          input.text = textarea.getText().replace(/\r/g, "\n");
          input.multiline = true;
          input.accepted = cons(tx => textarea.setText(tx.replace(/\n/g, "\r")));
          Core.input.getTextInput(input);
        }));
      }
      table.row();

      if(error!=""){
        table.labelWrap("[scarlet]E: "+error+"[]").growX().padLeft(19);
        table.row();
      }

      table.table(cons(r => {
        r.right();
        r.addImageButton(Icon.paste, Styles.defaulti, run(()=>{
          Core.app.setClipboardText((Vars.mobile)?textarea.getText().replace(/\r/g,"\n"):textarea.getText());
        })).size(40);

        if(error!=""){
          Styles.defaulti.imageUpColor = Color.red;
          r.addImageButton(Icon.paste, run(()=>{
            Core.app.setClipboardText(error);
          })).size(40).padLeft(5);
          Styles.defaulti.imageUpColor = Color.white;
        }
      })).growX();
      table.row();

      table.add(Core.bundle.get("command.options.name")).growX().left().color(Pal.accent);
      table.row();
      table.addImage().growX().height(3).pad(6).color(Pal.accent);
      table.row();

      const boolc = method => new Boolc(){get : method};
      const boolp = method => new Boolp(){get : method};

      table.table(cons(r => {
        r.left();
        r.add(Core.bundle.get("command.options.type")).left().padRight(5).pad(6);
        var tbutton = r.addImageButton(TextureRegionDrawable(Core.atlas.find("commandblocks-commandb-"+this.tempType)), run(() => {
          var popup = new FloatingDialog("");
          popup.setFillParent(false);
          for(var i=0;i<cblist.length;i++){
            this.addCommandType(popup, tbutton, i);
          }
          popup.show();
        })).get();
        r.row();
      })).growX();
      table.row();

      table.table(cons(r => {
        r.addCheck(Core.bundle.get("command.options.needspower"),boolc(c=>{this.tempPower = c;})).checked(boolp(()=>tile.ent().getPower()).get()).pad(6).growX().get().left();
        r.row();
      })).growX();
      table.row();

      table.table(cons(r => {
        r.addCheck(Core.bundle.get("command.options.conditional"),boolc(c=>{this.tempCond = c;})).checked(boolp(()=>tile.ent().getCond()).get()).pad(6).growX().get().left();
        r.row();
      })).growX();
      table.row();

      table.table(cons(t => {
        t.left();
        t.add(Core.bundle.get("command.options.delay")).left().padRight(5).pad(6);
        Vars.platform.addDialog(t.addField(tile.ent().getDelay(), cons(tx=>{
          if(Math.floor(tx)>=0&&Math.floor(tx)<512){
            this.tempDelay = Math.floor(tx);
          }
        })).get());
      })).growX();
      table.row();

    })).width((Vars.mobile)?460:530);
    this.dialog.buttons.clear();
    this.dialog.buttons.defaults().size(210, 64);
    this.dialog.buttons.addImageTextButton("$back", Icon.save, run(()=>{
      try{
        var confvalue = this.tempType + 4*((this.tempPower)?1:0) + 8*((this.tempCond)?1:0) + 16*this.tempDelay;
        tile.configure(confvalue);
        Call.setMessageBlockText(Vars.player, tile, ta.getText());
      }
      catch(err){
        print(err);
      }
      this.dialog.hide();
    })).size(210, 64);

    this.dialog.keyDown(cons(key => {
      //Why the fuck does this work but ill take it
      if(key == KeyCode.ESCAPE || key == KeyCode.BACK){
        Core.app.post(run(()=>{this.dialog.hide();}));
      }
    }));
  },
  setMessageBlockText(player, tile, text){
    if(!Units.canInteract(player, tile)) return;
    //can be broken while a player is typing
    if(!(tile.block() instanceof MessageBlock)){
        return;
    }

    var result = new StringBuilder(text.length());
    text = text.trim();
    var count = 0;
    for(var i = 0; i < text.length(); i++){
        var c = text.charAt(i);
        if(c == '\n' || c == '\r'){
            count ++;
            result.append('\n');
        }else{
            result.append(c);
        }
    }

    var entity = tile.ent();
    if(entity != null){
      entity.message = result.toString();
      entity.lines = entity.message.split("\n");
    }
  }
});

commandb.entityType=prov(()=>extendContent(MessageBlock.MessageBlockEntity, commandb, {
  _run: false,
  _type: 0,
  _cond: false,
  _power: true,
  _delay: 0,
  _err: "",
  getRun() {
    return this._run;
  },
  setRun(a) {
    this._run = (a)?true:false;
  },
  getType() {
    return this._type;
  },
  setType(a) {
    this._type = a%cblist.length;
  },
  getCond() {
    return this._cond;
  },
  setCond(a) {
    this._cond = (a)?true:false;
  },
  getPower() {
    return this._power;
  },
  setPower(a) {
    this._power = (a)?true:false;
  },
  getDelay() {
    return this._delay;
  },
  setDelay(a) {
    this._delay = (!isNaN(Math.floor(a))&&Math.floor(a)>=0)?((Math.floor(a)>32767)?32767:Math.floor(a)):0;
  },
  getErr() {
    return this._err;
  },
  setErr(text) {
    this._err = text;
  },
  write(stream) {
    this.super$write(stream);
    stream.writeByte(this.getType());
    stream.writeBoolean(this.getCond());
    stream.writeBoolean(this.getPower());
    stream.writeShort(this.getDelay());
  },
  read(stream, revision) {
    this.super$read(stream, revision);
    this.setType(stream.readByte());
    this.setCond(stream.readBoolean());
    this.setPower(stream.readBoolean());
    this.setDelay(stream.readShort());
    this.setErr("");
  },
  config(){
    return this._type + 4*((this._power)?1:0) + 8*((this._cond)?1:0) + 16*this._delay;
  }
}));
