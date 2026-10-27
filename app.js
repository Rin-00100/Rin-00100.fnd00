/*
プレイヤーオブジェクトの構成
const players = [
  {
    id: 1, //複数プレイヤーの場合の識別用
    name: "Player 1", //複数プレイヤーの場合の識別用（表示名）
    hand: [], //ハンド
    Debt: 0, // 借金（キャッシングで増える上限4000）
    balance: 1000, //持ち金
    bet: 0, //そのゲームでベットしている金額
    isOpen: true, //手札をオープンしているか（プレイヤーは常にオープン）
    isSurrender: false, //サレンダーしているか
    isBlackjack: false, //ブラックジャックかどうか
    isStand: false, //スタンドしているか
    isBust: false //バーストしているか
  }
];

ディーラーオブジェクトの構成
const dealer = {
    id: 0, //複数プレイヤーの場合の識別用
    name: "Dealer", //複数プレイヤーの場合の識別用（表示名）
    hand: [], //ハンド
    isOpen: false, //2枚目をオープンしているか
    isBlackjack: false, //ブラックジャックかどうか
    isBust: false, //バーストしているか
    isStand: false //スタンドしているか
  }

カードオブジェクトの構成
const card = {
    suit: suit, //スート（絵柄）
    rank: rank, //数値(A,2,Kなど)
    value: value, //計算上の得点（Aは11点に設定して、計算時に自動処理する）
    image: `images/cards/card_${suit}_${imageNumber}.png` //html表示用のパス
};
*/

//=========================
// ゲームスタート前用の関数
//=========================

//初期化関係

/**
 * ブラックジャックで使用するデッキを生成する。
 * 各カードはオブジェクト型にして、スート(♠,♥,...)、ランク(A~K)、点数、画像パスを設定する。
 *
 * @returns {Array} deck カードが格納されたデッキ（シャッフル前）
 */
function createDeck(){
  const deck = [];
  const suits = ["spade", "heart", "diamond", "club"];
  const numDeck = 6; //デッキの個数(6~8くらいらしい)

  for(let i=0; i<numDeck; i++){
    for(const suit of suits){
      for(let number=1; number<=13; number++){
        let rank; //カードの絵柄（A~K）
        let value; //ブラックジャックでの点数

        // ランクの設定
        if(number === 1){
          rank = "A";
        } else if(number === 11){
          rank = "J";
        } else if(number === 12){
          rank = "Q";
        } else if(number === 13){
          rank = "K";
        } else{
          rank = String(number);
        }

        // 点数の設定
        if(number === 1){ //1(A)は11として扱う
          value = 11;
        } else if(number >= 10){ //10以上のカードは10として扱う
          value = 10;
        } else{ //それ以外はそのまま
          value = number;
        }

        // 画像ファイル用の番号
        const imageNumber = String(number).padStart(2, "0"); //1桁の数字を0埋めしている

        const card = {
          suit: suit,
          rank: rank,
          value: value,
          image: `images/${number}_${suit+"s"}.png`
          // image: `images/cards/card_${suit}_${imageNumber}.png`
        };

        deck.push(card);
      }
    }
  }
  return deck;
}

/**
 * デッキをシャッフルする。
 *
 * @param {Array} deck    シャッフルするカードのデッキ
 * @returns {Array} deck  シャッフルされたデッキ
 */
function shuffleDeck(deck){ //直でいじっているので、そのまま返してもいい

  for(let i = deck.length-1; i>0; i--){

    // 0 ～ i の中からランダムな位置を選択
    const randomIndex = Math.floor(Math.random() * (i + 1));

    // カードを入れ替える
    [deck[i], deck[randomIndex]] = [deck[randomIndex], deck[i]];
  }

  return deck;
}

//=========================
// ラウンド前用の関数
//=========================


//ターンごとの初期化関係

//ベットする
/**
 * プレイヤーがベットする。
 * 持ち金を上回っていなければベットを行い、trueを返す。
 * 持ち金を上回っている場合はベットを行わず、falseを返す。
 *
 * @param {Object} player  ベットするプレイヤー
 * @param {number} amount  ベット額
 * @returns {boolean}      ベットできた場合はtrue
 */
function checkBet(player, amount){
  if(player.bet > 0){
    return false; // すでにベットしている場合は再度ベットできない
  }
  if(amount <= 0){
    return false; // ベット額が0以下の場合はベットできない
  }

  if(amount > player.balance){
    return false; // 持ち金を上回っている場合はベットできない
  }

  player.balance -= amount;
  player.bet = amount;

  return true;
}

