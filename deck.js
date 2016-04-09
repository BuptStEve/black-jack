/*
* @Author: BuptStEve
* @Date:   2016-04-09 10:13:22
* @Last Modified by:   BuptStEve
* @Last Modified time: 2016-04-09 23:27:48
*/

'use strict';

/**
 * 参考资料：
 * 1. http://baike.so.com/doc/5329886-5565060.html#5329886-5565060-2
 * 2. http://www.baike.com/wiki/21点游戏规则
 *
 * 最简单版本规则：
 *   0. 暂时一个玩家，庄家是 AI
 *   1. 各发两张牌，庄家第一张不显示
 *   2. 计算点数，如果闲家为 BlackJack 直接获胜
 *   3. 否则闲家可以选择 stand/hit
 *   4. stand：不要牌了
 *     4.1. 若庄家点数不小于17点，则直接对比
 *     4.2. 否则继续加牌，直到不小于17点
 *     4.3. 最后庄家 bust 或进行比较。
 *   5. hit：加一张牌
 *     5.1. 计算该闲家点数，若没 bust 则转3可以选择 stand/hit
 *
 *   注：花色(1：黑桃，2：红桃，3：梅花，4：方块，顺序参考自 wiki)
 *      this.result：
 *        -3：闲家 bust
 *        -2：平局
 *        -1：庄家胜
 *        0：胜负未分
 *        1：闲家胜
 *        2：庄家 bust
 *      this.data 分两种情况：
 *        * 胜负未分：不含庄家第一张牌和庄家点数
 *        * 胜负已分：含庄家第一张牌和庄家点数
 */

/**
 * @desc 游戏
 * @author BuptStEve
 * @param  {Number} userNum 玩家数量
 */
