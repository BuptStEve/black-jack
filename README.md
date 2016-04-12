# JS实现“21点”扑克牌小游戏
## 零、项目需求
* 基本要求：可双人对战，判断输赢。扑克牌为一副（4种花色），扑克牌素材可自己绘制也可网上下载。
* 加分项：界面好看，在手机上可以玩，能双人/多人联机玩。

## 一、需求分析
1. 可双人对战：我的想法是肯定需要服务器，两人通过服务器进行通信。
2. 判断输赢：由于是回合制游戏，只要根据状态机的状态迁移，判断双方的点数即可。
3. 界面好看：采用贴图或 canvas 进行绘制，添加“炫酷”的 css3 动画。
4. 在手机上可以玩：移动端适配，涉及到响应式的屏幕适配，以及 touch 事件等。
5. 能双人/多人联机玩：涉及到多用户时的输赢判断，状态机的迁移等问题。

## 二、项目架构
1. 后端基于 express 采用 Node.js 进行开发，在后端进行数据的生成，输赢判断等逻辑。
2. 由于多人对战时有服务器端推送数据的场景，而如果基于 ajax 进行实现（短轮询或 Comet）不够优雅。所以前后端先基于 socket.io 采用 websocket 进行交互。
3. 有时间可能会不采用 socket.io 而直接使用原生 api，如果还有时间则用 Comet 实现。

ps 如果用 Meteor.js 真的是超级快。

## 三、多人对战
### 3.1. 思路分析
* 如果是一个“正常”的项目，涉及到多人对战、交流等，肯定需要一个用户系统。
* 然而这里的需求是一个最小化的，可双（多）人对战的系统，所以打算采用「房间」的机制实现。

### 3.2. 具体过程
#### 1. 打开首页，可以一个新房间或加入一个已有的房间
* 房间之间通过一个4位字符组成的 id 进行区分。
* 创建一个新房间后，可以通过访问 http://domain/room/:id ，或者在首页输入 id 进入已有的房间。
* 当房间没人时销毁房间。
* 暂时只支持双人对战。
* 暂不支持「观战」功能。

#### 2. 进入房间
* 第一个进入房间的玩家首先成为庄家
* 第二个进入房间的玩家首先成为闲家
* 每局之后双方角色互换，直到一方没钱

## 四、项目进展规划（Roadmap）
* v0.1.0：完成数据结构和基本逻辑的编写。
* v0.2.0：完成前后端 api 的编写。
* v0.3.0：完成前端交互逻辑。
* v0.4.0：完成前端基本界面，使得单人能够与服务器对战。
* v0.5.0：完成进阶版规则（bet/insurance/double/surrender...）的编写。
* v0.6.0：完成双人登录时，处理逻辑的编写。
* v0.7.0：完成双人对战的逻辑编写。
* v1.0.0：完成界面的美化。（完成基本目标）