//キャッシングする
/**
 * プレイヤーがキャッシングする。
 * 持ち金を上回っていなければキャッシングを行い、trueを返す。
 * 持ち金を上回っている場合はキャッシングを行わず、falseを返す。
 *
 * @param {Object} player  キャッシングするプレイヤー
 * @param {number} amount  キャッシング額
 * @returns {boolean}      キャッシングできた場合はtrue
 */
function checkCashing(player, amount){
  const maxCashing=4000;
  if(amount <= 0){
    return false; // キャッシング額が0以下の場合はキャッシングできない
  }

  if(player.cashing + amount > maxCashing){
    return false; // キャッシング上限を上回っている場合はキャッシングできない
  }

  player.cashing += amount;
  player.balance += amount;

  return true;
}


//カードを配る（最初は２枚ずつ）
/**
 * デッキの最後からカードを1枚取り出す。
 *
 * @param {Array} deck         カードを取り出すデッキ
 * @returns {Object} card      取り出したカード
 */
function drawCard(deck){
  return deck.pop();
}

/**
 * 全プレイヤーとディーラーにカードを2枚ずつ配る。
 *
 * @param {Array} deck         使用するデッキ
 * @param {Array} playerHand   プレイヤーのハンド
 * @param {Array} dealerHand   ディーラーのハンド
 */

function dealInitialCards(players, dealer, deck){
  // for(const player of players){
  //   player.hand = [];
  // }
  // dealer.hand = [];
  for(let i=0; i<2; i++){
    for(const player of players){
      player.hand.push(drawCard(deck));
    }

    dealer.hand.push(drawCard(deck));
  }
}


//点数計算（ラウンド前にも終了前にも使う）////////////////
/**
 * ハンド内のカードの合計点を計算する。
 * Aは基本的に11点として計算し、
 * 合計が21を超える場合は必要な数だけ1点として扱う。
 *
 * @param {Array} hand      点数を計算するカードの配列
 * @returns {number} score  ハンドの合計点
 */
function calculateScore(hand){
  let score = 0; //点数
  let aceCount = 0; //ハンドのAの枚数

  // すべてのカードの点数を合計する
  for(const card of hand){
    score += card.value;
    // Aの枚数を数える
    if(card.rank === "A"){
      aceCount++;
    }
  }

  // 21を超えている場合、Aを11点 → 1点として再計算する
  while(score > 21 && aceCount > 0){ //21を越えていて、Aを持っている場合
    score -= 10;
    aceCount--;
  }
  return score;
}

/**
 * ブラックジャックかどうかを判定する。
 *
 * @param {Object} playerOrDealer  判定するプレイヤーとディーラー
 * @returns {boolean}              ブラックジャックならtrue
 */
function checkBlackjack(playerOrDealer){
  if(playerOrDealer.hand.length === 2 && calculateScore(playerOrDealer.hand) === 21){
    playerOrDealer.isBlackjack = true;
    return true;
  }

  return false;
}


//=========================
// 画面表示関係の関数
//=========================

/**
 * 開始時に呼ぶ。
 * プレイヤー人数に応じてHTML要素を生成する。
 * @param {Array[Object]} players 全プレイヤー
 */
function createPlayerElements(players){

  const playersArea = document.getElementById("players-area");

  // 一度初期化
  playersArea.innerHTML = "";

  for(const player of players){

    // Player全体を囲む要素
    const playerArea = document.createElement("section");

    playerArea.classList.add("player-area");
    // playerArea.style.width = `${100/players.length - 20/players.length}%`

    playerArea.innerHTML = `
      <h2>${player.name}</h2>

      <div id="${player.name}-hand" class="hand"></div>

      <p>
        Score:
        <span id="${player.name}-score">0</span>
      </p>

      <p>
        Balance:
        <span id="${player.name}-balance">
          ${player.balance}
        </span>
      </p>

      <p>
        Bet:
        <span id="${player.name}-bet">
          ${player.bet}
        </span>
      </p>

      <p id="cashing">
        Cashing:
        <span id="${player.name}-cashing">
          ${player.cashing}
        </span>
      </p>
      
      <p id="${player.name}-result"></p>
    `;

    playersArea.appendChild(playerArea);
  }
}


