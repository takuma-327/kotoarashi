/**
 * 地鶏家 琴嵐 天満店 - 多言語翻訳辞書 ＆ 大将経歴スロット制御スクリプト
 */

// ==========================================================================
// 🌐 多言語辞書データ (日本語 / 英語 / 中国語 / 韓国語 / ネパール語)
// ==========================================================================
const dictionary = {
  ja: {
      branch: "天満店",
      nav_about: "こだわり",
      nav_slot: "大将おみくじ",
      nav_menu: "お品書き",
      nav_access: "アクセス",
      catchphrase: "暖簾の先に、<br>佐渡ヶ嶽部屋直伝の味が待っている。",
      about_title: "琴嵐のこだわり",
      about_card1_title: "直伝の至高スープ",
      about_card1_text: "鶏ガラをふんだんに使い、じっくりと炊き出したコクのあるスープ。一口飲めば体に染み渡る、本物のちゃんこ・もつ鍋をどうぞ。",
      about_card2_title: "元力士の店主が炊き出す",
      about_card2_text: "同期には錚々たるメンバー。お相撲さんしか知らない「本物の味」と「世界の話」を、美味しいお酒と共にお楽しみいただけます。",
      slot_title: "大将の経歴おみくじ",
      slot_intro: "【激アツ演出】ボタンを押して大将の経歴を狙え！スクショして「大将スマイル」が出たらラッキー！",
      card1_badge: "四股名",
      card1_title: "元・琴嵐",
      card1_text: "名門·佐渡ヶ嶽部屋の系譜を継ぐ元力士。お相撲さんしか知らない「本物の味」を天満にお届け！",
      card2_badge: "最高位",
      card2_title: "西十両三枚目",
      card2_text: "関取まで上り詰めた実力派。現役時代の激闘のスピリットが、この天満の暖簾に受け継がれている！",
      card3_badge: "こだわり",
      card3_title: "秘伝のスープを炊き出す男",
      card3_text: "鶏ガラをふんだんに使い、じっくりと炊き出したコクのある至高スープ。一口飲めば体に染み渡る本物の味。",
      card4_badge: "⚡超激レア⚡",
      card4_title: "大将のスマイル",
      card4_text: "【超大吉！】普段は寡黙な大将の極上スマイルが炸裂！これを見られた今日は最高の夜になるはず。",
      card5_badge: "大入り",
      card5_title: "満員御礼！",
      card5_text: "琴嵐の夜はいつも大賑わい！美味しいお酒と旨いちゃんこを囲んで、みんなで元気に「ごっつあんです！」",
      btn_start: "スタート！",
      btn_stop: "ストップ！！！",
      btn_retry: "もう一回まわす",
      hoshitori_title: "本場所星取表",
      hoshitori_intro: "千秋楽はみんなで見よう！！",
      hoshitori_note: "現在開催中の本場所リアルタイム星取・最新の取組結果は、<br>日本相撲協会公式サイトにてご確認いただけます。",
      btn_hoshitori: "🏆 日本相撲協会 公式サイトで星取を見る",
      menu_title: "お品書き",
      menu_cat1: "◆ 佐渡ヶ嶽部屋直伝・お鍋",
      m_chanko: "ちゃんこ鍋（1人前）",
      m_sop: "ソップ炊きちゃんこ鍋（1人前・しょうゆ味）",
      m_shio: "塩ちゃんこ鍋（1人前）",
      m_spicy: "ピリ辛ちゃんこ鍋（1人前）",
      m_motsu: "もつ鍋（1人前）（塩・ピリ辛・しょうゆ）",
      m_seafood: "魚介入りスペシャルちゃんこ鍋（1人前）",
      menu_note: "※〆の雑炊・ラーメン（各530円）、リゾット（590円※塩のみ）もございます。",
      menu_cat2: "◆ 炭火串焼き（一皿二串）",
      m_skewers_all: "380円均一串（せせり・ねぎま・きも・かわ・ずり・三角など）",
      m_breast: "鳥むね（しお・チーズ・梅じそ）",
      m_tsukune: "つくね（2串）",
      m_wing: "手羽先",
      m_pork: "豚バラ",
      m_assort: "串焼き盛合わせ（8本）",
      menu_cat3: "◆ お造り・一品",
      m_tataki: "鳥むねのたたき",
      m_sashimi: "鳥のお造り盛合わせ",
      m_fried_wing: "名物 琴嵐の手羽先揚げ",
      m_kushikatsu: "串カツ5本盛り",
      m_special_liver: "きもスペシャル / ずりスペシャル（半生炙り）",
      m_kamameshi: "鳥ごぼう釜めし",
      access_title: "アクセス・店舗情報",
      address: "📍 〒530-0041 大阪府大阪市北区天神橋４丁目１０−５ 上野ビル",
      station: "🚉 天満駅から徒歩すぐ",
      btn_reservation: "予約・空席状況（食べログへ）",
      footer_title: "地鶏家 琴嵐 天満店",
      footer_address: "大阪府大阪市北区天満エリア（天神橋筋六丁目・天満駅近く）",
      footer_hours: "※営業時間・定休日はお電話にてお問い合わせください。",
      game_btn: "🎮 琴嵐 ゲイム",
      game_instruction: "PC: ← →キー（移動） / Space（連射）<br>スマホ: 画面スライド（移動＆自動連射）"
  },
  en: {
      branch: "Tenma Branch",
      nav_about: "About Us",
      nav_slot: "Master Slot",
      nav_menu: "Menu",
      nav_access: "Access",
      catchphrase: "Behind the curtain awaits<br>authentic sumo-style Chanko Nabe.",
      about_title: "Our Commitment",
      about_card1_title: "Traditional Supreme Broth",
      about_card1_text: "Rich chicken broth slowly simmered using abundant chicken bones. Enjoy authentic Chanko and Motsu hotpots that warm your body and soul.",
      about_card2_title: "Cooked by a Former Sumo Wrestler",
      about_card2_text: "The owner is a former wrestler who trained among elite peers. Experience authentic flavors and sumo stories over fine drinks.",
      slot_title: "Master's Career Slot",
      slot_intro: "[Super Exciting!] Press the button to spin! Get the rare 'Master Smile' for good luck!",
      card1_badge: "Sumo Name",
      card1_title: "Ex-Kotoarashi",
      card1_text: "Former wrestler from the prestigious Sadogatake Stable, bringing true sumo recipes straight to Tenma!",
      card2_badge: "Highest Rank",
      card2_title: "West Juryo #3",
      card2_text: "A highly skilled wrestler who rose to Juryo division. Fighting spirit lives on in every dish!",
      card3_badge: "Specialty",
      card3_title: "Master of Secret Broth",
      card3_text: "Crafted with richness and depth through hours of simmering chicken bones.",
      card4_badge: "⚡Ultra Rare⚡",
      card4_title: "Master's Smile",
      card4_text: "[Super Lucky!] A rare, bright smile from our usually quiet Master! You're guaranteed a wonderful night!",
      card5_badge: "Full House",
      card5_title: "Packed House!",
      card5_text: "Always lively at Kotoarashi! Enjoy delicious food, drinks, and shout 'Gottsuandesu!'",
      btn_start: "START!",
      btn_stop: "STOP!!!",
      btn_retry: "SPIN AGAIN",
      hoshitori_title: "Grand Sumo Tournament Results",
      hoshitori_intro: "Let's watch the final day together!!",
      hoshitori_note: "Check real-time sumo tournament standings and match results on the official Japan Sumo Association website.",
      btn_hoshitori: "🏆 View Results on Japan Sumo Association Official Site",
      menu_title: "Menu",
      menu_cat1: "◆ Authentic Sumo Hotpot (Chanko Nabe)",
      m_chanko: "Chanko Nabe (1 serving)",
      m_sop: "Soy Sauce Chanko Nabe (1 serving)",
      m_shio: "Salt Chanko Nabe (1 serving)",
      m_spicy: "Spicy Chanko Nabe (1 serving)",
      m_motsu: "Beef Offal Hotpot (Motsu Nabe) (Salt / Spicy / Soy)",
      m_seafood: "Special Seafood Chanko Nabe (1 serving)",
      menu_note: "*Finishing options: Rice porridge or Ramen (530 yen each), Risotto (590 yen, salt only).",
      menu_cat2: "◆ Charcoal Grilled Skewers (2 skewers per order)",
      m_skewers_all: "380 Yen Uniform Skewers (Neck, Chicken & Green Onion, Liver, Skin, Gizzard, etc.)",
      m_breast: "Chicken Breast Skewer (Salt / Cheese / Plum Perilla)",
      m_tsukune: "Chicken Meatballs (2 skewers)",
      m_wing: "Chicken Wings",
      m_pork: "Pork Belly Skewer",
      m_assort: "Assorted Skewers (8 pcs)",
      menu_cat3: "◆ Sashimi & Ala Carte",
      m_tataki: "Seared Chicken Breast",
      m_sashimi: "Assorted Chicken Sashimi",
      m_fried_wing: "Famous Kotoarashi Deep-Fried Wings",
      m_kushikatsu: "Deep-Fried Skewers Assortment (5 pcs)",
      m_special_liver: "Special Lightly Seared Liver / Gizzard",
      m_kamameshi: "Chicken & Burdock Rice Pot",
      access_title: "Access & Store Info",
      address: "📍 Ueno Bldg, 4-10-5 Tenjinbashi, Kita-ku, Osaka",
      station: "🚉 Short walk from JR Tenma Station",
      btn_reservation: "Reserve / Check Seats (Tabelog)",
      footer_title: "Jidoriya Kotoarashi Tenma",
      footer_address: "Tenma Area, Kita-ku, Osaka City (Near Tenjinbashisuji 6-chome & Tenma Station)",
      footer_hours: "*Please call us for opening hours and holidays.",
      game_btn: "🎮 Kotoarashi Game",
      game_instruction: "PC: ← → Keys (Move) / Space (Shoot)<br>Mobile: Drag screen (Move & Auto-shoot)"
  },
  zh: {
      branch: "天满店",
      nav_about: "匠心特色",
      nav_slot: "店主运势",
      nav_menu: "菜单一览",
      nav_access: "店铺交通",
      catchphrase: "掀开门帘，<br>佐渡岳部屋相扑火锅在此等候。",
      about_title: "琴岚的匠心独运",
      about_card1_title: "秘传至尊鸡汤",
      about_card1_text: "大量使用优质鸡骨，慢火悉心熬制出的浓郁高汤。一口入喉温润通透，请尽情品味正宗相扑锅与牛杂锅。",
      about_card2_title: "原相扑力士店主亲制",
      about_card2_text: "同期好友星光熠熠。在这里，您可以一边品尝美酒，一边倾听唯有相扑力士才知晓的「正宗滋味」与「相扑界的秘闻逸事」。",
      slot_title: "店主相扑履历运势机",
      slot_intro: "【超级大奖】按下按钮锁定店主履历！抽中「店主笑容」今天必定大吉！",
      card1_badge: "四股名（相扑名）",
      card1_title: "前力士·琴岚",
      card1_text: "继承名门佐渡岳部屋血统的前力士。将相扑力士独享的「正宗相扑味」原汁原味带到天满！",
      card2_badge: "最高段位",
      card2_title: "西十两三枚目",
      card2_text: "晋升至关取（十两以上）的实力派。现役时代奋战不息的精神，完美融入天满的这一方门帘之中！",
      card3_badge: "独门绝技",
      card3_title: "熬制秘传高汤的男人",
      card3_text: "精选鸡骨熬制出的浓厚高汤，每一滴都浸透心脾的极致滋味。",
      card4_badge: "⚡超级稀有⚡",
      card4_title: "店主的极品笑容",
      card4_text: "【大吉登顶！】平时沉默寡言的店主绽放极品笑容！能看到这一幕的您，今晚注定是绝妙之夜。",
      card5_badge: "高朋满座",
      card5_title: "满员御礼！",
      card5_text: "琴岚的夜晚总是热闹非凡！围着美酒与绝品相扑锅，大家一起爽朗地喊一声「ごっつあんです（多谢款待）！」",
      btn_start: "开始抽奖！",
      btn_stop: "停！！！",
      btn_retry: "再转一次",
      hoshitori_title: "大相扑本场所星取表",
      hoshitori_intro: "千秋乐（决赛日）大家一起来看！！",
      hoshitori_note: "正在举行的大相扑本场所实时星取榜与最新对阵结果，<br>可前往日本相扑协会官方网站查看。",
      btn_hoshitori: "🏆 在日本相扑协会官网查看星取",
      menu_title: "美味菜单",
      menu_cat1: "◆ 佐渡岳部屋直传・相扑锅",
      m_chanko: "经典相扑锅（1人份）",
      m_sop: "酱油清鸡汤相扑锅（1人份）",
      m_shio: "盐味相扑锅（1人份）",
      m_spicy: "微辣相扑锅（1人份）",
      m_motsu: "牛杂锅（1人份）（盐味·微辣·酱油）",
      m_seafood: "海鲜特别相扑锅（1人份）",
      menu_note: "※提供餐后收尾杂炊粥·拉面（各530日元）、意式烩饭（590日元※仅限盐味）。",
      menu_cat2: "◆ 炭火烤串（一份两串）",
      m_skewers_all: "380日元均一烤串（鸡颈肉、葱肉相间、鸡肝、鸡皮、鸡胗、三角等）",
      m_breast: "鸡胸肉串（盐味·芝士·梅子紫苏）",
      m_tsukune: "自制鸡肉丸（2串）",
      m_wing: "炭烤鸡翅",
      m_pork: "烤五花肉",
      m_assort: "烤串拼盘（8串）",
      menu_cat3: "◆ 刺身・特色单品",
      m_tataki: "炙烤半熟鸡胸肉",
      m_sashimi: "地鸡生鱼片拼盘",
      m_fried_wing: "名物 琴岚炸鸡翅",
      m_kushikatsu: "炸串5串拼盘",
      m_special_liver: "特选鸡肝 / 特选鸡胗（微炙半熟）",
      m_kamameshi: "鸡肉牛蒡釜饭",
      access_title: "交通及店铺信息",
      address: "📍 〒530-0041 大阪府大阪市北区天神桥4丁目10−5 上野大厦",
      station: "🚉 JR天满站出站步行即达",
      btn_reservation: "预订・空位查询（前往Tabelog）",
      footer_title: "地鸡家 琴岚 天满店",
      footer_address: "大阪府大阪市北区天满地区（近天神桥筋六丁目・天满站）",
      footer_hours: "※营业时间与定休日请致电咨询。",
      game_btn: "🎮 琴岚小游戏",
      game_instruction: "PC: ← →键（移动） / Space（连发射击）<br>手机: 滑动屏幕（移动并自动射击）"
  },
  ko: {
      branch: "텐마점",
      nav_about: "특징과 고집",
      nav_slot: "주방장 슬롯",
      nav_menu: "메뉴판",
      nav_access: "오시는 길",
      catchphrase: "노렌 너머로,<br>사도가타케베야 직전의 맛이 기다립니다.",
      about_title: "코토아라시의 고집",
      about_card1_title: "비전의 최고급 육수",
      about_card1_text: "닭뼈를 아낌없이 사용하여 정성껏 우려낸 깊고 진한 육수. 한 모금에 온몸으로 전해지는 정통 창코나베와 모츠나베를 맛보세요.",
      about_card2_title: "전직 스모 선수가 끓여내는 맛",
      about_card2_text: "동기 중 쟁쟁한 멤버 다수. 스모 선수만이 아는 '진짜 맛'과 '현역 시절 이야기'를 맛있는 술과 함께 즐기실 수 있습니다.",
      slot_title: "주방장 이력 슬롯 오미쿠지",
      slot_intro: "【초특급 연출】버튼을 눌러 주방장의 이력을 노려보세요! '주방장 스마일'이 나오면 대박!",
      card1_badge: "선수명 (시코나)",
      card1_title: "전직 스모선수 코토아라시",
      card1_text: "명문 사도가타케베야의 계보를 잇는 전직 스모 선수. 스모 선수들만 아는 '진짜 맛'을 텐마로 전해드립니다!",
      card2_badge: "최고 위치",
      card2_title: "서쪽 쥬료 3위",
      card2_text: "세키토리(상위 랭커)까지 올라간 실력파. 현역 시절의 격투 정신이 텐마의 주방에 고스란히 계승되었습니다!",
      card3_badge: "장인 정신",
      card3_title: "비전 육수를 끓여내는 장인",
      card3_text: "닭뼈를 듬뿍 넣어 오랜 시간 푹 우려낸 깊은 감칠맛의 육수. 한 입만 마셔도 몸에 스며드는 진정한 맛.",
      card4_badge: "⚡초희귀 레어⚡",
      card4_title: "주방장의 백만불짜리 미소",
      card4_text: "【초대길!】평소 과묵한 주방장의 스마일 대폭발! 이걸 보셨다면 오늘 밤은 최고의 하루가 될 것입니다.",
      card5_badge: "만원사례",
      card5_title: "만석 (만원사례)!",
      card5_text: "코토아라시의 밤은 언제나 활기찹니다! 맛있는 술과 전골을 둘러싸고 다 함께 힘차게 외쳐보세요, '곳츠안데스'!",
      btn_start: "스타트!",
      btn_stop: "스톱!!!",
      btn_retry: "한 번 더 돌리기",
      hoshitori_title: "스모 본장소 성적표",
      hoshitori_intro: "센슈라쿠(마지막 날)는 다 함께 봅시다!!",
      hoshitori_note: "현재 개최 중인 스모 본장소 실시간 성적 및 최신 대진 결과는<br>일본 스모 협회 공식 사이트에서 확인하실 수 있습니다.",
      btn_hoshitori: "🏆 일본 스모 협회 공식 사이트에서 성적 보기",
      menu_title: "메뉴판",
      menu_cat1: "◆ 사도가타케베야 직전 · 전골(나베)",
      m_chanko: "창코나베 (1인분)",
      m_sop: "소프타키 창코나베 (1인분 · 간장맛)",
      m_shio: "시오(소금) 창코나베 (1인분)",
      m_spicy: "매콤 창코나베 (1인분)",
      m_motsu: "모츠나베(곱창전골) (1인분) (소금/매콤/간장)",
      m_seafood: "해물 스페셜 창코나베 (1인분)",
      menu_note: "※마무리 죽·라멘(각 530엔), 리조또(590엔※시오맛 한정)도 준비되어 있습니다.",
      menu_cat2: "◆ 숯불 꼬치구이 (1접시 2꼬치)",
      m_skewers_all: "380엔 균일 꼬치 (세세리/파닭/간/껍질/똥집/엉덩이살 등)",
      m_breast: "닭가슴살 (소금/치즈/우메시소)",
      m_tsukune: "츠쿠네 완자 (2꼬치)",
      m_wing: "닭날개 (테바사키)",
      m_pork: "돼지 삼겹살",
      m_assort: "모둠 꼬치구이 (8꼬치)",
      menu_cat3: "◆ 사시미 · 단품 요리",
      m_tataki: "닭가슴살 타타키",
      m_sashimi: "닭 모둠 사시미",
      m_fried_wing: "명물 코토아라시 닭날개 튀김",
      m_kushikatsu: "쿠시카츠 5종 모둠",
      m_special_liver: "키모(간) 스페셜 / 즈리(모래집) 스페셜 (하프 레어)",
      m_kamameshi: "닭고기 우엉 가마솥밥",
      access_title: "오시는 길 & 매장 정보",
      address: "📍 〒530-0041 오사카부 오사카시 기타구 텐진바시 4-10-5 우에노 빌딩",
      station: "🚉 JR 텐마역 도보 바로 앞",
      btn_reservation: "예약 및 빈자리 확인 (타베로그)",
      footer_title: "지도리야 코토아라시 텐마점",
      footer_address: "오사카부 오사카시 기타구 텐마 지역 (텐진바시스지로쿠초메/텐마역 인근)",
      footer_hours: "※영업시간 및 정기휴일은 전화로 문의해 주시기 바랍니다.",
      game_btn: "🎮 코토아라시 게임",
      game_instruction: "PC: ← → 키(이동) / Space(연사)<br>스마트폰: 화면 슬라이드(이동 및 자동 연사)"
  },
  ne: {
      branch: "तेन्मा शाखा",
      nav_about: "विशेषता",
      nav_slot: "मालिकको भाग्य",
      nav_menu: "मेनु",
      nav_access: "लोकेसन",
      catchphrase: "पर्दा पछाडि,<br>साडोगाताके सुमो अखडाको असली स्वाद प्रतीक्षा गर्दैछ।",
      about_title: "कोतोआराशीको विशेषता",
      about_card1_title: "परम्परागत उत्कृष्ट सुप",
      about_card1_text: "कुखुराको हड्डीबाट बिस्तारै पकाइएको गहिरो स्वादिलो सुप। एक घुट्कोमै मन प्रफुल्ल बनाउने असली चान्को र मोत्सु नाबेको मजा लिनुहोस्।",
      about_card2_title: "पूर्व सुमो पहलवानद्वारा निर्मित",
      about_card2_text: "पूर्व सुमो खेलाडी मालिकले तयार पार्नुभएको परम्परागत स्वाद। मीठो रक्सीका साथ सुमो संसारका चाखलाग्दा कथाहरू सुन्नुहोस्।",
      slot_title: "मालिकको सुमो इतिहास स्लट",
      slot_intro: "【अत्यन्तै रोमाञ्चक!】 बटन थिचेर मालिकको इतिहास हेर्नुहोस्! 'मालिकको मुस्कान' आएमा भाग्यशाली!",
      card1_badge: "सुमो नाम",
      card1_title: "पूर्व-कोतोआराशी",
      card1_text: "प्रसिद्ध साडोगाताके अखडाका पूर्व सुमो पहलवान। तेन्मामा असली सुमो स्वाद पस्कँदै!",
      card2_badge: "सर्वोच्च स्थान",
      card2_title: "पश्चिम जुर्यो ३ औं",
      card2_text: "उच्च तहसम्म पुग्न सफल उत्कृष्ट सुमो खेलाडी। उहाँको सुमो भावना यस रेस्टुरेन्टमा झल्किन्छ!",
      card3_badge: "विशेषता",
      card3_title: "गोप्य सुप पकाउने व्यक्ति",
      card3_text: "कुखुराको हड्डीबाट बिस्तारै पकाइएको गहिरो, पोषिलो र स्वादिलो सुप।",
      card4_badge: "⚡अत्यन्तै दुर्लभ⚡",
      card4_title: "मालिकको मुस्कान",
      card4_text: "【अति भाग्यशाली!】 शान्त स्वभावका मालिकको विशेष मुस्कान! यो देख्नुभयो भने आजको साँझ उत्कृष्ट हुनेछ।",
      card5_badge: "भरिभराउ",
      card5_title: "ग्राहकले भरिभराउ!",
      card5_text: "कोतोआराशीमा सधैं रमाइलो माहोल! मीठो परिकार र पेय पदार्थका साथ सबै मिली खुसी मनाऔं!",
      btn_start: "सुरु गर्नुहोस्!",
      btn_stop: "रोक्नुहोस्!!!",
      btn_retry: "पुनः घुमाउनुहोस्",
      hoshitori_title: "सुमो प्रतियोगिताको नतिजा",
      hoshitori_intro: "अन्तिम दिन सबैजना मिलेर हेरौं!!",
      hoshitori_note: "हाल चलिरहेको सुमो प्रतियोगिताको ताजा नतिजा जापान सुमो संघको आधिकारिक वेबसाइटमा हेर्न सक्नुहुन्छ।",
      btn_hoshitori: "🏆 जापान सुमो संघको आधिकारिक साइटमा हेर्नुहोस्",
      menu_title: "मेनु",
      menu_cat1: "◆ सुमो परम्परागत हटपट (चान्को नाबे)",
      m_chanko: "चान्को नाबे (१ जनाको लागि)",
      m_sop: "सोया सस चान्को नाबे (१ जनाको लागि)",
      m_shio: "नुनिलो (सियो) चान्को नाबे (१ जनाको लागि)",
      m_spicy: "पिरो चान्को नाबे (१ जनाको लागि)",
      m_motsu: "मोत्सु नाबे (बफ/पोर्क आन्द्रा हटपट)",
      m_seafood: "सीफूड विशेष चान्को नाबे (१ जनाको लागि)",
      menu_note: "*अन्तिममा भात (जाउलो), रामेन चाउचाउ वा रिजोटो पनि थप्न सकिन्छ।",
      menu_cat2: "◆ कोइलामा पोलिएको सेकुवा (याकितोरी - २ सिन्का)",
      m_skewers_all: "३८० येनका सेकुवाहरू (गर्दन, पोलेको कुखुरा र प्याज, कलेजो, छाला आदि)",
      m_breast: "कुखुराको छातीको मासु (नुन / चिज / मकै)",
      m_tsukune: "कुखुराको मःमः शैली किमा सेकुवा (२ सिन्का)",
      m_wing: "कुखुराको पखेटा (तेबासाकी)",
      m_pork: "बंगुरको मासुको सेकुवा",
      m_assort: "मिक्स सेकुवा थाली (८ सिन्का)",
      menu_cat3: "◆ सासिमी र विशेष परिकार",
      m_tataki: "हल्का पोलिएको कुखुराको छातीको मासु",
      m_sashimi: "मिक्स चिकेन सासिमी थाली",
      m_fried_wing: "प्रसिद्ध कोतोआराशी फ्राइड चिकेन पखेटा",
      m_kushikatsu: "कुशिकात्सु मिक्स (५ सिन्का)",
      m_special_liver: "विशेष सेमी-रोस्ट कलेजो",
      m_kamameshi: "चिकेन र गोबो राइस पट (कामामेसी)",
      access_title: "लोकेसन र पसलको जानकारी",
      address: "📍 ओसाका-फु, ओसाका-शी, किता-कु, तेन्जिनबासी ४-१०-५ उएनो बिल्डिङ",
      station: "🚉 तेन्मा स्टेसनबाट नजिकै",
      btn_reservation: "सिट बुक गर्नुहोस् (Tabelog)",
      footer_title: "जिदोरीया कोतोआराशी तेन्मा",
      footer_address: "ओसाका, तेन्मा क्षेत्र (तेन्जिनबासीसुजी ६-चोमे / तेन्मा स्टेसन नजिक)",
      footer_hours: "*खुलने समय र बिदाको लागि कृपया फोन गर्नुहोस्।",
      game_btn: "🎮 कोतोआराशी गेम",
      game_instruction: "PC: ← → कि (चलाउनुहोस्) / Space (हान्नुहोस्)<br>मोबाइल: स्क्रिन स्लाइड (चलाउनुहोस् र अटो हान्नुहोस्)"
  }
};

