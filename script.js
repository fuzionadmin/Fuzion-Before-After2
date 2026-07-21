export default class EditorState {

    constructor() {

        this.images = {

            left: null,
            right: null

        };

        this.transform = {

            left: this.defaultTransform(),

            right: this.defaultTransform()

        };

        this.selected = null;

        this.editMode = true;

        this.history = [];

        this.redo = [];

    }

    defaultTransform(){

        return{

            x:0,

            y:0,

            scale:1,

            rotation:0,

            width:null,

            height:null

        };

    }

    get(side){

        return this.transform[side];

    }

    set(side,data){

        this.transform[side]={

            ...this.transform[side],

            ...data

        };

    }

    reset(side){

        this.transform[side]=this.defaultTransform();

    }

    select(side){

        this.selected=side;

    }

    clearSelection(){

        this.selected=null;

    }

    isSelected(side){

        return this.selected===side;

    }

    setImage(side,img){

        this.images[side]=img;

    }

    getImage(side){

        return this.images[side];

    }

    hasImage(side){

        return this.images[side]!=null;

    }

    enableEdit(){

        this.editMode=true;

    }

    disableEdit(){

        this.editMode=false;

    }

    toggleEdit(){

        this.editMode=!this.editMode;

    }

    pushHistory(){

        const snapshot=JSON.stringify({

            transform:this.transform

        });

        this.history.push(snapshot);

        if(this.history.length>50){

            this.history.shift();

        }

        this.redo=[];

    }

    undo(){

        if(this.history.length===0)return;

        const last=this.history.pop();

        this.redo.push(

            JSON.stringify({

                transform:this.transform

            })

        );

        this.transform=JSON.parse(last).transform;

    }

    redoAction(){

        if(this.redo.length===0)return;

        const item=this.redo.pop();

        this.history.push(

            JSON.stringify({

                transform:this.transform

            })

        );

        this.transform=JSON.parse(item).transform;

    }

}
export default class Renderer {

    constructor(state) {

        this.state = state;

    }

    render(side) {

        const image = this.state.getImage(side);

        if (!image) return;

        const t = this.state.get(side);

        image.style.position = "absolute";

        image.style.left = "50%";
        image.style.top = "50%";

        image.style.transformOrigin = "center center";

        image.style.transform =
            `
            translate(-50%, -50%)
            translate(${t.x}px, ${t.y}px)
            scale(${t.scale})
            rotate(${t.rotation}deg)
            `;

    }

    renderAll() {

        this.render("left");
        this.render("right");

    }

    reset(side) {

        this.state.reset(side);

        this.render(side);

    }

    center(side) {

        const t = this.state.get(side);

        t.x = 0;
        t.y = 0;

        this.render(side);

    }

    setScale(side, scale) {

        const t = this.state.get(side);

        t.scale = Math.max(0.2, Math.min(scale, 8));

        this.render(side);

    }

    zoom(side, delta) {

        const t = this.state.get(side);

        t.scale += delta;

        t.scale = Math.max(0.2, Math.min(t.scale, 8));

        this.render(side);

    }

    rotate(side, degree) {

        const t = this.state.get(side);

        t.rotation = degree;

        this.render(side);

    }

    rotateBy(side, degree) {

        const t = this.state.get(side);

        t.rotation += degree;

        this.render(side);

    }

    move(side, dx, dy) {

        const t = this.state.get(side);

        t.x += dx;

        t.y += dy;

        this.render(side);

    }

    moveTo(side, x, y) {

        const t = this.state.get(side);

        t.x = x;

        t.y = y;

        this.render(side);

    }

    fitCover(side, slot) {

        const img = this.state.getImage(side);

        if (!img) return;

        const t = this.state.get(side);

        const sw = slot.clientWidth;
        const sh = slot.clientHeight;

        const iw = img.naturalWidth;
        const ih = img.naturalHeight;

        if (!iw || !ih) return;

        const scale = Math.max(
            sw / iw,
            sh / ih
        );

        t.scale = scale;

        t.x = 0;
        t.y = 0;
        t.rotation = 0;

        this.render(side);

    }

    refresh(side, slot) {

        this.fitCover(side, slot);

    }

}
export default class ImageLayer {

    constructor(side, container, state, renderer) {

        this.side = side;

        this.container = container;

        this.state = state;

        this.renderer = renderer;

        this.image = null;

        this.selected = false;

        this.create();

    }

    create() {

        this.image = document.createElement("img");

        this.image.draggable = false;

        this.image.style.position = "absolute";

        this.image.style.left = "50%";

        this.image.style.top = "50%";

        this.image.style.userSelect = "none";

        this.image.style.touchAction = "none";

        this.image.style.transformOrigin = "center center";

        this.image.style.cursor = "grab";

        this.container.innerHTML = "";

        this.container.appendChild(this.image);

    }

    load(src) {

        return new Promise((resolve)=>{

            this.image.onload=()=>{

                this.state.setImage(this.side,this.image);

                this.renderer.fitCover(

                    this.side,

                    this.container

                );

                resolve();

            };

            this.image.src=src;

        });

    }

    select(){

        this.selected=true;

        this.container.classList.add("selected");

    }

    deselect(){

        this.selected=false;

        this.container.classList.remove("selected");

    }

    remove(){

        this.image.src="";

        this.state.setImage(this.side,null);

    }

    reset(){

        this.state.reset(this.side);

        this.renderer.render(this.side);

    }

}
