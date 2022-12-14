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
let AC_GAME_OBJECTS = [] // 全局变量，一个物体创建后将其加入数组

class AcGameObject{
    constructor(){
        AC_GAME_OBJECTS.push(this);
        this.has_called_start = false; //是否执行过start函数
        this.timedelta = 0; //当前帧距离上一帧的时间间隔——防止不同浏览器在1s内渲染的帧数不同，因此用时间来衡量刷新的速度
        this.uuid = this.create_uuid(); // 为每个对象创建一个唯一的id
    }

    create_uuid(){
        let res = "";
        for(let i=0; i<8; i++){
            let x = parseInt(Math.floor(Math.random() * 10));
            res += x;
        }
        return res;
    }

    // 只会在第一帧执行
    start(){
    }

    // 每一帧会执行一次
    update(){
    }

    // 在每一帧的最后执行一次,这样渲染的物体会出现在最上层
    late_update(){
    }

    // 在被删除前执行一次
    on_destory(){
    }

    // 删掉该物体
    destory(){
        this.on_destory();
        for(let i = 0; i < AC_GAME_OBJECTS.length; i++){
            if(AC_GAME_OBJECTS[i] === this){
                AC_GAME_OBJECTS.splice(i, 1);
                break;
            }
        }
    }


}

let last_timestamp;
let AC_GAME_ANIMATION = function(timestamp){
    for(let i = 0; i < AC_GAME_OBJECTS.length; i++){
        let obj = AC_GAME_OBJECTS[i];
        if(!obj.has_called_start){
            obj.start();
            obj.has_called_start = true;
        }else{
            obj.timedelta = timestamp - last_timestamp;
            obj.update();
        }
    }

    for(let i = 0; i < AC_GAME_OBJECTS.length; i++){
        let obj = AC_GAME_OBJECTS[i];
        obj.late_update();
    }

    last_timestamp = timestamp;

    requestAnimationFrame(AC_GAME_ANIMATION)
}

requestAnimationFrame(AC_GAME_ANIMATION);
class ChatField{
    constructor(playground){
        this.playground = playground;

        this.$history = $(`<div class="chat-field-history"> </div>`);
        this.$input = $(`<input type="text" class="chat-field-input">`);

        this.$history.hide();
        this.$input.hide();

        this.func_id = null;

        this.playground.$playground.append(this.$history);
        this.playground.$playground.append(this.$input);

        this.start();
    }

    start(){
        this.add_listening_events();
    }

    add_listening_events(){
        let outer = this;
        // 使聚焦在聊天框时按esc也能退出聊天框
        this.$input.keydown(function (e){
            if(e.which === 27){
                outer.hide_input();
                return false;
            }else if(e.which === 13){
                let username = outer.playground.root.settings.username;
                let text = outer.$input.val();
                if(text){
                    outer.$input.val(""); // 清空聊天框内的内容
                    outer.add_message(username, text);
                    outer.playground.mps.send_message(username, text);
                }
                return false;
            }
        });
    }

    render_message(message){ // 将信息渲染为html格式
        return $(`<div> ${message} </div>`);
    }

    add_message(username, text){
        this.show_history();
        let message = `[${username}]${text}`;
        this.$history.append(this.render_message(message));
        this.$history.scrollTop(this.$history[0].scrollHeight);
    }

    show_history(){
        let outer = this;
        this.$history.fadeIn();
        // 避免某一次打开后，上一次的定时函数还未执行完毕，因此不到3s就将窗口关闭了
        if(this.func_id)
            clearTimeout(this.func_id);

        // 显示3s后关闭
        this.func_id = setTimeout(function(){
            outer.$history.fadeOut();
            outer.func_id = null;
        }, 3000);
    }

    show_input(){
        this.show_history();
        this.$input.show();
        this.$input.focus();
    }

    hide_input(){
        this.$input.hide();
        // 将焦点重新聚集到canvas上
        this.playground.game_map.$canvas.focus();
    }
}
class GameMap extends AcGameObject{
    constructor(playground){ // 传入AcGamePlayground对象
        super();

        this.playground = playground;
        // 渲染画面：canvas
        this.$canvas = $(`<canvas tabindex=0> </canvas>`); // tabindex使canvas元素可以监听事件
        this.ctx = this.$canvas[0].getContext('2d');
        this.ctx.canvas.width = this.playground.width;
        this.ctx.canvas.height = this.playground.height;
        this.playground.$playground.append(this.$canvas);

    }

    start(){
        this.$canvas.focus();
    }
    // 背景大小自适应
    resize(){
        this.ctx.canvas.width = this.playground.width;
        this.ctx.canvas.height = this.playground.height;
        this.ctx.fillStyle = "rgba(0,0,0,1)";
        this.ctx.fillRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height);

    }

    update(){
        this.render();
    }

    render(){
        this.ctx.fillStyle = "rgba(0,0,0,0.2)";
        this.ctx.fillRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height);

    }
}
class NoticeBoard extends AcGameObject{
    constructor(playground){
        super();

        this.playground = playground;
        this.ctx = this.playground.game_map.ctx;
        this.text = "waiting for begin: 0 players prepared";
    }