// ==========================================================================
// 🌐 多言語切り替え制御
// ==========================================================================
function selectLanguage(lang) {
  const overlay = document.getElementById('lang-overlay');
  if (overlay) overlay.classList.add('hidden');

  const select = document.getElementById('lang-select');
  if (select) select.value = lang;

  localStorage.setItem('kotoarashi_lang', lang);

  const langData = dictionary[lang] || dictionary['ja'];
  document.querySelectorAll('[data-i18n]').forEach(elem => {
      const key = elem.getAttribute('data-i18n');
      if (langData[key]) {
          elem.innerHTML = langData[key];
      }
  });

  const slotBtn = document.getElementById('btn-slot-control');
  if (slotBtn) {
      if (isSpinning) {
          slotBtn.textContent = langData.btn_stop || 'ストップ！！！';
      } else if (hasSpun) {
          slotBtn.textContent = langData.btn_retry || 'もう一回まわす';
      } else {
          slotBtn.textContent = langData.btn_start || 'スタート！';
      }
  }
}

// ==========================================================================
// 🔊 Web Audio API（シンセ効果音）
// ==========================================================================
let audioCtx = null;
function getAudioContext() {
  if (!audioCtx) {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  if (audioCtx.state === 'suspended') {
      audioCtx.resume();
  }
  return audioCtx;
}

function playTickSound() {
  try {
      const ctx = getAudioContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(440, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(110, ctx.currentTime + 0.04);
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.04);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.04);
  } catch (e) {}
}

