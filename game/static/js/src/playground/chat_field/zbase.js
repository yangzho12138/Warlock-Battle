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
