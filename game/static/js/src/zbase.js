export class AcGame{
    constructor(id, CloudOs, access, refresh){
        this.id = id;
        this.$ac_game = $('#' + id); // 获取对应id的div标签
        this.CloudOs = CloudOs; // web端没有此参数，云端app此参数提供一系列接口

        this.access = access;
        this.refresh = refresh;

        //this.menu = new AcGameMenu(this);
        this.settings = new Settings(this);
        this.menu = new AcGameMenu(this);
        this.playground = null;

        this.start();
    }

    start(){
    }
}
