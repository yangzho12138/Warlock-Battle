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