    start(){
    }

    write(text){
        this.text = text;
    }

    update(){
        this.render();
    }

    // 需要每一帧都渲染
    render(){
        // canvas 渲染文本
        this.ctx.font = "20px serif";
        this.ctx.fillStyle = "white";
        this.ctx.textAlign = "center";
        this.ctx.fillText(this.text, this.playground.width / 2, 20);
    }
}
class Particle extends AcGameObject{
    constructor(playground, x, y, radius, vx, vy, color, speed){
        super();

        this.playground = playground;
        this.ctx = this.playground.game_map.ctx;
        this.x = x;
        this.y = y;
        this.radius = radius;
        this.vx = vx;
        this.vy = vy;
        this.color = color;
        this.speed = speed;
        this.frication = 0.9;
        this.eps = 0.01;
    }

    start(){
    }

    update(){
        if(this.speed < this.eps){
            this.destory();
            return false;
        }

        this.x += this.vx * this.speed * this.timedelta / 1000;
        this.y += this.vy * this.speed * this.timedelta / 1000;
        this.speed *= this.frication;
        this.render();
    }

    render(){
        let scale = this.playground.scale;
        this.ctx.beginPath();
        this.ctx.arc(this.x * scale, this.y * scale, this.radius * scale, 0 ,Math.PI * 2, false);
        this.ctx.fillStyle = this.color;
        this.ctx.fill();
    }
}
class Player extends AcGameObject{
    // 传入地图，玩家圆心的x和y坐标，颜色，速度（占屏幕百分比），是否是玩家自己（自己由鼠标操纵，其他玩家由网络传入的信息操作
    constructor(playground, x, y, radius, color, speed, character, username, photo){
        super();

        this.playground = playground;
        this.ctx = this.playground.game_map.ctx;
        this.x = x;
        this.y = y;
        this.vx = 0; // 鼠标点击移动的角度
        this.vy = 0;
        this.damage_x = 0; //被击中后移动的角度
        this.damage_y = 0;
        this.damage_speed = 0; // 被击中后的移动速度
        this.friction = 0.9; //被击中后影响速度的摩擦力
        this.move_length = 0;
        this.radius = radius;
        this.color = color;
        this.speed = speed;
        this.character = character;
        this.username = username;
        this.photo = photo;
        this.eps = 0.01; // 允许的误差


        this.cur_skill = null;
        this.spent_time = 0;

        this.fireballs = [];

        if(this.character !== "robot"){
            this.img = new Image();
            this.img.src = this.photo;
        }
        if(this.character === "me"){
            this.fireball_coldtime = 3; // 冷却时间3s
            this.fireball_img = new Image();
            this.fireball_img.src = "https://cdn.acwing.com/media/article/image/2021/12/02/1_9340c86053-fireball.png";

            this.blink_coldtime = 5;
            this.blink_img = new Image();
            this.blink_img.src = "https://cdn.acwing.com/media/article/image/2021/12/02/1_daccabdc53-blink.png";
        }
    }

    start(){
        this.playground.player_count++;
        this.playground.notice_board.write("waiting for begin: " + this.playground.player_count + " players prepared");
        if(this.playground.player_count >= 2){
            this.playground.state = "fighting";
            this.playground.notice_board.write("Fighting");
        }


        if(this.character === "me"){
            this.add_listening_events();
        }else if(this.character === "robot"){
            let tx = Math.random() * this.playground.width / this.playground.scale;
            let ty = Math.random() * this.playground.height / this.playground.scale;
            this.move_to(tx, ty);
        }
    }
    // 监听鼠标（小球的移动）
    add_listening_events(){
        let outer = this;
        // 取消鼠标点击出现菜单
        this.playground.game_map.$canvas.on("contextmenu", function(){
            return false;
        });
        // 鼠标的事件
        this.playground.game_map.$canvas.mousedown(function(e){
            if(outer.playground.state !== "fighting")
                return true; // 不处理信息-- true；将这个监听阻断-- false
            const rect = outer.ctx.canvas.getBoundingClientRect();
            if(e.which === 3){ // 右键
                let tx = (e.clientX - rect.left) / outer.playground.scale;
                let ty = (e.clientY - rect.top) / outer.playground.scale;
                // 如果是多人模式则需要广播信息
                if(outer.playground.mode === "multi mode"){
                    outer.playground.mps.send_move_to(tx, ty);
                }

                outer.move_to(tx, ty);
            }else if(e.which === 1){ // 左键
                let tx = (e.clientX - rect.left) / outer.playground.scale;
                let ty = (e.clientY - rect.top) / outer.playground.scale;
                if(outer.cur_skill === "fireball"){
                    if(outer.fireball_coldtime > outer.eps)
                        return false;
                    let fireball = outer.shoot_fireball(tx, ty);
                    // 调用广播函数，通知其他终端
                    if(outer.playground.mode === "multi mode"){
                        outer.playground.mps.send_shoot_fireball(tx,ty,fireball.uuid);
                    }
                }else if(outer.cur_skill === "blink"){
                    if(outer.blink_coldtime > outer.eps)
                        return false;
                    outer.blink(tx, ty);
                    if(outer.playground.mode === "multi mode"){
                        outer.playground.mps.send_blink(tx,ty);
                    }
                }
                outer.cur_skill = null;
            }
        });
        // 键盘的事件
        this.playground.game_map.$canvas.keydown(function(e) {
            if(e.which === 13){ // 回车打开聊天框
                if (outer.playground.mode === "multi mode"){
                    outer.playground.chat_field.show_input();
                    return false;
                }
            }else if(e.which === 27){ // esc退出聊天框
                if(outer.playground.mode === "multi mode"){
                    outer.playground.chat_field.hide_input();
                    return false;
                }
            }
            if(outer.playground.state !== "fighting")
                return true;

            if(e.which === 81){ // keydown 81对应Q键
                if(outer.fireball_coldtime > outer.eps)
                    return true;
                outer.cur_skill = "fireball";
                return false;
            }else if(e.which === 70){
                if(outer.blink_coldtime > outer.eps)
                    return true;
                outer.cur_skill = "blink";
                return false;
            }
        })
    }