function playStopSound() {
  try {
      const ctx = getAudioContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'square';
      osc.frequency.setValueAtTime(220, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(80, ctx.currentTime + 0.1);
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.1);
  } catch (e) {}
}

function playJackpotFanfare() {
  try {
      const ctx = getAudioContext();
      const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
      notes.forEach((freq, i) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(freq, ctx.currentTime + (i * 0.12));
          gain.gain.setValueAtTime(0.3, ctx.currentTime + (i * 0.12));
          gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + (i * 0.12) + 0.4);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(ctx.currentTime + (i * 0.12));
          osc.stop(ctx.currentTime + (i * 0.12) + 0.4);
      });
  } catch (e) {}
}

// ==========================================================================
// 🎰 スロット制御ロジック
// ==========================================================================
let cards = [];
let slotBtn = null;
let screen = null;

let currentIndex = 0;
let isSpinning = false;
let isStopping = false;
let hasSpun = false;
let spinTimer = null;
const spinSpeed = 80;

function showCard(index) {
  cards.forEach((card, i) => {
      if (i === index) {
          card.style.display = 'flex';
          setTimeout(() => card.classList.add('active'), 10);
      } else {
          card.classList.remove('active');
          card.style.display = 'none';
      }
  });
}

function nextCard() {
  currentIndex = (currentIndex + 1) % cards.length;
  showCard(currentIndex);
  playTickSound();
  if (screen) screen.classList.toggle('flash');
}