function Deck(userNum) {
  this.deck     = []; // 一副牌

  this.dlrCards = []; // 庄家手牌
  this.dlrPoint = 0;  // 庄家的总分

  this.usrCards = []; // 闲家手牌
  this.usrPoint = 0;  // 闲家的总分
  this.canHit   = false;
  this.canStand = false;
  this.canDeal  = true;
  this.result   = 0;
  this.data;          // 向客户端传递的信息

  // 定义方法
  if (typeof this.deal != "function") {
    /**
     * @desc 开始发牌：1.分别给庄家和玩家发牌 2.判断局势
     * @author BuptStEve
     * @return {Number} 1：游戏已开始，无法发牌
     */
    Deck.prototype.deal = function() {
      if (!this.canDeal) { return 1; }

      // 初始化
      this.dlrCards = []; // 庄家手牌
      this.dlrPoint = 0;  // 庄家的总分
      this.usrCards = []; // 闲家手牌
      this.usrPoint = 0;  // 闲家的总分
      this.canHit   = false;
      this.canStand = false;
      this.canDeal  = false;
      this.result   = 0;

      // 给庄家发牌
      this.dlrCards.push(this._draw());
      this.dlrCards.push(this._draw());
      this.dlrPoint = this._calcPoint(this.dlrCards);

      /* test */
      console.log('庄家手牌：' + this.dlrCards[0].suit + ' ' + this.dlrCards[1].suit);
      console.log('庄家点数：' + this.dlrCards[0].value + ' ' + this.dlrCards[1].value);

      // 给玩家发牌
      this.usrCards.push(this._draw());
      this.usrCards.push(this._draw());
      this.usrPoint = this._calcPoint(this.usrCards);

      /* test */
      console.log('闲家手牌：' + this.usrCards[0].suit + ' ' + this.usrCards[1].suit);
      console.log('闲家点数：' + this.usrCards[0].value + ' ' + this.usrCards[1].value);

      this._changeState(); // 状态迁移

      return this;
    };

    /**
     * @desc 玩家选择再加一张牌
     * @author BuptStEve
     * @return {Number} 1：当前无法 hit
     */
    Deck.prototype.hit = function() {
      // 当前无法 hit(已经赢了或输了)
      if (!this.canHit) { return 1; }

      this.usrCards.push(this._draw());
      this.usrPoint = this._calcPoint(this.usrCards);

      /* test */
      console.log('闲家点数：' + this.usrPoint);

      this._changeState();
    };

    /**
     * @desc 玩家选择不加牌，庄家开始加牌计算
     * @author BuptStEve
     * @return {Number} 1：当前无法 stand
     */
    Deck.prototype.stand = function() {
      // 当前无法 stand(已经赢了或输了)
      if (!this.canStand) { return 1; }

      this.canHit   = false;
      this.canStand = false;

      var tmp = this._addCard();
      if (tmp === -1) {
        console.log('闲家胜！');
        this.result = 2;
      } else {
        if (tmp < this.usrPoint) {
          console.log(tmp + ' 闲家胜！');
          this.result = 1;
        } else if (tmp > this.usrPoint) {
          console.log(tmp + ' 庄家胜！');
          this.result = -1;
        } else {
          console.log('平局！');
          this.result = -2;
        }
      }
      this.canDeal = true;
      this.data = {
        dc    : this.dlrCards,
        dp    : this.dlrPoint,
        uc    : this.usrCards,
        up    : this.usrPoint,
        hit   : this.canHit,
        stand : this.canStand,
        deal  : this.canDeal,
        result: this.result
      };
    };

    /**
     * @desc 初始化并两层循环生成一副牌并打乱这副牌
     * @author BuptStEve
     */
    Deck.prototype._newDeck = function() {
      var i, j; // 循环下标，分别表示花色和点数

      for (i = 1; i <= 4; i += 1) {
        for (j = 1; j <= 13; j += 1) {
          this.deck.push({
            suit : i, // 花色
            value: j  // 值
          });
        }
      }

      // 随机洗牌
      this.deck.sort(function() { return 0.5 - Math.random(); });

      return this;
    };

    /**
     * @desc 根据当前分数，进行状态迁移
     * @author BuptStEve
     */
    Deck.prototype._changeState = function() {
      var tmp;

      if (this.usrPoint === 21) {
        // 拿到21点
        this.canHit   = false;
        this.canStand = false;
        this.result = 1; // 暂时选择闲家胜
      } else if (this.usrPoint > 21) {
        // bust 庄家胜
        this.canHit   = false;
        this.canStand = false;
        this.result = -3; // 庄家胜
      } else {
        // 未分胜负
        this.canHit   = true;
        this.canStand = true;
      }

      switch (this.result) {
        case -3:
          console.log('庄家胜!');
          this.canDeal = true;
          this.result = -3;
          this.data = {
            dc    : this.dlrCards,
            dp    : this.dlrPoint,
            uc    : this.usrCards,
            up    : this.usrPoint,
            hit   : this.canHit,
            stand : this.canStand,
            deal  : this.canDeal,
            result: this.result
          };
          break;
        case 0:
          // 等待闲家进一步操作
          this.data = {
            dc   : this.dlrCards.slice(1),
            uc   : this.usrCards,
            up   : this.usrPoint,
            hit  : this.canHit,
            stand: this.canStand,
            deal : this.canDeal,
            result: this.result
          };
          break;
        case 1:
          if (this.usrCards.length === 2) {
            // 第一轮拿到 BlackJack
            console.log('闲家胜!');
            this.result = 1;
          } else if (this.dlrPoint === 21) {
            // 闲家凑齐21点，庄家为 BlackJack
            console.log('庄家胜!');
            this.result = -1;
          } else {
            tmp = this._addCard();
            // 进行庄家加牌操作
            if (tmp === 21) {
              // 庄家加牌后也为21点，平局
              console.log('平局!');
              this.result = -2;
            } else if (tmp === -1) {
              console.log('闲家胜!');
              this.result = 2;
            } else {
              console.log('闲家胜!');
              this.result = 1;
            }
          }
          this.canDeal = true;
          this.data = {
            dc    : this.dlrCards,
            dp    : this.dlrPoint,
            uc    : this.usrCards,
            up    : this.usrPoint,
            hit   : this.canHit,
            stand : this.canStand,
            deal  : this.canDeal,
            result: this.result
          };
          break;
        default:
          console.log('error!');
          break;
      }
    };

    /**
     * @desc 判断庄家分数状态
     * @author BuptStEve
     * @return {Number} -1：庄家 bust | 0：小于17 | 庄家点数
     */
    Deck.prototype._judgePoint = function() {
      if (this.dlrPoint > 21) {
        return -1;
      } else if (this.dlrPoint < 17) {
        return 0;
      } else {
        return this.dlrPoint;
      }
    };

    /**
     * @desc 庄家加牌环节
     * @author BuptStEve
     * @return {Number} -1：庄家 bust，或17到21的点数
     */
    Deck.prototype._addCard = function() {
      // 当庄家点数不足17点或不超过21点时，不断加牌
      while (this._judgePoint() === 0) {
        this.dlrCards.push(this._draw());
        this.dlrPoint = this._calcPoint(this.dlrCards);

        /* test */
        console.log('庄家点数：' + this.dlrPoint);
      }

      return this._judgePoint();
    };

    /**
     * @desc 计算分数，由于1有两种计算方法，所以需要从大牌开始算
     * @author BuptStEve
     * @param  {Array}  cards  庄家或玩家的手牌
     * @return {Number} tmpVal 计算的点数
     */
    Deck.prototype._calcPoint = function(cards) {
      var tmpVal = 0,
          tmpCards = cards.slice().sort(function(a, b) { return b - a; }),
          i, len, tmpCard;

      for (i = 0, len = tmpCards.length; i < len; i += 1) {
        tmpCard = tmpCards[i];

        if (tmpCard.value >= 10) {
          // 超过十的牌按照10点计算
          tmpCard.value = 10;
        } else if (tmpCard.value === 1 && tmpVal <= 10){
          // 当前为 Ace 并且当前点数未超过10点，按照11点算
          tmpCard.value = 11;
        }

        tmpVal += tmpCard.value;
      }

      return tmpVal;
    };

    /**
     * @desc 从牌堆中摸一张牌
     * @author BuptStEve
     * @return {Object} this.deck.pop() 一张牌
     */
    Deck.prototype._draw = function(cards) {
      // 已没有牌了，重新生成一副牌
      if (!this.deck.length) { this._newDeck(); }

      return this.deck.pop();
    };
  }
}

module.exports = Deck;