/**
 * 現在のゲームフェーズに応じて表示を切り替える。
 * gamePhase  現在のゲームフェイズ（"betting":ベット中, "playerTurn":プレイヤーの行動中, "dealerTurn":ディーラーの行動中（未実装）, "roundFinished":ラウンド終了）
 * 
 */
function renderPhase(){

  // elementを取得
  const betArea = document.getElementById("bet-area"); 
  const actionArea = document.getElementById("action-area");
  const roundFinishedArea = document.getElementById("round-finished-area");

  // 一旦全部消す
  betArea.classList.toggle("hidden", true);  // 非表示
  actionArea.classList.toggle("hidden", true);  // 非表示
  roundFinishedArea.classList.toggle("hidden", true);  // 非表示

  // フェイズに合うものを表示
  if(gamePhase === "betting"){
    betArea.classList.toggle("hidden", false); //表示
  } else if(gamePhase === "playerTurn"){
    actionArea.classList.toggle("hidden", false); //表示
  } else if(gamePhase === "roundFinished"){
    roundFinishedArea.classList.toggle("hidden", false); //表示
  }
}

/**
 * ハンドのカードをHTML上に表示する。
 * プレイヤーの行動ごと（ベット時含む）に反映する。
 * ベット時もこれを使用するため、カードを配る前に使用することもある。
 * @param {Object} playerOrDealer 表示するプレイヤーまたはディーラー
 */
function displayHand(playerOrDealer){

  const handElement = document.getElementById(`${playerOrDealer.name}-hand`);

  // 一度表示内容を空にする
  handElement.innerHTML = "";

  // ハンド内のカードを1枚ずつ処理
  for(const [index, card] of playerOrDealer.hand.entries()){

    // img要素を作成
    const cardImage = document.createElement("img");

    if(playerOrDealer.isOpen === false && index === 1){
      cardImage.src = "./images/back_of_card_image_blue.png"; // 2枚目がオープンしていない場合は裏面画像を表示
    } else{
      // カードの画像を設定
      cardImage.src = card.image;
    }
    // CSS用のclassを設定
    cardImage.classList.add("card");

    // HTMLに追加
    handElement.appendChild(cardImage);
  }
}


/**
 * プレイヤーまたはディーラーの点数をHTML上に表示する。
 * プレイヤーの行動ごと（ベット時含む）に反映する。
 * ベット時もこれを使用するため、カードを配る前に使用することもある。
 *
 * @param {Object} playerOrDealer   プレイヤーまたはディーラー
 */
function displayScore(playerOrDealer){

  let score = 0;

  if(playerOrDealer.hand.length === 0){
    score = 0; // ハンドが空の場合は0点を表示
  }
  else if(!playerOrDealer.isOpen){
    score = calculateScore([playerOrDealer.hand[0]]); // 2枚目をオープンしていない場合は1枚目のみの点数を表示
  } else{
    score = calculateScore(playerOrDealer.hand); // 2枚目をオープンしている場合は全てのカードの点数を表示
  }

  document.getElementById(`${playerOrDealer.name}-score`).textContent = score;
}

/**
 * 現在のゲーム状態をHTMLへ反映する。
 * プレイヤーの行動ごと（ベット時含む）に反映する。
 * ベット時もこれを使用するため、カードを配る前に使用することもある。
 */
function renderGame(){

  for(const player of players){
    displayHand(player);
    displayScore(player);

    document.getElementById(`${player.name}-balance`).textContent = player.balance;
    document.getElementById(`${player.name}-bet`).textContent = player.bet;
    document.getElementById(`${player.name}-cashing`).textContent = player.cashing;
  }

  displayHand(dealer);
  displayScore(dealer);

  renderPhase(); // 現在のゲームフェイズに応じて表示を更新(add)
}


//=========================
// プレイヤーの行動用の関数
//=========================

//プレイヤーの処理（サレンダー・ヒット・スタンド・ダブルダウン）
/**
 * サレンダーを行う。
 * ※ベットした後、Hitなどを行う前に行うことができる。
 * ブラックジャックの場合はサレンダーしない（最低でもドローになる）
 * 
 * @param {Object} player   プレイヤーオブジェクト
*/

function surrender(player){
    if(player.bet === 0 || player.hand.length !== 2 || player.isSurrender || player.isBlackjack || player.isStand || player.isBust){
        window.alert("サレンダーできません");
        return false;
    }
    player.isSurrender = true;
    // player.balance += player.bet / 2; // サレンダー時はベットの半分を返却（どこで処理するかは要検討）
    // player.bet = 0;
    return true;
}