    shoot_fireball(tx, ty){
        let x= this.x, y = this.y;
        let radius = this.playground.height * 0.01 / this.playground.scale;
        let angle = Math.atan2(ty - this.y, tx - this.x);
        let vx = Math.cos(angle), vy = Math.sin(angle);
        let color = "orange";
        let speed = this.speed * 2;
        let move_length = this.playground.height * 1 / this.playground.scale;
        let fireball = new FireBall(this.playground, this, x, y, radius, vx, vy, color, speed, move_length, this.playground.height * 0.01 / this.playground.scale); // 每个玩家的半径是height * 0.05, 伤害是0.01--每次会打掉玩家20%的血量
        this.fireballs.push(fireball);

        // 每次放完技能后重置技能cd
        this.fireball_coldtime = 3;

        return fireball;
    }

    destory_fireball(uuid){
        for(let i = 0; i < this.fireballs.length; i++){
            let fireball = this.fireballs[i];
            if(fireball.uuid === uuid){
                fireball.destory();
                break;
            }
        }
    }

    blink(tx, ty){
        let d = this.get_dist(this.x, this.y, tx, ty);
        d = Math.min(d, 0.8);
        let angle = Math.atan2(ty - this.y, tx - this.x);
        this.x += d * Math.cos(angle);
        this.y += d * Math.sin(angle);

        this.blink_coldtime = 5;
        this.move_length = 0; //闪现结束后停止动作
    }

    // 获得2点之间的欧几里得距离
    get_dist(x1,y1, x2, y2){
        let dx = x1 - x2;
        let dy = y1 - y2;
        return Math.sqrt(dx * dx + dy * dy);
    }

    move_to(tx, ty){
        this.move_length = this.get_dist(this.x, this.y, tx, ty);
        let angle = Math.atan2(ty - this.y, tx - this.x);
        this.vx = Math.cos(angle);
        this.vy = Math.sin(angle);
    }

    is_attacked(angle, damage){
        // 被撞击时的火花粒子效果
        for(let i = 1; i < 10 + Math.random() * 5; i++){
            let x = this.x;
            let y = this.y;
            let radius = this.radius * Math.random() * 0.1;
            let angle = Math.PI * 3 * Math.random();
            let vx = Math.cos(angle), vy = Math.sin(angle);
            let color = this.color;
            let speed = this.speed * 11;
            new Particle(this.playground, x, y, radius, vx, vy, color, speed);
        }

        this.radius -= damage;
        if(this.radius < this.eps){ // 半径小于——玩家死亡
            this.destory();
            return false;
        }else{
            this.damage_x = Math.cos(angle);
            this.damage_y = Math.sin(angle);
            this.damage_speed = damage * 10; // 10是自己定的参数
        }

    }
    // 玩家接收到被攻击的信息
    receive_attack(x, y, angle, damage, ball_uuid, attacker){
        attacker.destory_fireball(ball_uuid);
        this.x = x;
        this.y = y;
        this.is_attacked(angle, damage);
    }

    update(){
        this.spent_time += this.timedelta / 1000;

        this.update_win();

        if(this.character === "me" && this.playground.state === "fighting"){
            this.update_coldtime();
        }
        this.update_move();
        this.render(); // 每一帧都要画一次玩家
    }

    update_coldtime(){
        this.fireball_coldtime -= this.timedelta / 1000;
        this.fireball_coldtime = Math.max(this.fireball_coldtime, 0);

        this.blink_coldtime -= this.timedelta / 1000;
        this.blink_coldtime = Math.max(this.blink_coldtime, 0);
    }

