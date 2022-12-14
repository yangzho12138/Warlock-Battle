class AcGameMenu {
    constructor(root){ // 传入的root是总对象，即AcGame对象
        this.root = root;
        // jquery中html对象前面加$符号
        this.$menu = $(`
            <div class="ac-game-menu">
                <div class="ac-game-menu-field">
                    <div class="ac-game-menu-field-item ac-game-field-item-single">
                        Single-Player
                    </div>
                    <div class="ac-game-menu-field-item ac-game-field-item-multi">
                        Multi-Players
                    </div>
                    <div class="ac-game-menu-field-item ac-game-field-item-settings">
                        Settings
                    </div>
                </div>
                <div class="ac-game-menu-intro">
                    <div class="ac-game-menu-intro-title">
                        Welcome to Warlock Battle
                    </div>
                    <div class="ac-game-menu-intro-description">
                        This is a xxx game, users need to manipulate the role to defeat others
                    </div>
                </div>
            </div>
        `);
        this.$menu.hide(); // 用户在登陆状态下才显示菜单页面
        this.root.$ac_game.append(this.$menu);
        // 在$menu中找到特定class的对象,将其定义为button
        this.$single = this.$menu.find('.ac-game-field-item-single');
        this.$multi = this.$menu.find('.ac-game-field-item-multi');
        this.$settings = this.$menu.find('ac-game-field-item-settings');

        this.start();
    }
    start(){
        this.add_listening_events();
    }

    add_listening_events(){
        let outer = this; // 进入到内部函数this会改变
        this.$single.click(function(){
           outer.hide();
           outer.root.playground.show("single mode");
        });
        this.$multi.click(function(){
            outer.hide();
            outer.root.playground.show("multi mode");
        });
        this.$settings.click(function(){

        });
    }

    show(){ //显示页面
        this.$menu.show();
    }

    hide(){ // 关闭页面
        this.$menu.hide();
    }
}