// 次のプレイヤーにターンを移す
function moveToNextPlayer(){
  turnPlayerIndex++;

  // 終了済みプレイヤーを飛ばす
  while(turnPlayerIndex < players.length && checkPlayerFinished(players[turnPlayerIndex])){
    turnPlayerIndex++;
  }

  // 全プレイヤー終了
  if(turnPlayerIndex >= players.length){
    // ディーラーのターンに移行
    dealerTurn(players, dealer, deck);
    // 勝敗判定と計算処理に移る
    finishRound(players,dealer);

    return;
  }

  renderGame();
}

/**
 * 指定されたプレイヤーがカードを1枚引く。
 * 21点を超えた場合はバースト状態にする。
 *
 * @param {Object} player   カードを引くプレイヤー（ブラックジャックの場合はスランドするので、ヒット不可）
 */
function hit(player,deck){
  // Surrender / Blackjack / Stand / Bust済みなら何もしない
  if(player.isSurrender || player.isBlackjack || player.isStand || player.isBust){ //isFinishedで判定可能（修正するかも）
    return false;
  }

  // デッキから1枚引く
  const card = drawCard(deck);
  // ハンドに追加
  player.hand.push(card);
  const score = calculateScore(player.hand);

  // バースト判定
  if(score > 21){
    player.isBust = true;
  }
  if(score === 21){ //21点になったら自動でStand
    player.isStand = true;
  }

  renderGame();
  return true;
}

/**
 * 指定されたプレイヤーをStand状態にする。
 *
 * @param {Object} player   Standするプレイヤー
 */
function stand(player){
  // Surrender / Blackjack / Stand / Bust済みなら何もしない
  if(player.isSurrender || player.isBlackjack || player.isStand || player.isBust){
    return false;
  }

  player.isStand = true;

  renderGame();
  return true;
}

/**
 * ダブルダウン時にベット額を2倍にする。
 *
 * @param {Object} player   プレイヤー
 * @returns {boolean} ベットを追加できた場合true
 */
function doubleBet(player){

  // 現在のベット額と同じ金額を追加で支払う
  if(player.balance < player.bet){
    return false;
  }

  player.balance -= player.bet;
  player.bet *= 2;

  return true;
}

/**
 * ダブルダウンを行う。
 * ベットを2倍にしてカードを1枚引き、スタンドを行う。
 * ※ヒットしてないとき（手札が2枚）のみ行うことができる。
 *
 * @param {Object} player   Doubleするプレイヤー
 */
function doubleDown(player,deck){
  // Surrender / Blackjack / Stand / Bust済みなら何もしない
  if(player.isSurrender || player.isBlackjack || player.isStand || player.isBust){
    return false;
  }

  // 最初の2枚のときだけDouble可能
  if(player.hand.length !== 2){
    return false;
  }

  // ベットを2倍にできなければ終了
  if(!doubleBet(player)){
    return false;
  }

  // 1枚引く
  const card = drawCard(deck);
  player.hand.push(card);
  const score = calculateScore(player.hand);

  // バースト判定
  if(score > 21){
    player.isBust = true;
  } else{
    // バーストしていなくてもDouble後はStand
    player.isStand = true;
  }

  renderGame();
  return true;
}


/**
 * ディーラーのターンを実行する。
 * 合計点が17以上になるまでカードを引く。
 * 全員がバーストしているときはディーラーターンはスキップする（ブラックジャックの確認もしない）
 * 
 * @param {Array} players  全プレイヤー
 * @param {Array} dealer   ディーラー
 * @param {Array} deck     使用中のデッキ
 */
function dealerTurn(players, dealer, deck){
  // 全員がバーストしている場合はディーラーターンをスキップ
  if(players.every(player => player.isBust || player.isSurrender)){
    return;
  }

  gamePhase = "dealerTurn"; // ディーラーのフェイズに移行(add)

  dealer.isOpen = true; //ディーラーの手札を公開
  checkBlackjack(dealer); // ディーラーがブラックジャックかどうかを確認
  renderGame(); // ディーラーの手札を公開時に先に表示する？
  // ディーラーがブラックジャックの場合はドローは行わないので、スキップ
  if(!dealer.isBlackjack){
    // ディーラーのスコアが17以上になるまでカードを引き続ける
    while(calculateScore(dealer.hand) < 17){
      const card = drawCard(deck);
      dealer.hand.push(card);
      renderGame(); // カードを引くたびに表示を更新する？
    }
    // バースト判定
    if(calculateScore(dealer.hand) > 21){
      dealer.isBust = true;
    }
  }
  dealer.isStand = true;
  renderGame();
}