function startSpin() {
  isSpinning = true;
  isStopping = false;
  hasSpun = true;
  if (slotBtn) {
      slotBtn.disabled = false;
      const currentLang = document.getElementById('lang-select')?.value || 'ja';
      slotBtn.textContent = (dictionary[currentLang] || dictionary['ja']).btn_stop || 'ストップ！！！';
      slotBtn.className = 'btn-slot stop';
  }

  clearInterval(spinTimer);
  spinTimer = setInterval(nextCard, spinSpeed);
}

function stopSpin() {
  if (isStopping) return;
  isStopping = true;
  if (slotBtn) slotBtn.disabled = true;

  clearInterval(spinTimer);
  if (screen) screen.classList.remove('flash');

  const slowdownSteps = [150, 260, 420];
  let step = 0;

  function runDeceleration() {
      if (step < slowdownSteps.length) {
          nextCard();
          setTimeout(runDeceleration, slowdownSteps[step]);
          step++;
      } else {
          isSpinning = false;
          isStopping = false;
          if (slotBtn) {
              slotBtn.disabled = false;
              const currentLang = document.getElementById('lang-select')?.value || 'ja';
              slotBtn.textContent = (dictionary[currentLang] || dictionary['ja']).btn_retry || 'もう一回まわす';
              slotBtn.className = 'btn-slot start';
          }

          if (cards[currentIndex]?.classList.contains('special-card')) {
              if (screen) {
                  screen.classList.add('shake');
                  setTimeout(() => screen.classList.remove('shake'), 800);
              }
              playJackpotFanfare();
          } else {
              playStopSound();
          }
      }
  }
  runDeceleration();
}

