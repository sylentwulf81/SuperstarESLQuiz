export type GuideLanguage = 'en' | 'ja';

export interface GuideContent {
  header: {
    title: string;
    subtitle: string;
    close: string;
  };
  tabs: {
    guide: string;
    rules: string;
    cards: string;
  };
  hostGuide: {
    title: string;
    subtitle: string;
    sections: {
      id: string;
      title: string;
      icon: string;
      points: string[];
      tip?: string;
    }[];
  };
  gameRules: {
    title: string;
    overview: string;
    questionTypesTitle: string;
    questionTypes: {
      title: string;
      desc: string;
      icon: string;
      color: string;
    }[];
    scoringTitle: string;
    scoringPoints: string[];
    winningTitle: string;
    winningDesc: string;
  };
  mysteryCards: {
    title: string;
    subtitle: string;
    instructions: string;
    deckInfo: string;
    cardDescriptions: Record<string, { title: string; desc: string }>;
    testSoundLabel: string;
  };
  footer: {
    tagline: string;
    playButton: string;
  };
}

export const GUIDE_TRANSLATIONS: Record<GuideLanguage, GuideContent> = {
  en: {
    header: {
      title: 'HOW TO PLAY & HOST GUIDE',
      subtitle: 'Complete manual for teachers, hosts, and classroom leaders',
      close: 'Close',
    },
    tabs: {
      guide: 'TEACHER & HOST GUIDE',
      rules: 'GAME RULES',
      cards: 'MYSTERY CARDS DECK',
    },
    hostGuide: {
      title: 'How to Run Mario Party in Your Classroom',
      subtitle: 'Everything a teacher, substitute, or host needs to know to lead an exciting, seamless session.',
      sections: [
        {
          id: 'step-1',
          title: '1. Starting the Game & Team Setup',
          icon: 'Users',
          points: [
            'Select 2 to 6 active character teams (Mario, Luigi, Peach, Daisy, Yoshi, Donkey Kong).',
            'Choose starting coins: 0, 5, 10, 15, or 20 coins. We recommend starting with 5 or 10 coins so Boo steal cards have an immediate impact!',
            'Select your theme: Summer Edition (60 ESL trivia questions) or Christmas Edition (60 holiday trivia questions). Both have 5 tiered rows of 12 blocks.',
          ],
          tip: 'Tip: You can rename any team on the setup screen by typing a custom team name!',
        },
        {
          id: 'step-2',
          title: '2. Running Turns & The 60-Block Board',
          icon: 'Gamepad2',
          points: [
            'The active team is clearly displayed at the top of the screen.',
            'The team on turn chooses ANY of the 60 numbered brick blocks.',
            'Clicking the block reveals either a Trivia Question or a 6-Card Mystery Roulette.',
            'Once solved, the block is cleared and coins are automatically awarded to the active team.',
            'Turns automatically advance to the next team clockwise.',
          ],
          tip: 'Tip: If you need to skip a turn or change who is playing, click "Pass Turn" or directly click any team card on the leaderboard!',
        },
        {
          id: 'step-3',
          title: '3. Host Score Controls (+ / - Coins)',
          icon: 'Sliders',
          points: [
            'You have full control over scores at any moment during the game!',
            'On the team leaderboard, simply click the "+" or "-" buttons on any team to add or deduct coins directly.',
            'Use this to award bonus points for great team collaboration, pronunciation, or to balance the game.',
          ],
          tip: 'Tip: Teams can have negative coins if Bowser strikes or Boo steals from a team with 0 coins!',
        },
        {
          id: 'step-4',
          title: '4. Solving Question Types',
          icon: 'HelpCircle',
          points: [
            'Visual & Multiple Choice: Read the prompt and examine the image. Students choose from 4 options (A, B, C, D).',
            'Letter Unscramble: Students click scrambled letter tiles to spell the vocabulary word. Use Hint or Backspace if students get stuck.',
            'Open Trivia: Knowledge and conversation questions. Click "Reveal Answer" to check, then tap "Correct (+Coins)" or "Incorrect".',
            'Mystery Roulette: When a question mark mystery block is hit, 6 face-down cards appear. The student picks their lucky card (1–6)!',
          ],
        },
        {
          id: 'step-5',
          title: '5. Customizing Questions & Cloud Sync',
          icon: 'Settings2',
          points: [
            'Click "Edit" in the top header or hamburger menu to open the Question Deck Customizer.',
            'You can modify question prompts, answers, images, and coin values for all 60 blocks.',
            'Log into Google via the top-right Account menu to save your customized questions to the Cloud, making them instantly accessible from any classroom device!',
          ],
          tip: 'Tip: Use the "Shuffle" button to randomize the locations of questions and mystery cards for a fresh experience!',
        },
        {
          id: 'step-6',
          title: '6. Crown the Superstar & Finish',
          icon: 'Trophy',
          points: [
            'You can click "Superstar!" in the header at ANY time or once all 60 blocks are opened.',
            'This opens the grand victory ceremony: celebration fanfare music, animated podium rankings, confetti, and complete coin statistics!',
            'You can return to the board at any time or start a new game.',
          ],
        },
        {
          id: 'step-7',
          title: '7. Smartboard & Classroom AV Tips',
          icon: 'Monitor',
          points: [
            'Press F11 to enter Fullscreen mode on Smartboards or interactive whiteboards.',
            'Use the built-in Music Player to play, pause, or adjust background music volume directly.',
            'On phones or tablets, tap the ☰ Hamburger Menu in the top right to access all controls without clutter.',
          ],
        },
      ],
    },
    gameRules: {
      title: 'Official Game Rules',
      overview:
        'Teams take turns selecting one of the 60 Mystery Brick Blocks from the board. Answer trivia, unscramble words, or draw lucky surprise cards to collect Mario Coins. The team with the most coins at the end is crowned the SUPERSTAR!',
      questionTypesTitle: 'Question & Challenge Categories',
      questionTypes: [
        {
          title: 'Visual & Multiple Choice',
          desc: 'Examine picture clues or prompts and choose the correct answer among 4 choices.',
          icon: '🖼️',
          color: 'border-amber-400/40 text-amber-300',
        },
        {
          title: 'Letter Unscramble',
          desc: 'Tap scrambled letter tiles in the correct sequence to spell target vocabulary.',
          icon: '🔤',
          color: 'border-sky-400/40 text-sky-300',
        },
        {
          title: 'Open Trivia & Discussion',
          desc: 'Open-ended questions. The teacher reveals the answer and awards coins with one tap.',
          icon: '🎁',
          color: 'border-emerald-400/40 text-emerald-300',
        },
        {
          title: 'Mystery Roulette',
          desc: 'Trigger a 6-card roulette of surprise events: Boo steals, Bowser revolutions, and bonus stars!',
          icon: '⭐',
          color: 'border-purple-400/40 text-purple-300',
        },
      ],
      scoringTitle: 'Scoring & Coin System',
      scoringPoints: [
        'Blocks award between 1 to 5 base coins depending on difficulty row.',
        'Correct answers automatically credit the team.',
        'If a team has a Super Mushroom (2x) active, their next question reward is doubled!',
        'Consecutive correct answers build a streak counter.',
      ],
      winningTitle: 'How to Win',
      winningDesc:
        'The team with the most coins when the game concludes (or when all 60 blocks are opened) wins the Superstar Trophy! Click the Superstar button at any time to check final standings.',
    },
    mysteryCards: {
      title: 'Interactive Mystery Cards Deck',
      subtitle: 'Click any card below to test authentic sound effects and preview game effects.',
      instructions:
        'When a team hits a Mystery Card block, 6 face-down cards are presented in a 2:3 ratio. The student chooses one card (1 to 6). Below is the complete deck of possible outcomes:',
      deckInfo: 'Complete Deck: 8 Special Cards',
      cardDescriptions: {
        bowser_revolution: {
          title: 'Bowser Revolution',
          desc: 'Bowser shakes up the board! Equalizes all team coin totals so everyone is tied.',
        },
        boo_steal_5: {
          title: 'Boo Coin Steal',
          desc: 'Boo steals 5 coins from an opponent of your choice and gives them to your team!',
        },
        boo_steal_10: {
          title: 'King Boo Grand Heist',
          desc: 'King Boo swoops in and steals 10 coins from a rival team!',
        },
        super_star_x2: {
          title: 'Super Star Bonus',
          desc: 'Invincibility star! Grants instant bonus coins plus double value on your next turn.',
        },
        blue_shell: {
          title: 'Spiny Shell Strike',
          desc: 'Target the current 1st-place team and blast away their lead for a huge comeback!',
        },
        super_coins_10: {
          title: '10 Gold Coins Jackpot',
          desc: 'Treasure chest opened! Instant jackpot of 10 golden coins.',
        },
        mushroom_x2: {
          title: 'Double Mushroom',
          desc: 'Grants an immediate extra consecutive turn with doubled question rewards!',
        },
        hidden_block: {
          title: 'Lucky Hidden Block',
          desc: 'You uncovered a hidden block with surprise bonus coins!',
        },
      },
      testSoundLabel: 'TEST SOUND & EFFECT',
    },
    footer: {
      tagline: 'Super Mario Party • Classroom & Interactive Edition',
      playButton: "LET'S PLAY!",
    },
  },
  ja: {
    header: {
      title: 'ゲームの遊び方＆先生・司会者ガイド',
      subtitle: '授業やイベントをスムーズに進行するための完全マニュアル',
      close: '閉じる',
    },
    tabs: {
      guide: '先生・司会者ガイド',
      rules: 'ゲームのルール',
      cards: 'サプライズカード一覧',
    },
    hostGuide: {
      title: 'マリオパーティの授業・進行ガイド',
      subtitle: '初めて担当する先生や代理の先生でも、これさえ読めば迷わず盛り上げられるステップバイステップの解説です。',
      sections: [
        {
          id: 'step-1',
          title: '1. ゲームの準備とチーム設定',
          icon: 'Users',
          points: [
            '参加するチームを2〜6チーム（マリオ、ルイージ、ピーチ、デイジー、ヨッシー、ドンキーコング）から選びます。',
            '初期コイン数を「0、5、10、15、20枚」から設定します。テレサの横取りカードを序盤から楽しむため、5〜10枚でのスタートが一番おすすめです！',
            'テーマ選択：「Summer Edition（英語ESLクイズ60問）」または「Christmas Edition（冬・クリスマスホリデークイズ60問）」。どちらも5行×12列（計60問）のブロックで構成されています。',
          ],
          tip: 'ヒント：スタート画面でチーム名を自由に日本語や班名（例：1班、Red Team）に変更できます！',
        },
        {
          id: 'step-2',
          title: '2. ターンの進め方（全60ブロック）',
          icon: 'Gamepad2',
          points: [
            '現在の手番チームは画面上部のヘッダーおよびリーダーボードに大きく表示されます。',
            '手番のチームが、ボード上の1〜60番のハテナ・レンガブロックから好きな番号を1つ選びます。',
            'ブロックを押すと、英語クイズまたは6枚のサプライズカードルーレットが始まります。',
            '正解するとコインが加算され、ブロックが開いた状態になります。ターンは自動的に次のチームへ進みます。',
          ],
          tip: 'ヒント：手番をスキップしたい場合は「Pass（パス）」を押すか、リーダーボード上の別チームを直接タップすればいつでも手番を切り替えられます！',
        },
        {
          id: 'step-3',
          title: '3. 先生のスコア操作（＋ / − コイン）',
          icon: 'Sliders',
          points: [
            '先生・司会者は、いつでもリアルタイムにスコアを自由に変更できます！',
            '画面上の各チームカードにある「＋」や「−」ボタンを押すだけで、瞬時にコインを1枚ずつ増やしたり減らしたりできます。',
            '積極的な発言、綺麗な発音、班での助け合いに対するボーナスポイントとして大活躍します。',
          ],
          tip: 'ヒント：クッパ革命やテレサの奪取により、コインがマイナスになるスリリングな展開もサポートしています！',
        },
        {
          id: 'step-4',
          title: '4. クイズの種類と解き方',
          icon: 'HelpCircle',
          points: [
            '4択・画像クイズ：写真や問題文を見て、4つの選択肢（A, B, C, D）からチームで相談して正解を選びます。',
            'スペル並べ替え：バラバラになったアルファベットタイルを正しい順に押して英単語を完成させます。「Hint」や「1文字戻す」も使えます。',
            'オープン問題：知識やフリートークの問題です。「答えを表示」で正解を確認し、先生が「正解（＋コイン）」または「不正解」を押します。',
            'サプライズルーレット：ハテナブロックを引くと、2:3比率の美しい6枚のカードが出現！手番チームが1〜6の好きなカードを選びます。',
          ],
        },
        {
          id: 'step-5',
          title: '5. 問題のカスタマイズとクラウド保存',
          icon: 'Settings2',
          points: [
            'ヘッダーの「Edit（編集）」ボタンから、全60問の問題文、選択肢、画像URL、配点コインを自由に編集できます。',
            '右上のアカウントメニューからGoogleログインすれば、作成したオリジナル問題をクラウドに保存可能！',
            '別の教室のパソコンや電子黒板でも、ボタン1つで同じクイズを即座に読み込んで授業ができます。',
          ],
          tip: 'ヒント：「シャッフル」ボタンを押すと、問題やサプライズブロックの配置が瞬時にランダム変更されます！',
        },
        {
          id: 'step-6',
          title: '6. スーパースター（優勝決定）と表彰',
          icon: 'Trophy',
          points: [
            '全60ブロックが開いた時はもちろん、授業の終了時間に合わせていつでも「Superstar!」ボタンを押して結果発表ができます。',
            'ファンファーレ、表彰台アニメーション、舞い散る紙吹雪とともに優勝チームが盛大に祝福されます！',
          ],
        },
        {
          id: 'step-7',
          title: '7. 電子黒板・スマートボードでの便利なコツ',
          icon: 'Monitor',
          points: [
            'キーボードの「F11」キーを押すと、電子黒板いっぱいに広がる全画面モードになります。',
            'ヘッダーの内蔵音楽プレーヤーで、BGMの再生・一時停止・音量調節がいつでも手軽に行えます。',
            'タブレットやスマホ画面では、右上の「☰（ハンバーガーメニュー）」にすべての機能がスマートに収納されます。',
          ],
        },
      ],
    },
    gameRules: {
      title: 'ゲームの基本ルール',
      overview:
        'チームが交代でボード上の60個のブロックから1つを選びます。クイズに答えたり、サプライズカードを引き当ててマリオコインを集めよう！ゲーム終了時に最もコインが多かったチームが栄光の「スーパースター（優勝）」に輝きます！',
      questionTypesTitle: '問題とチャレンジのカテゴリー',
      questionTypes: [
        {
          title: '4択・画像クイズ',
          desc: 'イラストや問題文を見て、4つの選択肢の中から正解を見つけよう。',
          icon: '🖼️',
          color: 'border-amber-400/40 text-amber-300',
        },
        {
          title: 'スペル並べ替え',
          desc: 'バラバラになったアルファベットタイルを正しい順番でタップして英単語を完成させよう。',
          icon: '🔤',
          color: 'border-sky-400/40 text-sky-300',
        },
        {
          title: 'オープン問題・ディスカッション',
          desc: '自由解答やトリビア問題。先生が答え合わせをして判定します。',
          icon: '🎁',
          color: 'border-emerald-400/40 text-emerald-300',
        },
        {
          title: 'サプライズカードルーレット',
          desc: '6枚の裏向きカードから運命の1枚を選択！テレサの奪取やクッパ革命など大逆転のチャンス！',
          icon: '⭐',
          color: 'border-purple-400/40 text-purple-300',
        },
      ],
      scoringTitle: '得点・コインシステム',
      scoringPoints: [
        'ブロックの難易度や行によって1〜5枚の基本コインが設定されています。',
        '正解すると自動的にコインが加算されます。',
        '「スーパーキノコ（2倍）」を持っているチームは、次の問題で得られるコインが2倍になります！',
        '連続正解するとストリーク（連続記録）がカウントされます。',
      ],
      winningTitle: '勝利条件',
      winningDesc:
        'すべてのブロックが開いた時、または表彰ボタンを押した時点で、コイン獲得数1位のチームがスーパースターとなります！同点の場合は白熱の表彰式で讃え合おう！',
    },
    mysteryCards: {
      title: 'サプライズカード・テスターデッキ',
      subtitle: '下のカードをクリックすると、実際の効果音とゲーム内効果を試聴・テストできます。',
      instructions:
        'ハテナブロックを開くと、2:3のトランプ比率の6枚のカードが提示されます。手番のチームが1〜6番の中から1枚を選択します。デッキに含まれるカードの効果は以下の通りです：',
      deckInfo: '全8種類の特別カード',
      cardDescriptions: {
        bowser_revolution: {
          title: 'クッパ革命',
          desc: 'クッパが登場！全チームの所持コインを合計して均等に再分配し、全員同点にします！',
        },
        boo_steal_5: {
          title: 'テレサのコイン強奪（5枚）',
          desc: 'ライバルチームを指名して、そのチームからコインを5枚奪い取ります！',
        },
        boo_steal_10: {
          title: 'キングテレサの大強奪（10枚）',
          desc: 'キングテレサが襲来！指定した相手チームからコインを一気に10枚奪取！',
        },
        super_star_x2: {
          title: 'スーパースターボーナス',
          desc: '無敵のスター！即座にボーナスコインを獲得し、次のターンの配点が2倍になります。',
        },
        blue_shell: {
          title: 'トゲゾーこうら直撃',
          desc: '現在1位を走るトップチームに直撃！リードを削り落とす大逆転アイテム！',
        },
        super_coins_10: {
          title: 'ゴールドコイン10枚ジャックポット',
          desc: '宝箱オープン！その場で10枚のコインを一挙に手に入れます。',
        },
        mushroom_x2: {
          title: 'スーパーキノコ（2倍連続ターン）',
          desc: '連続でもう一度ターンを実行でき、さらに問題の配点コインが2倍になります！',
        },
        hidden_block: {
          title: 'ラッキー隠しブロック',
          desc: '隠されたブロックを発見！ラッキーなボーナスコインを獲得します。',
        },
      },
      testSoundLabel: '効果音と効果をテスト',
    },
    footer: {
      tagline: 'スーパーマリオパーティ • 授業＆パーティー体験エディション',
      playButton: 'ゲームを始める！',
    },
  },
};