    update_win(){
        if(this.playground.state === "fighting" && this.character === "me" && this.playground.players.length === 1){
            this.playground.state = "over";
            this.playground.score_board.win();
        }
    }

    update_move(){ // 更新玩家移动
         if(this.character === "robot"){
             if(this.spent_time > 5 && Math.random() < 1 / 180.0){ //前5s不攻击 and 概率每3s发射一次
                 let player = this.playground.players[Math.floor(Math.random() * this.playground.players.length)];
                 let tx = player.x + player.speed * player.vx * player.timedelta / 1000 * 0.3; // 向目标0.3s后的位置开炮
                 let ty = player.y + player.speed * player.vy * player.timedelta / 1000 * 0.3;
                 this.shoot_fireball(tx, ty);
             }
         }

         if(this.damage_speed > this.eps){ // 玩家处于被攻击状态，无法操作
             this.vx = this.vy = 0;
             this.move_length = 0;
             this.x += this.damage_x * this.speed * this.timedelta / 1000; // 角度*速度*时间
             this.y += this.damage_y * this.speed * this.timedelta / 1000;
             this.damage_speed *= this.friction;
         }else{
             if(this.move_length < this.eps){
                 this.move_length = 0;
                 this.vx = this.vy = 0;
                 if(this.character === "robot"){ // AI敌人到达终点后需要再指定一个目标点
                     let tx = Math.random() * this.playground.width / this.playground.scale;
                     let ty = Math.random() * this.playground.height / this.playground.scale;
                     this.move_to(tx, ty);
                 }
             }else{
                 let moved = Math.min(this.move_length, this.speed * this.timedelta / 1000);
                 this.x += this.vx * moved; // 角度*距离 == x,y的移动距离
                 this.y += this.vy * moved;
                 this.move_length -= moved;
             }
         }

    }

    render(){
        let scale = this.playground.scale;
        // 用户画头像 —— 这里要将相对值变为绝对值！
        if(this.character !== "robot"){
            this.ctx.save();
            this.ctx.beginPath();
            this.ctx.arc(this.x * scale, this.y * scale, this.radius * scale, 0, Math.PI * 2, false);
            this.ctx.stroke();
            this.ctx.clip();
            this.ctx.drawImage(this.img, (this.x - this.radius) * scale, (this.y - this.radius) * scale, this.radius * 2 * scale, this.radius * 2 * scale); 
            this.ctx.restore();
        }else{
            this.ctx.beginPath();
            this.ctx.arc(this.x * scale, this.y * scale, this.radius * scale, 0, Math.PI*2, false);
            this.ctx.fillStyle = this.color;
            this.ctx.fill();
        }

        if(this.character === "me" && this.playground.state === "fighting"){
            this.render_skill_coldtime();
        }

    }

    render_skill_coldtime(){
        let scale = this.playground.scale;
        let x = 1.5, y = 0.9, r = 0.04;
        this.ctx.save();
        this.ctx.beginPath();
        this.ctx.arc(x * scale, y * scale,r * scale, 0, Math.PI * 2, false);
        this.ctx.stroke();
        this.ctx.clip();
        this.ctx.drawImage(this.fireball_img, (x -r) * scale, (y - r) * scale, r * 2 * scale, r * 2 * scale);
        this.ctx.restore();

        if(this.fireball_coldtime > 0){
            this.ctx.beginPath();
            // 画扇面
            this.ctx.moveTo(x * scale, y * scale);
            this.ctx.arc(x * scale, y * scale, r * scale, 0 - Math.PI / 2, Math.PI * 2 * (1 -this.fireball_coldtime / 3) - Math.PI / 2, true);
            this.ctx.lineTo(x * scale, y * scale);
            this.ctx.fillStyle = "rgba(0, 0, 255, 0.6)";
            this.ctx.fill();
        }

        // 闪现技能渲染
        x = 1.62, y = 0.9, r = 0.04;
        this.ctx.save();
        this.ctx.beginPath();
        this.ctx.arc(x * scale, y * scale,r * scale, 0, Math.PI * 2, false);
        this.ctx.stroke();
        this.ctx.clip();
        this.ctx.drawImage(this.blink_img, (x -r) * scale, (y - r) * scale, r * 2 * scale, r * 2 * scale);
        this.ctx.restore();

        if(this.blink_coldtime > 0){
            this.ctx.beginPath();
            // 画扇面
            this.ctx.moveTo(x * scale, y * scale);
            this.ctx.arc(x * scale, y * scale, r * scale, 0 - Math.PI / 2, Math.PI * 2 * (1 -this.blink_coldtime / 5) - Math.PI / 2, true);
            this.ctx.lineTo(x * scale, y * scale);
            this.ctx.fillStyle = "rgba(0, 0, 255, 0.6)";
            this.ctx.fill();
        }

    }

