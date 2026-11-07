/* 語音基礎資料：聲母、韻母、聲調、變調、粵語母語者難點 */
window.PY = {
  initials: [
    { p:'b', ex:'爸', py:'bà', tip:'不送氣，像粵語「巴」' },
    { p:'p', ex:'怕', py:'pà', tip:'送氣，紙條會被吹動' },
    { p:'m', ex:'媽', py:'mā', tip:'同粵語' },
    { p:'f', ex:'發', py:'fā', tip:'上齒輕觸下唇' },
    { p:'d', ex:'大', py:'dà', tip:'不送氣' },
    { p:'t', ex:'他', py:'tā', tip:'送氣' },
    { p:'n', ex:'那', py:'nà', tip:'鼻音，勿讀成 l' },
    { p:'l', ex:'拉', py:'lā', tip:'邊音，舌尖抵上齒齦' },
    { p:'g', ex:'哥', py:'gē', tip:'舌根不送氣' },
    { p:'k', ex:'科', py:'kē', tip:'舌根送氣' },
    { p:'h', ex:'喝', py:'hē', tip:'舌根擦音，比粵語「喝」較輕' },
    { p:'j', ex:'雞', py:'jī', tip:'舌面，近粵語「知」但更前' },
    { p:'q', ex:'七', py:'qī', tip:'舌面送氣' },
    { p:'x', ex:'西', py:'xī', tip:'舌面擦音，近「詩」但舌位前' },
    { p:'zh', ex:'知', py:'zhī', tip:'舌尖後，翹舌' },
    { p:'ch', ex:'吃', py:'chī', tip:'翹舌送氣' },
    { p:'sh', ex:'詩', py:'shī', tip:'翹舌擦音' },
    { p:'r', ex:'日', py:'rì', tip:'翹舌濁擦音，勿讀成 j 或 y' },
    { p:'z', ex:'字', py:'zì', tip:'舌尖前，平舌' },
    { p:'c', ex:'詞', py:'cí', tip:'平舌送氣' },
    { p:'s', ex:'思', py:'sī', tip:'平舌擦音' }
  ],
  finals: {
    '單韻母': [
      { p:'a', ex:'啊' }, { p:'o', ex:'哦' }, { p:'e', ex:'鵝' },
      { p:'i', ex:'衣' }, { p:'u', ex:'烏' }, { p:'ü', ex:'魚' },
      { p:'er', ex:'兒' }
    ],
    '複韻母': [
      { p:'ai', ex:'愛' }, { p:'ei', ex:'欸' }, { p:'ao', ex:'襖' }, { p:'ou', ex:'歐' },
      { p:'ia', ex:'呀' }, { p:'ie', ex:'耶' }, { p:'ua', ex:'蛙' }, { p:'uo', ex:'窩' },
      { p:'üe', ex:'約' }, { p:'iao', ex:'腰' }, { p:'iou', ex:'優' },
      { p:'uai', ex:'歪' }, { p:'uei', ex:'威' }
    ],
    '鼻韻母': [
      { p:'an', ex:'安' }, { p:'en', ex:'恩' }, { p:'in', ex:'音' },
      { p:'un', ex:'溫' }, { p:'ün', ex:'暈' },
      { p:'ang', ex:'昂' }, { p:'eng', ex:'燈' }, { p:'ing', ex:'英' },
      { p:'ong', ex:'鐘' },
      { p:'ian', ex:'煙' }, { p:'uan', ex:'彎' }, { p:'üan', ex:'冤' },
      { p:'iang', ex:'央' }, { p:'uang', ex:'汪' }, { p:'iong', ex:'雍' }, { p:'ueng', ex:'翁（零聲母寫 weng）' }
    ]
  },
  specialFinals: [
    { p:'-i', ex:'字 zì / 詞 cí / 思 sī', tip:'舌尖前元音，只接 z c s' },
    { p:'-i', ex:'知 zhī / 吃 chī / 詩 shī / 日 rì', tip:'舌尖後元音，只接 zh ch sh r' },
    { p:'ê', ex:'欸 ê', tip:'單用時寫 ê，很少考' }
  ],
  tones: [
    { n:1, mark:'ˉ', name:'陰平', desc:'高平，由頭到尾保持高音', ex:'媽 mā', contour:'55' },
    { n:2, mark:'ˊ', name:'陽平', desc:'中升，由中音升到高音', ex:'麻 má', contour:'35' },
    { n:3, mark:'ˇ', name:'上聲', desc:'降升，先降到底再升（實際常讀半三聲）', ex:'馬 mǎ', contour:'214' },
    { n:4, mark:'ˋ', name:'去聲', desc:'全降，由高音直落低音', ex:'罵 mà', contour:'51' },
    { n:0, mark:'·', name:'輕聲', desc:'又短又輕，音高隨前字而定', ex:'嗎 ma', contour:'—' }
  ],
  rules: [
    {
      t:'三聲連讀變調',
      b:'兩個三聲相連，前一個讀成二聲（調值 35），後一個保持三聲。<br>你好 <span class="py">ní hǎo</span>（不是 nǐ hǎo）· 可以 <span class="py">ké yǐ</span> · 很冷 <span class="py">hén lěng</span> · 展覽 <span class="py">zhán lǎn</span>'
    },
    {
      t:'「一」的變調',
      b:'單用、序數、或在詞尾讀本調 <span class="py">yī</span>：第一 <span class="py">dì yī</span>、統一 <span class="py">tǒng yī</span>。<br>在去聲前讀二聲 <span class="py">yí</span>：一個 <span class="py">yí ge</span>、一次 <span class="py">yí cì</span>。<br>在陰平、陽平、上聲前讀去聲 <span class="py">yì</span>：一天 <span class="py">yì tiān</span>、一年 <span class="py">yì nián</span>、一起 <span class="py">yì qǐ</span>。'
    },
    {
      t:'「不」的變調',
      b:'在去聲前讀二聲 <span class="py">bú</span>：不是 <span class="py">bú shì</span>、不會 <span class="py">bú huì</span>。<br>其餘讀本調 <span class="py">bù</span>：不高 <span class="py">bù gāo</span>、不去？→ 去聲，讀 <span class="py">bú qù</span>。'
    },
    {
      t:'輕聲',
      b:'名詞後綴、助詞、疊音的第二個音節多讀輕聲：桌子 <span class="py">zhuōzi</span>、我們 <span class="py">wǒmen</span>、媽媽 <span class="py">māma</span>、的 <span class="py">de</span>、了 <span class="py">le</span>、嗎 <span class="py">ma</span>。<br>輕聲音節在卷一不考，但卷二、卷四、卷五大量出現，讀錯會直接扣分。'
    },
    {
      t:'兒化',
      b:'卷舌動作附在前一音節上，寫成 r，不獨立成音節：花兒 <span class="py">huār</span>、玩兒 <span class="py">wánr</span>、一點兒 <span class="py">yìdiǎnr</span>、這兒 <span class="py">zhèr</span>。<br>注意兒化後韻母會變：<span class="py">a→ar</span>、<span class="py">ai→ar</span>（一塊兒 yíkuàir）、<span class="py">i→ier</span>（玩意兒 wányìr）。'
    },
    {
      t:'上聲半三聲',
      b:'三聲在陰平、陽平、去聲、輕聲前不必讀完整 214，只讀前半（21，低降），稱為半三聲：北京 <span class="py">Běijīng</span>、好人 <span class="py">hǎo rén</span>、我是 <span class="py">wǒ shì</span>。<br>考試時讀完整 214 也可以，但語流中半三聲更自然。'
    }
  ],
  traps: [
    { h:'n / l 不分', bad:'你讀成 lǐ', good:'你 nǐ · 李 lǐ · 年 nián · 連 lián', tip:'捏住鼻子發 n，氣流從鼻出；l 則從舌兩側出。' },
    { h:'前後鼻音 -n / -ng', bad:'「生」讀成 sēn', good:'生 shēng / 身 shēn · 星 xīng / 新 xīn · 燈 dēng / 分 fēn', tip:'-ng 舌根抬起，收音時口微開；-n 舌尖抵上齒齦，口閉。' },
    { h:'ü 讀成 u', bad:'「綠」讀成 lù', good:'綠 lǜ · 女 nǚ · 去 qù · 學 xué', tip:'ü 嘴唇撮圓但舌尖前伸，與 u（舌後）不同。j q x 後的 u 其實是 ü。' },
    { h:'zh ch sh / z c s 不分', bad:'「知」讀成 zī', good:'知 zhī / 資 zī · 吃 chī / 詞 cí · 詩 shī / 思 sī', tip:'翹舌時舌尖上抬到硬齶前，平舌時舌尖抵上齒背。' },
    { h:'r 讀成 j / y', bad:'「日」讀成 yì', good:'日 rì · 人 rén · 熱 rè · 肉 ròu', tip:'翹舌＋濁音＋輕摩擦，接近英語 r 但舌更後。' },
    { h:'入聲字讀得太短', bad:'「學」讀成 hok', good:'學 xué · 白 bái · 國 guó · 六 liù', tip:'粵語入聲字在普通話已無塞音尾，要拉長成完整音節。' },
    { h:'-m 韻尾', bad:'「心」讀成 sām', good:'心 xīn · 三 sān · 感 gǎn · 南 nán', tip:'普通話沒有 -m 韻尾，全部歸入 -n。' },
    { h:'聲調：上聲與去聲', bad:'「買」讀成 mài', good:'買 mǎi / 賣 mài · 幾 jǐ / 記 jì · 水 shuǐ / 睡 shuì', tip:'上聲先降後升（214），去聲由高直落（51），不要只讀成低降。' },
    { h:'零聲母讀成 ng-', bad:'「我」讀成 ngo', good:'我 wǒ · 安 ān · 愛 ài · 鵝 é', tip:'普通話零聲母直接以元音起頭，前面不加鼻音。' },
    { h:'輕聲與重音', bad:'「東西」兩字都重讀', good:'東西 dōngxi（物件）· 東 西 dōng xī（方向）', tip:'輕聲會改變詞義，也是卷二、卷五的評分點。' }
  ],
  spelling: [
    { r:'j q x 後寫 u，讀 ü', ex:'ju qu xu = jü qü xü', note:'但 n l 後仍寫 ü：nü lü。' },
    { r:'iou / uei / uen 前加聲母時省寫', ex:'liu gui lun', note:'零聲母時寫 you wei wen。' },
    { r:'ü 與 j q x 相拼省兩點', ex:'juan quan xuan', note:'讀 jüan qüan xüan。' },
    { r:'標調位置', ex:'有 a 標 a；沒 a 找 o e；i u 並列標在後', note:'iu → iù，ui → uì。' }
  ]
};