//=========================
// ボタンクリック時の動作関数
//=========================

const hitButton = document.getElementById("hit-button"); //ヒットボタンと繋げる

// ヒットボタンがクリックされたときの処理(hit()を行う)
hitButton.addEventListener("click", () => { 
  const turnPlayer = players[turnPlayerIndex];

  if(turnPlayer){
    if(!hit(turnPlayer, deck)){ // ヒットに失敗した場合（False）に中断
      return;
    }

    if(checkPlayerFinished(turnPlayer)){ // バーストまたは21点になったら（自動的にスタンド）次のプレイヤーへ
      moveToNextPlayer();
    }
  }
});


const standButton = document.getElementById("stand-button"); //スタンドボタンと繋げる

// スタンドボタンがクリックされたときの処理(stand()を行う)
standButton.addEventListener("click", () => {
  const turnPlayer = players[turnPlayerIndex];

  if(turnPlayer){
    if(stand(turnPlayer)){
      moveToNextPlayer();
    }
  }
});


const doubleButton = document.getElementById("double-button"); //ダブルダウンボタンと繋げる

// ダブルダウンボタンがクリックされたときの処理(doubleDown()を行う)
doubleButton.addEventListener("click", () => {
  const turnPlayer = players[turnPlayerIndex];

  if(turnPlayer){
    if(doubleDown(turnPlayer, deck)){
      moveToNextPlayer();
    } else{
      window.alert("ダブルダウンに失敗しました");
    }
  }
});

// サレンダーボタンがクリックされたときの処理
const surrenderButton = document.getElementById("surrender-button");

surrenderButton.addEventListener("click", () => {
  const turnPlayer = players[turnPlayerIndex];

  if(!turnPlayer){
    return;
  }

  if(surrender(turnPlayer)){
    moveToNextPlayer();
  }
});

//=========================
// ここがラウンドの起点になる
//=========================
// ベットボタンがクリックされたときの処理
const betButton = document.getElementById("betButton");

betButton.addEventListener("click", () => {

  const turnPlayer = players[turnPlayerIndex];
  const betAmount = parseInt(document.getElementById("betAmount").value,10); //文字列で入ってくるので、整数値に変換する

  if(!turnPlayer || isNaN(betAmount)){ // ベット金額が数値でない場合はアラートを表示
    window.alert("ベット金額を入力してください");
    return;
  }

  if(betAmount % 100 !== 0){
    window.alert("ベット金額は100単位で入力してください");
    return;
  }

  if(!checkBet(turnPlayer, betAmount)){ //checkBetはベットできない場合falseで返ってくる
    window.alert("所持金以上の金額はベットできません");
    return;
  }

  document.getElementById("betAmount").value=""; //入力欄の中身を空にする
  document.getElementById("cashingAmount").value=""; //入力欄の中身を空にする

  renderGame();

  turnPlayerIndex++;

  // ベットフェイズ終了
  if(turnPlayerIndex >= players.length){
    // 全員がベットを終えたらラウンド開始
    turnPlayerIndex = 0; // ラウンド開始時に最初のプレイヤーにターンを戻す
    startRound(players, dealer, deck);

    gamePhase = "playerTurn"; // プレイヤーのフェイズに移行(add)

    renderGame(); //カードを配布後に画面を更新

    skipFinishedPlayers();
    return;
  }
});

// 次のラウンドボタンの処理
const nextRoundButton = document.getElementById("next-round-button");
nextRoundButton.addEventListener("click", () => {
  if(!isRoundFinished){
    return;
  }

  resetRound(players, dealer);

  gamePhase = "betting"; // 次のラウンドはベットフェイズから開始(add)

  document.getElementById("betAmount").value=""; //入力欄の中身を空にする
  document.getElementById("cashingAmount").value=""; //入力欄の中身を空にする

  renderGame();
});

// キャッシングボタンがクリックされたときの処理
const cashingButton = document.getElementById("cashingButton");