    on_destory(){ // 玩家死亡后将其移除
        if(this.character === "me"){
            if(this.playground.state === "fighting"){
                this.playground.state = "over";
                this.playground.score_board.fail();
            }
        }
        for(let i = 0; i < this.playground.players.length; i++){
            if(this.playground.players[i] === this){
                this.playground.players.splice(i,1);
                break;
            }
        }
    }
}
class ScoreBoard extends AcGameObject {
    constructor(playground){
        super();
        this.playground = playground;
        this.ctx = this.playground.game_map.ctx;

        this.state = null; // win/fail

        this.win_img = new Image();
        this.win_img.src = "https://cdn.acwing.com/media/article/image/2021/12/17/1_8f58341a5e-win.png";

        this.fail_img = new Image();
        this.fail_img.src = "https://cdn.acwing.com/media/article/image/2021/12/17/1_9254b5f95e-lose.png";
    }

    start(){
    }

    late_update(){
        this.render();
    }

    render(){
        let len = this.playground.height / 2;
        if(this.state === "win"){
            this.ctx.drawImage(this.win_img, this.playground.width / 2 - len / 2, this.playground.height / 2 - len / 2, len, len);
        }else if(this.state === "fail"){
            this.ctx.drawImage(this.fail_img, this.playground.width / 2 - len / 2, this.playground.height / 2 - len / 2, len, len);

        }
    }

    add_listening_events(){
        let outer = this;
        // 绑定到canvas上一定要绑定一个唯一的id,而window是公共对象
        let $canvas = this.playground.game_map.$canvas;

        $canvas.on(`click.${outer.uuid}`, function(){
            outer.playground.hide();
            outer.playground.root.menu.show();
        })
    }

    win(){
        this.state = "win";

        let outer = this;
        setTimeout(function(){
            outer.add_listening_events();
        },1000);
    }

    fail(){
        this.state = "fail";

        let outer = this;
        setTimeout(function(){
            outer.add_listening_events();
        },1000);
    }
}
class FireBall extends AcGameObject{
    constructor(playground, player, x, y, radius, vx, vy, color, speed, move_length, damage){
        super();

        this.playground = playground;
        this.player = player;
        this.ctx = this.playground.game_map.ctx;
        this.x = x;
        this.y = y;
        this.vx = vx; // 火球行进的方向是固定的
        this.vy = vy;
        this.radius = radius;
        this.color = color;
        this.speed = speed;
        this.move_length = move_length; //射程
        this.damage = damage; // 火球的伤害值
        this.eps = 0.01;

    }

    start(){
    }

    update(){
        if(this.move_length < this.eps){
            this.destory();
            return false;
        }
        this.update_move();
        if(this.player.character !== "enemy"){
            this.update_attack();
        }

        this.render();
    }

    update_move(){
         let moved = Math.min(this.move_length, this.speed * this.timedelta / 1000);
         this.x += this.vx * moved;
         this.y += this.vy * moved;
         this.move_length -= moved;

    }

    update_attack(){
        for(let i=0; i<this.playground.players.length; i++){
             let player = this.playground.players[i];
             if(this.player !== player && this.is_collision(player)){
                 this.attack(player);
                 break;
             }
        }
    }

    get_dist(x1, y1, x2, y2){
        let dx = x1 - x2;
        let dy = y1 - y2;
        return Math.sqrt(dx * dx + dy * dy);
    }
    // 判断火球与玩家是否碰撞（两球体中心的距离是否小于两球体半径之和）
    is_collision(player){
        let distance = this.get_dist(this.x, this.y, player.x, player.y);
        if(distance < this.radius + player.radius)
            return true;
        return false;
    }

    attack(player){
        this.destory(); // 火球消失
        let angle = Math.atan2(player.y - this.y, player.x - this.x);
        player.is_attacked(angle, this.damage); //玩家被攻击，传入攻击来的方向（被击飞）和伤害值
        if(this.playground.mode === "multi mode"){ // 在多人模式下被攻击才需要广播信息
            this.playground.mps.send_attack(player.uuid, player.x, player.y, angle, this.damage, this.uuid);
        }
    }

    render(){
        let scale = this.playground.scale;
        this.ctx.beginPath();
        this.ctx.arc(this.x * scale, this.y * scale,  this.radius * scale, 0, Math.PI*2, false);
        this.ctx.fillStyle = this.color;
        this.ctx.fill();
    }

    // 在火球销毁前将其从player存储的火球数组中删除
    on_destory(){
        let fireballs = this.player.fireballs;
        for(let i = 0; i < fireballs.length; i++){
            if(fireballs[i] === this){
                fireballs.splice(i,1);
                break;
            }
        }
    }
}
class MultiPlayerSocket{
    constructor(playground){
        this.playground = playground;

        // 建立连接 ws—http, wss—https
        this.ws = new WebSocket("ws://121.5.68.237:8000/ws/multiplayer/?token=" + playground.root.access);

        this.start();
    }

    start(){
        this.receive();
    }

