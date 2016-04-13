/*
* @Author: BuptStEve
* @Date:   2016-04-09 10:13:22
* @Last Modified by:   BuptStEve
* @Last Modified time: 2016-04-13 21:14:48
*/

'use strict';

/**
 * 参考资料：看来看去都没有统一的规则...能不能靠谱点儿..._(:зゝ∠)_
 * 1. http://baike.so.com/doc/5329886-5565060.html#5329886-5565060-2
 * 2. https://zh.wikipedia.org/wiki/廿一點
 * 3. http://www.baike.com/wiki/21点游戏规则
 *
 * 双人版本规则：
 *   0. 第一个点 deal 的作为闲家，另一个为庄家，本金暂定 100
 *   1. 首先闲家开始下注（bet 默认 10），点击 deal 按钮扣掉赌注后开始游戏
 *   2. 给每人各发两张牌，庄家第一张不显示
 *   3. 计算点数，如果闲家为 BlackJack 直接获胜 bet*2.5
 *   4. 否则若庄家明牌为 Ace 那么闲家买保险的选择(insurance = bet*0.5)
 *     4.1. 若庄家为 BlackJack，闲家输掉赌注赢回2倍保险，相当于平局
 *     4.2. 若庄家非 BlackJack，则输掉保险
 *   5. 若闲家不买保险，或庄家明牌非 Ace 时可以选择 hit/stand/double/surrender
 *     5.1. hit：加一张牌后计算该闲家点数，若没 bust 则转5可以选择 hit/stand/double/surrender
 *     5.2. stand：不要牌了
 *       5.2.1. 若庄家点数不小于17点，则直接对比
 *       5.2.2. 否则庄家继续加牌，直到不小于17点
 *       5.2.3. 最后庄家 bust 或不小于17点进行比较。
 *     5.3. double：双倍赌注 bet*2，加一张牌后进行对比
 *     5.4. surrender：投降，输掉赌注
 *
 *   注：* 花色(1：黑桃，2：红桃，3：梅花，4：方块，顺序参考自 wiki)
 *      * this.result：
 *        -6: 闲家 double 失败
 *        -5：闲家投降
 *        -4：闲家买保险失败
 *        -3：闲家 bust
 *        -2：平局
 *        -1：庄家胜
 *        0：胜负未分
 *        1：闲家胜
 *        2：庄家 bust
 *        3：闲家 blackjack
 *        4: 闲家买保险成功
 *        5: 闲家 double 成功
 */

/**
 * @desc 游戏
 * @author BuptStEve
 */