cashingButton.addEventListener("click", () => {

  const turnPlayer = players[turnPlayerIndex];
  const cashingAmount = parseInt(document.getElementById("cashingAmount").value,10); //文字列で入ってくるので、整数値に変換する

  if(!turnPlayer || isNaN(cashingAmount)){ // キャッシング金額が数値でない場合はアラートを表示
    window.alert("キャッシング金額を入力してください");
    return;
  }

  if(cashingAmount <= 0){
      window.alert("有効な金額を入力してください");
    return;
  }

  if(!checkCashing(turnPlayer, cashingAmount)){ //checkCashingはキャッシングできない場合falseで返ってくる
    window.alert("キャッシング上限です");
    return;
  }

  document.getElementById("betAmount").value=""; //入力欄の中身を空にする
  document.getElementById("cashingAmount").value=""; //入力欄の中身を空にする

  renderGame();
});


// ホーム画面でstartボタンが押されたとき
const startButton = document.getElementById("startButton");

startButton.addEventListener("click", () => {
  // document.getElementById("home").classList.toggle("hidden", true);  // 非表示
  document.getElementById("home").style.display = "none";

  startGame();
});
//=========================
// ラウンド終了用の関数
//=========================

//ラウンドの継続判定処理
/**
 * プレイヤーが行動終了しているか判定する。
 * Surrender / Blackjack / Stand / Bustの場合は終了とみなす。
 *
 * @param {Object}    player   プレイヤー
 * @returns {boolean} そのプレイヤーのラウンド終了ならtrue
 */
function checkPlayerFinished(player){
  // Surrender / Stand / Bust済みなら終了
  if(player.isSurrender || player.isStand || player.isBust || player.isBlackjack){
    return true;
  }

  return false;
}

// /**
//  * 全プレイヤーが行動終了しているか判定する。
//  * @param {Array[Object]} players 全プレイヤー
//  * @returns {boolean}     全プレイヤーの行動終了ならtrue
//  */
// function checkAllPlayersFinished(players){
//   for(const player of players){
//     if(!checkPlayerFinished(player)){
//       return false;
//     }
//   }
//   return true;
// }

/**
 * 勝者を判定する。
 * プレイヤーとディーラーのハンドを比較して勝者を判定する。
 * プレイヤーがバーストしていればディーラーの勝ち、ディーラーがバーストしていればプレイヤーの勝ち。
 * 両者がバーストしていなければ点数を比較し、同点なら引き分けとする。
 *
 * @param {Object} player  プレイヤー
 * @param {Object} dealer  ディーラー
 * @returns {string} 勝者を表す文字列 (player.name, "dealer", "draw")
 */
function judgeWinner(player, dealer){

  const playerScore = calculateScore(player.hand);
  const dealerScore = calculateScore(dealer.hand);

  // サレンダー判定（降りた人間はブラックジャックの影響は受けないので注意）
  if(player.isSurrender){
    return "Dealer";
  }

  // ブラックジャック判定
  if(dealer.isBlackjack && !player.isBlackjack){
    return "Dealer";
  }

  if(player.isBlackjack && !dealer.isBlackjack){
    return player.name;
  }

  if(player.isBust){
    return "Dealer";
  }

  if(dealer.isBust){
    return player.name;
  }

  if(playerScore > dealerScore){
    return player.name;
  }

  if(playerScore < dealerScore){
    return "Dealer";
  }

  return "Draw";
}

/**
 * プレイヤーの配当金を計算する。
 * @param {Object} player  プレイヤー
 * @param {Object} dealer  ディーラー
 * @returns {number} プレイヤーの配当金
 */
function calculatePayout(player, dealer){
  const result = judgeWinner(player, dealer);
  // サレンダーの場合は配当金は半分
  if(player.isSurrender){
    return player.bet / 2;
  }

  if(result === player.name){
    if(player.isBlackjack){
      return player.bet * 2.5; // ブラックジャックの場合は2.5倍
    }
    return player.bet * 2; // 勝利の場合は2倍
  }

  if(result === "Dealer"){
    return 0; // 負けの場合は0
  }

  if(result === "Draw"){
    return player.bet; // 引き分けの場合はそのまま
  }
}

function displayResult(player, result, payout){

  const resultElement = document.getElementById(`${player.name}-result`);

  if(player.isSurrender){
    resultElement.textContent = `Surrender / Payout: ${payout}`;
  } 
  else if(result === "Draw"){
    resultElement.textContent = `Draw / Payout: ${payout}`;
  } 
  else if(result === player.name){
    resultElement.textContent = `Win / Payout: ${payout}`;
  } 
  else{
    resultElement.textContent = "Lose / Payout: 0";
  }
}