    receive(){ // 接受从后端发来的信息
        let outer = this;
        this.ws.onmessage = function(e){
            let data = JSON.parse(e.data) // 将Json转换为字符串格式
            let uuid = data.uuid
            // 收到的信息是自己发的
            if(uuid === outer.uuid)
                return false;

            let event = data.event;
            if(event === "create_player"){
                outer.receive_create_player(uuid, data.username, data.photo);
            }else if(event === "move_to"){
                outer.receive_move_to(uuid, data.tx, data.ty);
            }else if(event === "shoot_fireball"){
                outer.receive_shoot_fireball(uuid, data.tx, data.ty, data.ball_uuid);
            }else if(event === "attack"){
                outer.receive_attack(uuid, data.attackee_uuid, data.x, data.y, data.angle, data.damage, data.ball_uuid);
            }else if(event === "blink"){
                outer.receive_blink(uuid, data.tx, data.ty);
            }else if(event === "message"){
                outer.receive_message(uuid, data.username, data.text);
            }
        }
    }

    // 实现创建玩家同步
    // 向服务器端发送信息
    send_create_player(username, photo){
        let outer = this;
        this.ws.send(JSON.stringify({
            'event': "create_player",
            'uuid': outer.uuid,
            "username": username,
            "photo": photo,
        }))
    }

    receive_create_player(uuid, username, photo){
        let player = new Player(this.playground, this.playground.width / 2 / this.playground.scale, this.playground.height / 2 / this.playground.scale,  this.playground.height * 0.05 / this.playground.scale, "white", this.playground.height * 0.15 / this.playground.scale, "enemy", username, photo);
        player.uuid = uuid; // 每一个player的id以创建他的server生成的id为准
        this.playground.players.push(player);
    }

    // 实现玩家的移动同步
    send_move_to(tx, ty){
        let outer = this;
        this.ws.send(JSON.stringify({
            'event': 'move_to',
            'uuid': outer.uuid, // 发出这个动作的人
            'tx': tx,
            'ty': ty,
        }));

    }

    get_player(uuid){
        let players = this.playground.players;
        for(let i=0; i < players.length; i++){
            let player = players[i];
            if(player.uuid === uuid)
                return player;
        }
        return null;
    }

    receive_move_to(uuid, tx, ty){
        let player = this.get_player(uuid);
        if (player){
            player.move_to(tx, ty);
        }
    }

    // 实现火球发射的同步
    send_shoot_fireball(tx, ty, ball_uuid){
        let outer = this;
        this.ws.send(JSON.stringify({
            "event": "shoot_fireball",
            "uuid": outer.uuid, //发出火球的人
            "tx": tx,
            "ty": ty,
            "ball_uuid": ball_uuid,
        }))
    }

    receive_shoot_fireball(uuid, tx, ty, ball_uuid){
        let player = this.get_player(uuid);
        if (player){
            let fireball = player.shoot_fireball(tx, ty);
            fireball.uuid = ball_uuid; // 将所有窗口的同一个火球的id进行统一
        }
    }

    // 同步攻击：以发出攻击并击中的终端为准，将其余终端上的被攻击玩家信息与该终端同步
    send_attack(attackee_uuid, x, y, angle, damage, ball_uuid){
        let outer = this;
        this.ws.send(JSON.stringify({
            'event': "attack",
            'uuid': outer.uuid,
            'attackee_uuid': attackee_uuid,
            'x': x,
            'y': y,
            'angle': angle,
            'damage': damage,
            'ball_uuid': ball_uuid,
        }));
    }

    receive_attack(uuid, attackee_uuid, x, y, angle, damage, ball_uuid){
        let attacker = this.get_player(uuid);
        let attackee = this.get_player(attackee_uuid);
        if(attacker && attackee){
            attackee.receive_attack(x, y, angle, damage, ball_uuid, attacker);
        }
    }

    // 同步闪现
    send_blink(tx, ty){
        let outer = this;
        this.ws.send(JSON.stringify({
            'event': "blink",
            'uuid': outer.uuid,
            'tx': tx,
            'ty': ty,
        }));
    }

    receive_blink(uuid, tx, ty){
        let player = this.get_player(uuid);
        if(player)
            player.blink(tx, ty);
    }

    // 同步聊天信息
    send_message(username, text){
        let outer = this;
        this.ws.send(JSON.stringify({
            'event': "message",
            "uuid": outer.uuid,
            "username": username,
            "text": text,
        }));
    }

    receive_message(uuid, username, text){
        this.playground.chat_field.add_message(username, text);
    }
}
class AcGamePlayground {
    constructor(root){
        this.root = root;
        this.$playground = $(`
            <div class="ac-game-playground"></div>
        `);
        this.hide();
        this.root.$ac_game.append(this.$playground);

        this.start();
    }

    get_random_color(){
        let colors = ["blue", "red", "pink", "green", "grey"];
        return colors[Math.floor(Math.random() * 5)];
    }

    start(){
        let outer = this;
        $(window).resize(function(){
            outer.resize();
        });
    }

    // 联机对战时统一长宽
    resize(){
        this.width = this.$playground.width();
        this.height = this.$playground.height();
        let unit = Math.min(this.width / 16, this.height / 9); // 16:9的长宽比例
        this.width = unit * 16;
        this.height = unit * 9;
        this.scale = this.height;

        if(this.game_map)
            this.game_map.resize();
    }