function Deck() {
  var i, j, // 循环下标，分别表示花色和点数
      SUITS = ['♠', '♥', '♣', '◆'];

  // 1. 属性定义
  this.deck         = [];  // 一副牌
  this.dealer       = 0;   // 当前哪个玩家为庄家
  this.dlrCards     = [];  // 庄家手牌
  this.dlrPoint     = 0;   // 庄家的点数

  this.plrCards     = [];  // 闲家手牌
  this.plrPoint     = 0;   // 闲家的点数
  this.plrBet       = 10;  // 闲家赌注，默认10
  this.plrInsurance = 0;   // 闲家保险

  this.plrMoney     = [100, 100];  // 用户的金钱
  this.btns = {
    hit      : false,      // 当前可以 hit
    deal     : true,      // 当前可以 deal
    stand    : false,      // 当前可以 stand
    double   : false,      // 当前可以 double
    surrender: false,      // 当前可以 surrender
    insurance: false       // 当前可以 insurance
  };
  this.result = 0;         // 当前游戏状态
  this.dlrData;            // 向庄家传递的信息
  this.plrData = {         // 向闲家传递的信息
    dc  : [],
    pc  : [],
    pp  : this.plrPoint,
    bet : this.plrBet,
    btns: {
      hit      : false,
      deal     : false,
      stand    : false,
      double   : false,
      surrender: false,
      insurance: false
    },
    dm  : this.plrMoney[this.dealer],
    pm  : this.plrMoney[+!this.dealer],
    re  : -2,
    rt  : '等待另一位玩家进入房间'
  };

  // 2. 初始化一副牌
  for (i = 0; i < 4; i += 1) {
    for (j = 1; j <= 13; j += 1) {
      this.deck.push({ suit : SUITS[i], rank: j });
    }
  }

  // 3. 随机洗牌
  this.deck.sort(function() { return 0.5 - Math.random(); });

  // 4. 方法定义
  if (typeof this.init != "function") {
    /**
     * @desc 初始化
     * @author BuptStEve
     */
    Deck.prototype.init = function() {
      this.plrData = {
        dc  : [],
        pc  : [],
        pp  : this.plrPoint,
        bet : this.plrBet,
        btns: this.btns,
        dm  : this.plrMoney[this.dealer],
        pm  : this.plrMoney[+!this.dealer],
        re  : this.result,
        rt  : ''
      };
      this.dlrData = {
        btns: {
          hit      : false,
          deal     : false,
          stand    : false,
          double   : false,
          surrender: false,
          insurance: false
        }
      };

      return this;
    };

    /**
     * @desc 开始发牌：1.分别给庄家和闲家发牌 2.判断局势
     * @author BuptStEve
     * @param  {Number} bet 闲家的赌注
     * @param  {Number} num 闲家下标
     * @return {Number} 1：游戏已开始，无法发牌
     */
    Deck.prototype.deal = function(bet, num) {
      if (!this.btns.deal) { return 0; }

      bet = parseInt(bet, 10);

      // 初始化
      this.dlrCards        = [];    // 庄家手牌
      this.dlrPoint        = 0;     // 庄家的点数
      this.plrCards        = [];    // 闲家手牌
      this.plrPoint        = 0;     // 闲家的点数
      this.plrBet          = bet;   // 闲家的赌注
      this.dealer          = +!num; // 庄家下标
      this.plrMoney[num]   -= bet;  // 闲家的金钱
      this.plrMoney[+!num] += bet;  // 庄家的金钱
      this.plrInsurance    = 0;     // 闲家的保险
      this.btns.hit        = false;
      this.btns.deal       = false;
      this.btns.stand      = false;
      this.btns.double     = this.judgeDouble();
      this.btns.surrender  = false;
      this.btns.insurance  = false;
      this.result          = 0;

      // 给庄家发牌
      this.dlrCards.splice(0, 0, this._draw(), this._draw());
      this.dlrPoint = this._calcPoint(this.dlrCards);

      // 给闲家发牌
      this.plrCards.splice(0, 0, this._draw(), this._draw());
      this.plrPoint = this._calcPoint(this.plrCards);

      this._changeState(); // 状态迁移

      return 1;
    };

    /**
     * @desc 验证赌注金额
     * @author BuptStEve
     * @param  {Number} bet 闲家的赌注
     * @param  {Number} num 闲家下标
     * @return {Boolean}
     */
    Deck.prototype.judgeBet = function(bet, num) {
      bet = parseInt(bet, 10);
      if (bet <= 0) { return false; }

      return this.plrMoney[num] - bet >= 0 ? true : false;
    };

    /**
     * @desc 闲家选择再加一张牌
     * @author BuptStEve
     * @return {Number} 0：当前无法 hit
     */
    Deck.prototype.hit = function() {
      // 当前无法 hit(已经赢了或输了)
      if (!this.btns.hit) { return 0; }

      this.plrCards.push(this._draw());
      this.plrPoint = this._calcPoint(this.plrCards);

      this._changeState();

      return 1;
    };

    /**
     * @desc 闲家选择不加牌，庄家开始加牌计算
     * @author BuptStEve
     * @return {Number} 0：当前无法 stand
     */
    Deck.prototype.stand = function() {
      // 当前无法 stand(已经赢了或输了)
      if (!this.btns.stand) { return 0; }

      this.btns.hit       = false;
      this.btns.stand     = false;
      this.btns.double    = false;
      this.btns.insurance = false;
      this.btns.surrender = false;

      var tmp = this._addCard();
      if (tmp === -1) {
        this.result = 2;
      } else {
        if (tmp < this.plrPoint) {
          this.result = 1;
        } else if (tmp > this.plrPoint) {
          this.result = -1;
        } else {
          this.result = -2;
        }
      }
      this.btns.deal = true;

      this._genData();

      return 1;
    };

    /**
     * @desc 闲家选择再加一张牌且双倍赌注
     * @author BuptStEve
     * @return {Number} 0：当前无法 double
     */
    Deck.prototype.double = function() {
      if (!this.btns.double) { return 0; }

      this.plrMoney[+!this.dealer] -= this.plrBet; // 先减去 bet 更好计算
      this.plrMoney[this.dealer]   += this.plrBet;
      this.plrBet *= 2;             // 双倍 bet

      this._changeState(true);

      return 1;
    };

    /**
     * @desc 闲家选择买保险
     * @author BuptStEve
     * @return {Number}  0：当前无法 insurance
     */
    Deck.prototype.insurance = function() {
      if (!this.btns.insurance) { return 0; }

      this.result         = this.dlrPoint === 21 ? 4 : -4;
      this.plrInsurance   = Math.ceil(this.plrBet * 0.5);

      this.btns.hit       = false;
      this.btns.deal      = true;
      this.btns.stand     = false;
      this.btns.double    = false;
      this.btns.surrender = false;
      this.btns.insurance = false;

      this._genData();

      return 1;
    };

    /**
     * @desc 闲家选择投降
     * @author BuptStEve
     * @return {Number}  0：当前无法 surrender
     */
    Deck.prototype.surrender = function() {
      if (!this.btns.surrender) { return 0; }

      this.result         = -5;
      this.btns.hit       = false;
      this.btns.deal      = true;
      this.btns.stand     = false;
      this.btns.double    = false;
      this.btns.surrender = false;
      this.btns.insurance = false;

      this._genData();

      return 1;
    };

    /**
     * @desc 判断是否够钱买保险
     * @author BuptStEve
     * @return {Boolean}
     */
    Deck.prototype._judgeInsurance = function() {
      return this.plrMoney[+!this.dealer] - Math.ceil(this.plrBet*0.5) >= 0 ? true : false;
    };

    /**
     * @desc 判断是否够下双倍赌注
     * @author BuptStEve
     * @return {Boolean}
     */
    Deck.prototype.judgeDouble = function() {
      return this.plrMoney[+!this.dealer] - this.plrBet >= 0 ? true : false;
    };

    /**
     * @desc 首先根据是否为第一轮，接着根据分数，进行状态迁移
     * @author BuptStEve
     * @param {Boolean} double 是否双倍
     */
    Deck.prototype._changeState = function(double) {
      var tmp;

      this.btns.insurance = false;
      if (this.plrCards.length === 2) {
        // 第一轮
        if (this.plrPoint === 21) {
          // 拿到 blackjack
          this.result = 3;
        } else if (this.dlrCards[1].rank === 1) {
          // 庄家明牌为 Ace
          this.btns.insurance = this._judgeInsurance();
        } else if (double) {
          // 闲家选择双倍，进行庄家开牌阶段
          this.plrCards.push(this._draw());
          this.plrPoint = this._calcPoint(this.plrCards);
          tmp = this._addCard(); // 加牌

          if (this.plrPoint > 21) {
            // 闲家 bust
            this.result = -6;
          } else if (this.plrPoint === 21) {
            // 拿到21点，非 BlackJack，看庄家是不是 BlackJack
            if (this.dlrPoint === 21) {
              this.result = (this.dlrCards.length === 2) ? -6 : 2;
            } else {
              this.result = 5;
            }
          } else {
            // 闲家点数小于21点
            if (tmp < this.plrPoint || tmp === -1) {
              // 庄家点数小，或 bust
              this.result = 5;
            } else if (tmp > this.plrPoint) {
              // 庄家点数大
              this.result = -6;
            } else {
              // 点数相同，平局
              this.result = -2;
            }
          }
        }
      } else {
        // 非第一轮
        this.btns.double = false;
        if (this.plrPoint === 21) {
          // 拿到21点而非 blackjack，暂时标记为胜利
          this.result = 1;
        } else if (this.plrPoint > 21) {
          // bust 庄家胜
          this.result = -3;
        }
      }

      switch (this.result) {
        // 注意：没加 break，因为分出了胜负，btns 的状态都是一样的
        case 1:
          if (this.dlrPoint === 21) {
            // 闲家凑齐21点，庄家为 BlackJack
            this.result = -1;
          } else {
            // 进行庄家开牌阶段
            tmp = this._addCard();

            if (tmp === 21) {
              // 庄家加牌后也为21点，平局
              this.result = -2;
            } else if (tmp === -1) {
              // 庄家加牌后 bust
              this.result = 2;
            }
          }
        case -6: // 闲家 double 失败
        case -3: // 闲家 bust 庄家胜
        case -2:  // 平局
        case 5:  // 闲家 double 成功
        case 3:
          // 闲家 blackjack
          this.btns.hit       = false;
          this.btns.deal      = true;
          this.btns.stand     = false;
          this.btns.double    = false;
          this.btns.surrender = false;
          break;

        case 0:
          // 未分胜负
          this.btns.hit       = true;
          this.btns.stand     = true;
          this.btns.surrender = true;
          break;

        default:
          console.log('error!');
          break;
      }

      this._genData(); // 生成当前状态数据
    };

    /**
     * @desc 根据 this.result 的情况生成 this.data
     * @author BuptStEve
     */
    Deck.prototype._genData = function() {
      var tmp = this.dlrCards.slice(1);
      tmp.unshift({ suit: '*', rank: '*' });

      this.plrData.dc = this.dlrData.dc = this._num2Rank(this.dlrCards);
      this.plrData.pc = this.dlrData.pc = this._num2Rank(this.plrCards);
      this.plrData.dp = this.plrData.dp = this.dlrPoint;
      this.plrData.pp = this.plrData.pp = this.plrPoint;
      this.plrData.re = this.dlrData.re = this.result;
      this.plrData.bet = this.dlrData.bet = 10; // 分出胜负后，返回默认值
      this.dlrData.btns.deal = true; // 分出胜负后可以 deal

      switch (this.result) {
        case -6:
          this.plrData.rt = this.dlrData.rt = '闲家 double 失败';
          this.plrMoney[this.dealer] += this.plrBet * 2; // 庄家赢得赌注
          break;
        case -5:
          this.plrData.rt = this.dlrData.rt = '闲家投降';
          tmp = Math.floor(this.plrBet*0.5);
          this.plrMoney[+!this.dealer] += tmp; // 投降输一半
          this.plrMoney[this.dealer]   -= tmp;
          break;
        case -4:
          this.plrData.rt = this.dlrData.rt = '闲家买保险失败';
          this.plrMoney[+!this.dealer] -= this.plrInsurance;
          this.plrMoney[this.dealer]   += this.plrInsurance;
          break;
        case -3:
          this.plrData.rt = this.dlrData.rt = '闲家' + this.plrPoint + '点 bust ' + '庄家胜';
          break;
        case -2:
          this.plrData.rt = this.dlrData.rt = this.plrPoint + '点 平局';
          this.plrMoney[+!this.dealer] += this.plrBet;
          this.plrMoney[this.dealer]   -= this.plrBet;
          break;
        case -1:
          this.plrData.rt = this.dlrData.rt = '庄家' + this.dlrPoint + '点 胜 闲家' + this.plrPoint + '点';
          break;
        case 0:
          // 胜负未分
          this.plrData.dc  = this._num2Rank(tmp);
          this.plrData.bet = this.plrBet;
          this.dlrData.btns.deal = false;
          delete this.plrData.dp;
          this.plrData.rt = this.dlrData.rt = '';
          break;
        case 1:
          this.plrData.rt = this.dlrData.rt = '闲家' + this.plrPoint + '点 胜 庄家' + this.dlrPoint + '点';
          this.plrMoney[+!this.dealer] += this.plrBet * 2;
          this.plrMoney[this.dealer]   -= this.plrBet * 2;
          break;
        case 2:
          this.plrData.rt = this.dlrData.rt = '庄家'  + this.dlrPoint + '点 bust ' + '闲家胜';
          this.plrMoney[+!this.dealer] += this.plrBet * 2;
          this.plrMoney[this.dealer]   -= this.plrBet * 2;
          break;
        case 3:
          this.plrData.rt = this.dlrData.rt = '闲家胜 BlackJack';
          this.plrMoney[+!this.dealer] += Math.floor(this.plrBet * 2.5);
          this.plrMoney[this.dealer]   -= Math.floor(this.plrBet * 2.5);
          break;
        case 4:
          this.plrData.rt = this.dlrData.rt = '闲家买保险成功';
          this.plrMoney[+!this.dealer] += this.plrBet;
          this.plrMoney[this.dealer]   -= this.plrBet;
          break;
        case 5:
          this.plrData.rt = this.dlrData.rt = '闲家 double 成功';
          this.plrMoney[+!this.dealer] += this.plrBet * 2;
          this.plrMoney[this.dealer]   -= this.plrBet * 2;
          break;
        default:
          console.log('なに！？');
          break;
      }

      this.plrData.pm = this.dlrData.pm = this.plrMoney[+!this.dealer];
      this.plrData.dm = this.dlrData.dm = this.plrMoney[this.dealer];
    };

    /**
     * @desc 将超过10和为1的 rank 转为 A/J/Q/K
     * @author BuptStEve
     * @param {null} null
     * @return {null} null
     */
    Deck.prototype._num2Rank = function(cards) {
      var arr = [];
      this._deepClone(cards, arr);

      return arr.map(function(x) {
        switch(x.rank) {
          case 1:
            x.rank = 'A';
            break;
          case 11:
            x.rank = 'J';
            break;
          case 12:
            x.rank = 'Q';
            break;
          case 13:
            x.rank = 'K';
            break;
          default:
            break;
        }
        return x;
      })
    }

    /**
     * @desc 初始化并两层循环生成一副牌并打乱这副牌
     * @author BuptStEve
     */
    Deck.prototype._newDeck = function() {
      var i, j; // 循环下标，分别表示花色和点数

      for (i = 0; i < 4; i += 1) {
        for (j = 1; j <= 13; j += 1) {
          this.deck.push({ suit : SUITS[i], rank: j });
        }
      }

      // 随机洗牌
      this.deck.sort(function() { return 0.5 - Math.random(); });
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
     * @param  {Array}  cards  庄家或闲家的手牌
     * @return {Number} tmpVal 计算的点数
     */
    Deck.prototype._calcPoint = function(cards) {
      var tmpVal = 0,
          tmpCards = [],
          i, len, tmpCard;

      this._deepClone(cards, tmpCards);
      tmpCards.sort(function(a, b) {
        return b.rank - a.rank;
      });

      for (i = 0, len = tmpCards.length; i < len; i += 1) {
        tmpCard = tmpCards[i];

        if (tmpCard.rank >= 10) {
          // 超过十的牌按照10点计算
          tmpCard.rank = 10;
        } else if (tmpCard.rank === 1 && tmpVal <= 10){
          // 当前为 Ace 并且当前点数未超过10点，按照11点算
          tmpCard.rank = 11;
        }

        tmpVal += tmpCard.rank;
      }

      return tmpVal;
    };

    /**
     * @desc 对象数组深拷贝
     * @author BuptStEve
     * @param  {Array} cards 手牌数组
     * @param  {Array} arr   拷贝数组
     */
    Deck.prototype._deepClone = function(cards, arr) {
      var i, len;

      for (var i = 0, len = cards.length; i < len; i++) {
        arr.push({
          suit: cards[i].suit,
          rank: cards[i].rank
        });
      }
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