//=========================
// ゲーム進行用の関数
//=========================

/**
 * 
 * シャッフルされたデッキを作成する。
 * @returns {Array} シャッフルされたデッキ
 */
function createShuffledDeck(){
  const deck = createDeck();
  shuffleDeck(deck);

  return deck; // するかどうか
}

/**
 * ベットや行動終了時に、次の行動可能なプレイヤーにターンを移す。
 * 全員終了していた場合は、ディーラーのターンを行い、ラウンドを終了する。
 */
function skipFinishedPlayers(){

  while(turnPlayerIndex < players.length && checkPlayerFinished(players[turnPlayerIndex])){ // 行動終了しているプレイヤーをスキップ
    turnPlayerIndex++;
  }

  // 全プレイヤーが最初から終了していた場合
  if(turnPlayerIndex >= players.length){
    dealerTurn(players, dealer, deck);
    finishRound(players, dealer);
    return;
  }

  renderGame();
}

//この間でbetする必要があるが、プレイヤーの入力を待つ必要がある。


/**
 * ラウンドをリセットする。
 * 各プレイヤーとディーラーの手札や状態を初期化する。
 * @param {Array[Object]} players  全プレイヤー
 * @param {Object}        dealer   ディーラー
 */
function resetRound(players,dealer){
  isRoundFinished = false; // ラウンド終了フラグのリセット

  // プレイヤーの持ち金（と借金）以外をリセット
  for(const player of players){
    player.hand = [];
    player.bet = 0;
    player.isOpen = true; //プレイヤーの手札は常に公開
    player.isSurrender = false;
    player.isBlackjack = false;
    player.isBust = false;
    player.isStand = false;
    document.getElementById(`${player.name}-result`).textContent = "";
  }
  // ディーラーの状態をリセット
  dealer.hand = [];
  dealer.isOpen = false; //ディーラーの手札は初期状態では非公開
  dealer.isBlackjack = false;
  dealer.isBust = false;
  dealer.isStand = false;  

  // ターンを最初のプレイヤーに戻す
  turnPlayerIndex = 0;

}

//ラウンドを開始する：カードを配って、ブラックジャックか確認を行う
/**
 * ラウンドを開始する。初期カードを配り、ブラックジャックを確認する。
 * 
 * @param {Array[Object]} players  全プレイヤー
 * @param {Object}        dealer   ディーラー
 * @param {Array}         deck     デッキ
 */
function startRound(players, dealer, deck){
  dealInitialCards(players, dealer, deck);

  for(const player of players){
    checkBlackjack(player);
  }
}


function finishRound(players, dealer){
  if(isRoundFinished){ //年にための例外処理
    return; // すでにラウンドが終了している場合は処理を中断
  }

  isRoundFinished = true; // ラウンド終了フラグを立てる

  for(const player of players){
    // プレイヤーごとの勝敗と配当を計算
    const result = judgeWinner(player, dealer);
    const payout = calculatePayout(player, dealer);
    player.balance += payout; //配当金を持ち金に加算

    // 結果を表示
    displayResult(player, result, payout);
  }

  gamePhase = "roundFinished"; // ラウンド終了フェイズに移行(add)

  renderGame();
}




// ================================
// ゲームを動かす
// ================================

const players = [];
const numPlayers = 1; // ここでプレイヤーの人数を指定
for(let i=0; i<numPlayers; i++){
  players.push({
    id: i + 1,
    name: `Player ${i + 1}`,
    hand: [],
    debt: 0,
    cashing: 0,
    balance: 1000,
    bet: 0,
    isOpen: true,
    isSurrender: false,
    isBlackjack: false,
    isStand: false,
    isBust: false
  });
}

const dealer = {
  id: 0,
  name: "Dealer",
  hand: [],
  isOpen: false,
  isBust: false,
  isBlackjack: false,
  isStand: false
};

let deck = []; //丸ごと置き換えることもある
let turnPlayerIndex = 0; // 現在のターンプレイヤーのインデックス(これを進めることで、次のプレイヤーにターンを移すことができる)
let isRoundFinished = false; // ラウンド終了フラグ（trueならラウンド終了）
let gamePhase = "betting"; // ゲームの現在のフェイズ（"betting", "playerTurn", "roundFinished"）

function startGame(){
  createPlayerElements(players);

  deck = createShuffledDeck();

  renderGame();
}