    update(){
    }

    show(mode){
        let outer = this;

        this.width = this.$playground.width();
        this.height = this.$playground.height();

        this.game_map = new GameMap(this);
        this.mode = mode; // 记录下模式，在player中调用
        this.state = "waiting"; // 玩家进入游戏后处于waiting状态，无法移动，房间人满后进入fighting状态，死亡后进入over状态，此时无法再发射炮弹

        this.notice_board = new NoticeBoard(this);
        this.score_board = new ScoreBoard(this);
        this.player_count = 0;

        this.resize(); // resize的位置非常重要，在gamemap后resize game_map，在players前使player渲染头像时，this.scale已经被赋值了
        this.players = [];
        // 初始化时需要/this.scale
        this.players.push(new Player(this, this.width/2/this.scale, this.height/2/this.scale, this.height * 0.05 / this.scale, "white", this.height * 0.15 / this.scale, "me", this.root.settings.username, this.root.settings.photo));

        if(mode === "single mode"){
        // 敌人
            for(let i=0; i<5;i++){
                this.players.push(new Player(this, this.width/2/this.scale, this.height/2/this.scale, this.height * 0.05/this.scale, this.get_random_color(), this.height * 0.15/this.scale, "robot"));
            }
        }else if(mode === "multi mode"){
            this.chat_field = new ChatField(this);
            this.mps = new MultiPlayerSocket(this);
            this.mps.uuid = this.players[0].uuid; // 玩家自身一定是第一个被加到players数组中的

            // 连接建立后向后端发送消息（uuid以创建该玩家的后端生成的uuid为准）
            this.mps.ws.onopen = function(){
                outer.mps.send_create_player(outer.root.settings.username, outer.root.settings.photo);
            }
        }

        this.$playground.show();
    }

    hide(){
        // 要将游戏界面的元素全部清除，以免下一次show时还带着上一次的元素
        while(this.players && this.players.length > 0){
            this.players[0].destory();
        }
        if(this.game_map){
            this.game_map.destory();
            this.game_map = null;
        }
        if(this.notice_board){
            this.notice_board.destory();
            this.notice_board = null;
        }
        if(this.score_board){
            this.score_board.destory();
            this.score_board = null;
        }
        // 清空html
        this.$playground.empty();

        this.$playground.hide();
    }
}
class Settings{
    constructor(root){
        this.root = root;
        this.platform = "WEB";
        // 一个后端对应不同的前端平台
        //if(this.root.CloudOs)
        //this.platform = "ACAPP";
        this.username="";
        this.photo="";

        this.$settings = $(`
        <div class="ac-game-settings">
            <div class="ac-game-settings-login">
                <div class="ac-game-settings-title">
                    Login
                </div>
                <div class="ac-game-settings-username">
                    <div class="ac-game-settings-item">
                        <input type="text" placeholder="username">
                    </div>
                </div>
                <div class="ac-game-settings-password">
                    <div class="ac-game-settings-item">
                        <input type="password" placeholder="password">
                    </div>
                </div>
                <div class="ac-game-settings-submit">
                    <div class="ac-game-settings-item">
                        <button>Login</button>
                    </div>
                </div>
                <div class="ac-game-settings-error-message">
                </div>
                <div class="ac-game-settings-option">
                    Register
                </div>
                <!-- 前两行是inline格式，会影响到后面的格式，所以加一个回车 -->
                <br>
                <div class="ac-game-settings-github">
                    <img width="30" src="http://121.5.68.237:8000/static/image/settings/github.jpeg">
                </div>
                <div class="ac-game-settings-github-hint">
                    using your github account to login
                </div>
            </div>
            <div class="ac-game-settings-register">
                <div class="ac-game-settings-title">
                      Register
                </div>
                <div class="ac-game-settings-username">
                    <div class="ac-game-settings-item">
                        <input type="text" placeholder="username">
                    </div>
                </div>
                <div class="ac-game-settings-password ac-game-settings-password-first">
                    <div class="ac-game-settings-item">
                        <input type="password" placeholder="password">
                    </div>
                </div>
                <div class="ac-game-settings-password ac-game-settings-password-second">
                    <div class="ac-game-settings-item">
                         <input type="password" placeholder="confirmed-password">
                    </div>
                </div>
                <div class="ac-game-settings-submit">
                    <div class="ac-game-settings-item">
                        <button>Register</button>
                    </div>
                </div>
                <div class="ac-game-settings-error-message">
                </div>
                <div class="ac-game-settings-option">
                    Login
                </div>
                <br>
                <div class="ac-game-settings-github">
                    <img width="30" src="http://121.5.68.237:8000/static/image/settings/github.jpeg">
                </div>
                <div class="ac-game-settings-github-hint">
                    using your github account to login
                </div>
            </div>
        </div>
        `);

        this.$login = this.$settings.find(".ac-game-settings-login");
        this.$login_username = this.$login.find(".ac-game-settings-username input"); // 相邻的父子标签才能用>连接
        this.$login_password = this.$login.find(".ac-game-settings-password input");
        this.$login_submit = this.$login.find(".ac-game-settings-submit button");
        this.$login_error_message = this.$login.find(".ac-game-settings-error-message");
        this.$login_register = this.$login.find(".ac-game-settings-option");
        this.$login.hide();

        this.$register = this.$settings.find(".ac-game-settings-register");
        this.$register.hide();
        this.$register_username = this.$register.find(".ac-game-settings-username input");
        this.$register_password = this.$register.find(".ac-game-settings-password-first input");
        this.$register_password_confirm = this.$register.find(".ac-game-settings-password-second input");
        this.$register_submit = this.$register.find(".ac-game-settings-submit button");
        this.$register_error_message = this.$register.find(".ac-game-settings-error-message");
        this.$register_login = this.$register.find(".ac-game-settings-option");

        this.$github_login = this.$settings.find(".ac-game-settings-github img");

        this.root.$ac_game.append(this.$settings);

        this.start();
    }
    start(){
        if (this.root.access){ // 有access  token信则直接获取用户信息
            this.getinfo();
            this.refresh_jwt_token();
        }else{
            this.login();
        }
        this.add_listening_events();
    }