// ==========================================================================
// 初期化＆イベントリスナー登録
// ==========================================================================
window.addEventListener('DOMContentLoaded', () => {
  cards = document.querySelectorAll('.slot-card');
  slotBtn = document.getElementById('btn-slot-control');
  screen = document.getElementById('slot-screen');

  if (cards.length > 0) {
      showCard(currentIndex);
  }

  if (slotBtn) {
      slotBtn.addEventListener('click', () => {
          getAudioContext();
          if (!isSpinning) {
              startSpin();
          } else {
              stopSpin();
          }
      });
  }

  const savedLang = localStorage.getItem('kotoarashi_lang');
  if (savedLang && dictionary[savedLang]) {
      selectLanguage(savedLang);
  }

  // ゲームモーダル連携
  const trigger = document.getElementById('game-trigger');
  const modal = document.getElementById('game-modal');
  const closeBtn = document.getElementById('game-close-btn');

  if (trigger && modal) {
      trigger.addEventListener('click', () => {
          modal.classList.add('active');
          if (typeof initGame === 'function') {
              initGame();
          }
      });
  }

  if (closeBtn && modal) {
      closeBtn.addEventListener('click', () => {
          modal.classList.remove('active');
          if (typeof window.stopGame === 'function') {
              window.stopGame();
          }
      });
  }

  if (modal) {
      modal.addEventListener('click', (e) => {
          if (e.target === modal) {
              modal.classList.remove('active');
              if (typeof window.stopGame === 'function') {
                  window.stopGame();
              }
          }
      });
  }
});