    // 刷新access token
    refresh_jwt_token(){
        setInterval(() => {
            $.ajax({
                url:"http://121.5.68.237:8000/settings/token/refresh/",
                type: "POST",
                data: {
                    refresh: this.root.refresh,
                },
                success: resp => {
                    this.root.access = resp.access;
                }
            });
        }, 4.5 * 60 * 1000);
    }

    add_listening_events(){
        this.add_listening_events_login();
        this.add_listening_events_register();

        let outer = this;
        this.$github_login.click(function(){
            outer.github_login();
        });
    }

    add_listening_events_login(){ // 登录界面的监听函数
        let outer = this;

        this.$login_register.click(function(){
            outer.register();
        });

        this.$login_submit.click(function(){
            outer.login_on_remote();
        });
    }

    add_listening_events_register(){ // 注册页面的监听函数
        let outer = this;

        this.$register_login.click(function(){
            outer.login();
        });

        this.$register_submit.click(function(){
            outer.register_on_remote();
        });
    }

    github_login(){
        $.ajax({
            url: "http://121.5.68.237:8000/settings/github/web/apply_code/",
            type: "GET",
            success:function(resp){
                if(resp.result === "success"){
                    window.location.replace(resp.apply_code_url);
                }
            }
        })
    }

    login_on_remote(username, password){ // 登录操作
        username = username || this.$login_username.val();
        password = password || this.$login_password.val();
        this.$login_error_message.empty();
        let outer = this;
        $.ajax({
            url: "http://121.5.68.237:8000/settings/token/",
            type: "POST",
            data: {
                username: username,
                password: password,
            },
            success: function(resp){
                outer.root.access = resp.access;
                outer.root.refresh = resp.refresh;
                outer.refresh_jwt_token();
                outer.getinfo();
            },
            error: function(){
                 outer.$login_error_message.html("Username or Password is wrong");
            }
        });
    }

    register_on_remote(){
        let username = this.$register_username.val();
        let password = this.$register_password.val();
        let password_confirm = this.$register_password_confirm.val();
        this.$register_error_message.empty();
        let outer = this;
        $.ajax({
            url: "http://121.5.68.237:8000/settings/register/",
            type: "POST",
            data: {
                username: username,
                password: password,
                password_confirm: password_confirm
            },
            success: function(resp){
                if(resp.result === "success"){
                    outer.login_on_remote(username, password);
                }else{
                    outer.$register_error_message.html(resp.result);
                }
            }
        })

    }

    logout_on_remote(){
        if(this.platform === "WEB"){
            this.root.access = "";
            this.root.refresh = "";
            location.href = "/";
        }
    }

    register(){ // 打开注册页面
        this.$login.hide();
        this.$register.show();
    }

    login(){ // 打开登录页面
        this.$register.hide();
        this.$login.show();
    }

    getinfo(){
        let outer = this;

        $.ajax({
            url: "http://121.5.68.237:8000/settings/getinfo/",
            type: "GET",
            data:{
                platform: outer.platform,
            },
            // 将验证信息放在headers中
            headers:{
                'Authorization': "Bearer " + this.root.access,
            },
            success: function(resp){
                if(resp.result === "success"){
                    console.log(resp);
                    outer.username = resp.username;
                    outer.photo = resp.photo;
                    outer.root.playground = new AcGamePlayground(outer.root);
                    outer.hide(); // 隐藏当前页面
                    outer.root.menu.show(); // 展示菜单页面
                }else{
                    outer.login(); //未登录默认打开登录页面
                }
            }
        })
    }

    hide(){
        this.$settings.hide();
    }

    show(){
        this.$settings.show();
    }
}
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
