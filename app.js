/**
 * تاج الملوك | CROWN OF KINGS PLATFORM
 * Interactive Application Engine & Logic
 * Features: 49% Sidebar, Full-Screen Views, Bilingual Engine, Dark/Light Mode,
 * Code Buying & Activation Simulator, AI Chatbot, Audio Synthesizer, & Settings.
 */

// --- Global State ---
const state = {
    theme: localStorage.getItem('taj_theme') || 'dark',
    lang: localStorage.getItem('taj_lang') || 'ar',
    isGuest: true,
    user: null,
    soundEnabled: true,
    currentSection: null,
    neonGlowEnabled: true
};

// --- Multi-Language Dictionary (العربية / English) ---
const i18n = {
    ar: {
        top_badge: '<i class="fa-solid fa-bolt"></i> عاجل',
        ad_text_1: '👑 مرحباً بكم في منصة تاج الملوك - الإصدار الملكي الأحدث متاح الآن مجاناً!',
        ad_text_2: '⚡ عروض حصرية على أكواد التفعيل وخصومات تصل إلى 50%',
        ad_text_3: '🎮 تمت إضافة مكتبة الألعاب السحابية الجديدة وسيرفرات فائقة السرعة',
        guest_status: 'زائر مباشر',
        theme_name: 'ليلي',
        platform_name: 'تاج الملوك',
        edition_badge: 'الملكية',
        platform_slogan: 'بوابتك الشاملة للتطبيقات والألعاب والخدمات الحصرية',
        tag_vip: 'VIP STORE',
        tag_v: 'V3.0',
        drawer_title: 'قائمة تاج الملوك',
        drawer_subtitle: 'تصفح كافة أقسام المنصة',

        // Sections
        sec_home: 'الرئيسية',
        sec_home_sub: 'الصفحة الأولى والأخبار',
        sec_buy_code: 'شراء كود',
        sec_buy_code_sub: 'باقات وأسعار الأكواد',
        sec_activate_code: 'تفعيل كود',
        sec_activate_code_sub: 'فحص وتنشيط اشتراكك',
        sec_download_store: 'تحميل المتجر',
        sec_download_store_sub: 'تطبيق المتجر لكافة الأجهزة',
        sec_apps: 'التطبيقات',
        sec_apps_sub: 'تطبيقات بلس والمعدلة',
        sec_games: 'العاب',
        sec_games_sub: 'ألعاب مهكرة ومميزة',
        sec_cloud_games: 'العاب سحابية',
        sec_cloud_games_sub: 'تشغيل الألعاب أونلاين فوراً',
        sec_links: 'الروابط',
        sec_links_sub: 'القنوات والسيرفرات البديلة',
        sec_emulators: 'المحاكي',
        sec_emulators_sub: 'محاكيات PC وأجهزة الكونسول',
        sec_paid_games: 'العاب مدفوعة',
        sec_paid_games_sub: 'ألعاب VIP وبريميوم مجانية',
        sec_login: 'تسجيل دخول',
        sec_login_sub: 'حسابك وعضويتك الملكية',
        sec_settings: 'الاعدادات',
        sec_settings_sub: 'تخصيص المنصة والتفضيلات',
        sec_tutorials: 'الشروحات والأدلة',

        // Hero
        hero_badge_text: '✨ المنصة الرسمية الأولى 2026',
        hero_title_1: 'متجر',
        hero_title_2: 'تاج الملوك',
        hero_title_3: 'عالم بلا حدود من الإثارة والتطبيقات',
        hero_desc: 'اكتشف أضخم مكتبة ألعاب وتطبيقات مهكرة ومعدلة، ألعاب سحابية بدون تحميل، وأقوى أكواد التفعيل الحصرية مع تجربة سلسة وفائقة السرعة.',
        btn_download_store: 'تحميل المتجر الآن',
        btn_buy_vip: 'شراء كود VIP',
        btn_cloud_play: 'الألعاب السحابية',
        btn_open: 'فتح القسم',
        btn_back: 'رجوع',

        // Quick Sections & News
        quick_nav_pill: 'أقسام المنصة',
        quick_nav_title: 'الأقسام السريعة والمميزات',
        quick_nav_sub: 'اضغط على أي قسم للانتقال الفوري بكبر الشاشة',
        card_buy_desc: 'احصل على كود التفعيل الفوري مع باقات سنوية وشهرية مميزة وبوابات دفع متعددة.',
        card_activate_desc: 'أدخل كود الاشتراك لتفعيله فورياً والتحقق من الصلاحية ومميزات حسابك.',
        card_download_desc: 'تنزيل مباشر لمتجر تاج الملوك بصيغ APK للأندرويد، iOS للآيفون، ونسخة الويندوز.',
        card_cloud_desc: 'العب أضخم ألعاب الـ PC والكونسول مباشرة من المتصفح بدون الحاجة لمواصفات عالية.',
        card_apps_desc: 'مكتبة التطبيقات المعدلة، بلس، والمفتوحة الميزات مع التحديثات الدورية.',
        card_paid_desc: 'أقوى الألعاب العالمية المدفوعة متاحة للتحميل والتشغيل المباشر لأعضاء تاج الملوك.',

        news_pill: 'تحديثات حصرية',
        news_title: 'أخبار وتحديثات تاج الملوك',
        news_sub: 'تابع آخر إعلانات المنصة وتحديثات السيرفرات والألعاب الجديدة',
        news_tag_update: 'تحديث رئيسي',
        news_tag_offer: 'عرض خاص',
        news_tag_sec: 'أمان وشهادات',
        news_1_head: 'إطلاق متجر تاج الملوك V3.4 بالسيرفرات السحابية',
        news_1_body: 'تم إطلاق السيرفرات السحابية فائقة السرعة مع دعم تشغيل الألعاب الثقيلة بجودة 4K ومعدل 60 إطاراً في الثانية من أي متصفح.',
        news_2_head: 'تخفيضات 50% على أكواد VIP السنوية لجميع الزوار',
        news_2_body: 'بمناسبة الموسم الجديد، احصل على كود تفعيل سنوي يفتح جميع التطبيقات والألعاب المدفوعة والألعاب السحابية بسعر استثنائي.',
        news_3_head: 'تجديد شهادات مطوري iOS وتحديث المحاكيات',
        news_3_body: 'تم تجديد الشهادات المؤسسية لتطبيقات الآيفون والآيباد بدون جلبريك مع إضافة نسخة جديدة لمحاكي الأندرويد والكونسول.',
        read_more: 'اقرأ التفاصيل',
        claim_offer: 'استفد من العرض',
        read_guide: 'دليل التثبيت',

        // Tutorials
        tut_pill: 'مركز المعرفة',
        tut_title: 'شروحات وأدلة استخدام المنصة',
        tut_sub: 'شروحات خطوة بخطوة بالصور والفيديو لطريقة التثبيت واستخدام الأكواد',
        tut_steps_1: '3 خطوات سهلة',
        tut_1_title: 'شرح طريقة تفعيل كود الاشتراك بالمنصة',
        tut_1_desc: 'دليل شامل وسريع لكيفية وضع الكود في خانة التفعيل والتحقق من حسابك فوراً.',
        tut_steps_2: 'أندرويد وآيفون',
        tut_2_title: 'طريقة تثبيت متجر تاج الملوك على هاتفك',
        tut_2_desc: 'شرح تثبيت ملف الـ APK أو ملف تعريف الـ iOS وتخطي الحماية بخطوات آمنة.',
        tut_steps_3: 'لعب مباشر',
        tut_3_title: 'كيفية تشغيل الألعاب السحابية بدون تحميل',
        tut_3_desc: 'طريقة ربط يد التحكم (الكونترولر) وبدء اللعب في السيرفرات السحابية بأعلى دقة.',
        tut_steps_4: 'للحاسوب PC',
        tut_4_title: 'إعداد المحاكي وتشغيل ألعاب الجوال على الكمبيوتر',
        tut_4_desc: 'أفضل إعدادات لمحاكي تاج الملوك لتشغيل الألعاب بمعدل 120 إطار مع تخصيص الأزرار.',
        watch_guide: 'عرض الشرح الكامل',

        // Pricing & Buying
        buy_headline: 'اختر باقة الاشتراك المناسبة لك',
        buy_subline: 'أكواد فورية مع ضمان كامل ودعم فني على مدار الساعة لجميع الأجهزة',
        plan_month: 'باقة شهرية',
        plan_silver: 'الفضية VIP',
        per_month: '/ شهرياً',
        plan_6m: 'باقة 6 أشهر',
        plan_gold: 'الذهبية VIP',
        per_6m: '/ 6 أشهر',
        plan_year: 'باقة سنوية',
        plan_royal: 'الملكية ROYAL VIP',
        per_year: '/ سنوياً',
        most_popular: 'الأكثر طلباً 🔥',
        buy_now: 'شراء الكود الفوري',
        feat_1: 'وصول كامل لجميع التطبيقات بلس',
        feat_2: 'ألعاب مهكرة ومعدلة مع التحديثات',
        feat_3: 'سيرفرات تحميل سريعة ومباشرة',
        feat_no_cloud: 'الألعاب السحابية 4K (غير متضمنة)',
        feat_all_apps: 'جميع ميزات الباقة الشهرية',
        feat_cloud_access: 'سيرفرات الألعاب السحابية 60 FPS',
        feat_all_paid: 'جميع الألعاب المدفوعة والمحاكيات',
        feat_priority_support: 'دعم فني مخصص VIP',
        feat_all_unlimited: 'وصول لا نهائي لكل خدمات المنصة',
        feat_cloud_4k: 'ألعاب سحابية 4K فائقة السرعة',
        feat_multi_device: 'تفعيل على 3 أجهزة بنفس الكود',
        feat_lifetime_warranty: 'ضمان تعويض وحماية كاملة',
        payment_methods_title: 'طرق الدفع المدعومة بأمان تام:',

        // Activation
        act_title: 'أدخل كود الاشتراك الخاص بك',
        act_desc: 'أدخل كود التفعيل المكون من حروف وأرقام لتفعيل صلاحياتك الملكية فوراً',
        btn_activate_now: 'تفعيل الآن',
        sample_hint: 'أكواد تجريبية سريعة:',

        // Downloads
        dl_android: 'تحميل للأندرويد APK',
        dl_ios: 'تثبيت ملف iOS',
        dl_pc: 'تحميل للكمبيوتر EXE',

        // Bot
        bot_tooltip: 'مساعد تاج الملوك',
        bot_title: 'بوت مساعدة تاج الملوك',
        bot_welcome: 'مرحباً بك في منصة تاج الملوك! 👑 كيف يمكنني مساعدتك اليوم؟ يمكنك اختيار أحد الأسئلة السريعة أدناه أو كتابة استفسارك.',
        chat_bot_name: 'بوت المساعدة',

        // Footer & Extras
        guest_note: 'تتصفح حالياً بصلاحية زائر ملكي',
        guest_full_access: 'كافة الأقسام متاحة بدون قيود',
        footer_about: 'المنصة الملكية الشاملة للألعاب والتطبيقات وخدمات الأكواد السحابية مع تجربة مستخدم عصرية ومريحة للعين.',
        f_col_sections: 'الأقسام',
        f_col_support: 'الدعم والمجتمع',
        copyright: '© 2026 منصة تاج الملوك - جميع الحقوق محفوظة | تصميم كلاسيكي عصري فاخر'
    },
    en: {
        top_badge: '<i class="fa-solid fa-bolt"></i> BREAKING',
        ad_text_1: '👑 Welcome to Crown of Kings Platform - Latest Royal Edition is Live & Free!',
        ad_text_2: '⚡ Exclusive Activation Codes Deals with up to 50% discount',
        ad_text_3: '🎮 New Ultra-Fast Cloud Gaming Library & Servers Added',
        guest_status: 'Guest Mode',
        theme_name: 'Night',
        platform_name: 'Crown of Kings',
        edition_badge: 'ROYAL',
        platform_slogan: 'Your Ultimate Hub for Modded Apps, Games & VIP Cloud Services',
        tag_vip: 'VIP STORE',
        tag_v: 'V3.0',
        drawer_title: 'Crown Navigation',
        drawer_subtitle: 'Explore all platform departments',

        // Sections
        sec_home: 'Home',
        sec_home_sub: 'Main dashboard & updates',
        sec_buy_code: 'Buy Code',
        sec_buy_code_sub: 'VIP packages & instant keys',
        sec_activate_code: 'Activate Code',
        sec_activate_code_sub: 'Check & activate membership',
        sec_download_store: 'Download Store',
        sec_download_store_sub: 'Native app for all devices',
        sec_apps: 'Applications',
        sec_apps_sub: 'Plus & modded apps library',
        sec_games: 'Games',
        sec_games_sub: 'Unlocked & modded games',
        sec_cloud_games: 'Cloud Games',
        sec_cloud_games_sub: 'Instant 60FPS browser gaming',
        sec_links: 'Links',
        sec_links_sub: 'Official channels & mirrors',
        sec_emulators: 'Emulators',
        sec_emulators_sub: 'PC & console emulators',
        sec_paid_games: 'Paid Games',
        sec_paid_games_sub: 'Free VIP & premium games',
        sec_login: 'Login / Profile',
        sec_login_sub: 'Your royal membership',
        sec_settings: 'Settings',
        sec_settings_sub: 'Preferences & customizations',
        sec_tutorials: 'Guides & Tutorials',

        // Hero
        hero_badge_text: '✨ Official #1 Hub 2026',
        hero_title_1: 'Store',
        hero_title_2: 'Crown of Kings',
        hero_title_3: 'Limitless Universe of Modded Apps & Gaming',
        hero_desc: 'Explore the massive library of modded apps, unlocked games, zero-download cloud gaming, and exclusive VIP activation codes with ultra-smooth speed.',
        btn_download_store: 'Download Store Now',
        btn_buy_vip: 'Get VIP Code',
        btn_cloud_play: 'Cloud Gaming',
        btn_open: 'Open Section',
        btn_back: 'Back',

        // Quick Sections & News
        quick_nav_pill: 'Departments',
        quick_nav_title: 'Quick Access & Features',
        quick_nav_sub: 'Click any card to open full-screen view',
        card_buy_desc: 'Instant VIP codes with monthly & annual packages, supported by multi-payment gateways.',
        card_activate_desc: 'Enter your activation key to unlock membership privileges instantly.',
        card_download_desc: 'Direct download for Android APK, iOS Signed Profiles, and Windows PC.',
        card_cloud_desc: 'Play top PC & Console games directly from your browser with zero install.',
        card_apps_desc: 'Premium modded apps library with regular updates and anti-ban security.',
        card_paid_desc: 'Top global premium games available completely free for Crown members.',

        news_pill: 'Exclusive News',
        news_title: 'Crown Platform Updates',
        news_sub: 'Stay updated with platform announcements, servers, and new releases',
        news_tag_update: 'Major Release',
        news_tag_offer: 'Special Offer',
        news_tag_sec: 'Certificates & Security',
        news_1_head: 'Crown Store V3.4 with Cloud Gaming Launched',
        news_1_body: 'Ultra-fast cloud servers released with 4K 60FPS stream support right from any web browser.',
        news_2_head: '50% Discount on Annual VIP Codes for All Guests',
        news_2_body: 'Celebrate the new season with an annual activation key unlocking all premium apps and games.',
        news_3_head: 'iOS Certificates Renewed & Emulators Updated',
        news_3_body: 'Enterprise iOS developer certs refreshed for non-jailbroken iPhones with new PC emulator versions.',
        read_more: 'Read Details',
        claim_offer: 'Claim Offer',
        read_guide: 'Setup Guide',

        // Tutorials
        tut_pill: 'Knowledge Base',
        tut_title: 'Step-by-Step Guides & Tutorials',
        tut_sub: 'Visual walkthroughs on how to install, configure emulators, and activate codes',
        tut_steps_1: '3 Easy Steps',
        tut_1_title: 'How to Activate Your Subscription Code',
        tut_1_desc: 'Complete guide on entering the code and verifying your membership status immediately.',
        tut_steps_2: 'Android & iOS',
        tut_2_title: 'How to Install Crown Store on Mobile',
        tut_2_desc: 'Safely installing APK or iOS developer profiles with step-by-step trust instructions.',
        tut_steps_3: 'Instant Play',
        tut_3_title: 'How to Play Cloud Games on Any Browser',
        tut_3_desc: 'Connecting your game controller and launching ultra-low latency cloud titles.',
        tut_steps_4: 'For PC',
        tut_4_title: 'Setting up PC Emulator for 120FPS Gaming',
        tut_4_desc: 'Optimal settings for Crown Emulator to run mobile games with mapped keys and 120 FPS.',
        watch_guide: 'View Full Tutorial',

        // Pricing & Buying
        buy_headline: 'Choose Your VIP Subscription Plan',
        buy_subline: 'Instant delivery with 100% guarantee & 24/7 dedicated support',
        plan_month: 'Monthly Plan',
        plan_silver: 'Silver VIP',
        per_month: '/ month',
        plan_6m: '6 Months Plan',
        plan_gold: 'Gold VIP',
        per_6m: '/ 6 months',
        plan_year: 'Annual Plan',
        plan_royal: 'ROYAL VIP',
        per_year: '/ year',
        most_popular: 'Most Popular 🔥',
        buy_now: 'Buy Instant Code',
        feat_1: 'Full access to all Plus & Modded apps',
        feat_2: 'Modded games with regular updates',
        feat_3: 'High-speed direct download servers',
        feat_no_cloud: '4K Cloud Gaming (Not Included)',
        feat_all_apps: 'All features of Silver plan',
        feat_cloud_access: '60 FPS Cloud Gaming Servers',
        feat_all_paid: 'All premium games & emulators',
        feat_priority_support: 'Dedicated VIP Support',
        feat_all_unlimited: 'Unlimited access to everything',
        feat_cloud_4k: 'Ultra-fast 4K Cloud Gaming',
        feat_multi_device: '3 Devices simultaneous activation',
        feat_lifetime_warranty: 'Full replacement warranty & protection',
        payment_methods_title: 'Secure Payment Methods Supported:',

        // Activation
        act_title: 'Enter Your Subscription Key',
        act_desc: 'Type or paste your code to immediately unlock your Royal VIP access',
        btn_activate_now: 'Activate Now',
        sample_hint: 'Quick Trial Codes:',

        // Downloads
        dl_android: 'Download Android APK',
        dl_ios: 'Install iOS Profile',
        dl_pc: 'Download PC EXE',

        // Bot
        bot_tooltip: 'Crown Assistant',
        bot_title: 'Crown AI Assistant',
        bot_welcome: 'Welcome to Crown of Kings! 👑 How may I assist you today? Feel free to pick a prompt below or ask any question.',
        chat_bot_name: 'AI Assistant',

        // Footer & Extras
        guest_note: 'Browsing with Royal Guest Access',
        guest_full_access: 'All departments available unrestricted',
        footer_about: 'The all-in-one royal gaming, apps, and cloud platform designed with a comfortable modern classic aesthetic.',
        f_col_sections: 'Sections',
        f_col_support: 'Support & Community',
        copyright: '© 2026 Crown of Kings Platform - All rights reserved | Classic Modern Royal UI'
    }
};

// --- Web Audio Synthesizer (for Royal Neon sound effects) ---
const playRoyalSound = (type = 'click') => {
    if (!state.soundEnabled) return;
    try {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        if (!AudioContext) return;
        const ctx = new AudioContext();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.connect(gain);
        gain.connect(ctx.destination);

        const now = ctx.currentTime;
        if (type === 'click') {
            osc.type = 'sine';
            osc.frequency.setValueAtTime(587.33, now); // D5 note
            osc.frequency.exponentialRampToValueAtTime(880, now + 0.08); // A5 note
            gain.gain.setValueAtTime(0.12, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
            osc.start(now);
            osc.stop(now + 0.08);
        } else if (type === 'success') {
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(523.25, now); // C5
            osc.frequency.setValueAtTime(659.25, now + 0.08); // E5
            osc.frequency.setValueAtTime(783.99, now + 0.16); // G5
            osc.frequency.setValueAtTime(1046.50, now + 0.24); // C6
            gain.gain.setValueAtTime(0.15, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
            osc.start(now);
            osc.stop(now + 0.35);
        } else if (type === 'open') {
            osc.type = 'sine';
            osc.frequency.setValueAtTime(329.63, now); // E4
            osc.frequency.exponentialRampToValueAtTime(659.25, now + 0.12); // E5
            gain.gain.setValueAtTime(0.1, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
            osc.start(now);
            osc.stop(now + 0.12);
        }
    } catch (e) {
        // AudioContext ignored if blocked by browser policy
    }
};

// --- Initialization ---
document.addEventListener('DOMContentLoaded', () => {
    applyTheme(state.theme);
    applyLanguage(state.lang);
    setupEventListeners();
});

// --- Theme Management (Night / Day) ---
function applyTheme(theme) {
    state.theme = theme;
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('taj_theme', theme);

    const themeBtn = document.getElementById('themeToggleBtn');
    const themeNameSpan = themeBtn ? themeBtn.querySelector('[data-key="theme_name"]') : null;

    if (themeNameSpan) {
        themeNameSpan.textContent = theme === 'dark' 
            ? (state.lang === 'ar' ? 'ليلي' : 'Night')
            : (state.lang === 'ar' ? 'نهاري' : 'Day');
    }
}

function toggleTheme() {
    playRoyalSound('click');
    const newTheme = state.theme === 'dark' ? 'light' : 'dark';
    applyTheme(newTheme);
    showToast(state.lang === 'ar' 
        ? `تم تفعيل الوضع ${newTheme === 'dark' ? 'الملكي الليلي 🌙' : 'النهاري اللؤلؤي ☀️'}`
        : `Switched to ${newTheme === 'dark' ? 'Night Mode 🌙' : 'Day Mode ☀️'}`);
}

// --- Bilingual Engine (العربية / English) ---
function applyLanguage(lang) {
    state.lang = lang;
    localStorage.setItem('taj_lang', lang);

    const dict = i18n[lang] || i18n.ar;
    const langBtnText = document.getElementById('langText');
    const settingLangLabel = document.getElementById('settingLangLabel');

    if (langBtnText) {
        langBtnText.textContent = lang === 'ar' ? 'English' : 'العربية';
    }
    if (settingLangLabel) {
        settingLangLabel.textContent = lang === 'ar' ? 'English' : 'العربية';
    }

    // Update all elements with data-key
    document.querySelectorAll('[data-key]').forEach(el => {
        const key = el.getAttribute('data-key');
        if (dict[key]) {
            el.innerHTML = dict[key];
        }
    });

    // Adjust theme text according to language
    applyTheme(state.theme);
}

function toggleLanguage() {
    playRoyalSound('click');
    const newLang = state.lang === 'ar' ? 'en' : 'ar';
    applyLanguage(newLang);
    showToast(newLang === 'ar' ? 'تم تحويل اللغة إلى العربية 🇸🇦' : 'Language switched to English 🌐');
}

// --- 49% Sidebar Drawer Handling ---
function toggleSidebar() {
    playRoyalSound('click');
    const drawer = document.getElementById('sideDrawer');
    const backdrop = document.getElementById('sidebarBackdrop');
    const hamburger = document.getElementById('menuToggleBtn');

    if (drawer.classList.contains('active')) {
        closeSidebar();
    } else {
        drawer.classList.add('active');
        backdrop.classList.add('active');
        hamburger.classList.add('active');
        document.body.style.overflow = 'hidden';
    }
}

function closeSidebar() {
    const drawer = document.getElementById('sideDrawer');
    const backdrop = document.getElementById('sidebarBackdrop');
    const hamburger = document.getElementById('menuToggleBtn');

    if (drawer) drawer.classList.remove('active');
    if (backdrop) backdrop.classList.remove('active');
    if (hamburger) hamburger.classList.remove('active');
    
    // Restore overflow if no full screen view is active
    if (!state.currentSection) {
        document.body.style.overflow = 'auto';
    }
}

// --- Full-Screen Device Modals Navigation (شاشات بكبر الجهاز) ---
function openSection(sectionId) {
    playRoyalSound('open');
    closeSidebar();

    // Close any previous section
    if (state.currentSection) {
        const prev = document.getElementById(`view-${state.currentSection}`);
        if (prev) prev.classList.remove('active');
    }

    if (sectionId === 'home') {
        state.currentSection = null;
        document.body.style.overflow = 'auto';
        window.scrollTo({ top: 0, behavior: 'smooth' });
        return;
    }

    const targetView = document.getElementById(`view-${sectionId}`);
    if (targetView) {
        state.currentSection = sectionId;
        targetView.classList.add('active');
        targetView.scrollTop = 0;
        document.body.style.overflow = 'hidden';

        // Update active class in drawer
        document.querySelectorAll('.nav-link').forEach(link => {
            link.classList.remove('active');
        });
        const currentLink = document.querySelector(`.nav-link[onclick*="'${sectionId}'"]`);
        if (currentLink) currentLink.classList.add('active');
    }
}

function closeSection() {
    playRoyalSound('click');
    if (state.currentSection) {
        const currentView = document.getElementById(`view-${state.currentSection}`);
        if (currentView) currentView.classList.remove('active');
        state.currentSection = null;
        document.body.style.overflow = 'auto';
    }
}


// رجوع من أي صفحة داخلية إلى قائمة الأقسام
function backToSections() {
    playRoyalSound('click');
    if (state.currentSection) {
        const currentView = document.getElementById(`view-${state.currentSection}`);
        if (currentView) currentView.classList.remove('active');
        state.currentSection = null;
    }
    const drawer = document.getElementById('sideDrawer');
    const backdrop = document.getElementById('sidebarBackdrop');
    const hamburger = document.getElementById('menuToggleBtn');
    if (drawer) drawer.classList.add('active');
    if (backdrop) backdrop.classList.add('active');
    if (hamburger) hamburger.classList.add('active');
    document.body.style.overflow = 'hidden';
}

// --- Buy Code Simulation ---
function simulateBuy(packageName, price) {
    playRoyalSound('success');
    const randomCode = 'TAJ-' + Math.random().toString(36).substring(2, 6).toUpperCase() + '-' + Math.random().toString(36).substring(2, 6).toUpperCase() + '-VIP';
    
    const isAr = state.lang === 'ar';
    const title = isAr ? `طلب ${packageName} بنجاح!` : `Order for ${packageName} Initiated!`;
    const msg = isAr 
        ? `تم إنشاء كود الدفع التجريبي: <br><strong style="font-family: Orbitron; color: #F5B800; font-size: 1.2rem;">${randomCode}</strong><br><br>المبلغ: <strong>${price}</strong><br>تم نسخ الكود تلقائياً! يمكنك استخدامه في قسم 'تفعيل كود' فوراً.`
        : `Generated VIP Trial Code: <br><strong style="font-family: Orbitron; color: #00F0FF; font-size: 1.2rem;">${randomCode}</strong><br><br>Amount: <strong>${price}</strong><br>Copied automatically! You can test it in 'Activate Code' now.`;

    if (navigator.clipboard) {
        navigator.clipboard.writeText(randomCode).catch(() => {});
    }

    showTutorialModal(title, `
        <div style="text-align: center; padding: 15px 0;">
            <div style="font-size: 3rem; color: #10B981; margin-bottom: 12px;"><i class="fa-solid fa-circle-check"></i></div>
            <p style="font-size: 1.05rem; line-height: 1.6;">${msg}</p>
            <div style="margin-top: 25px; display: flex; gap: 10px; justify-content: center;">
                <button class="btn btn-gold-neon" onclick="closeTutorialModal(); openSection('activate-code'); fillCode('${randomCode}');">
                    <i class="fa-solid fa-key"></i> ${isAr ? 'الانتقال لتفعيل الكود الآن' : 'Go to Activate Code Now'}
                </button>
            </div>
        </div>
    `);
}

// --- Code Activation Logic ---
function fillCode(code) {
    playRoyalSound('click');
    const input = document.getElementById('activationCodeInput');
    if (input) input.value = code;
}

function pasteActivationCode() {
    playRoyalSound('click');
    if (navigator.clipboard) {
        navigator.clipboard.readText().then(text => {
            const input = document.getElementById('activationCodeInput');
            if (input) input.value = text.trim();
            showToast(state.lang === 'ar' ? 'تم لصق الكود من الحافظة' : 'Code pasted from clipboard');
        }).catch(() => {
            showToast(state.lang === 'ar' ? 'يرجى لصق الكود يدوياً' : 'Please paste code manually');
        });
    }
}

function handleActivateCode() {
    const input = document.getElementById('activationCodeInput');
    const resultBox = document.getElementById('activationResult');
    if (!input || !resultBox) return;

    const val = input.value.trim().toUpperCase();
    if (!val) {
        resultBox.className = 'activation-result error';
        resultBox.innerHTML = state.lang === 'ar' ? '⚠️ يرجى إدخال كود التفعيل أولاً.' : '⚠️ Please enter an activation code first.';
        resultBox.classList.remove('hidden');
        return;
    }

    resultBox.className = 'activation-result';
    resultBox.innerHTML = state.lang === 'ar' ? '<i class="fa-solid fa-spinner fa-spin"></i> جاري فحص الكود في قاعدة بيانات تاج الملوك الملكية...' : '<i class="fa-solid fa-spinner fa-spin"></i> Verifying key with Crown servers...';
    resultBox.classList.remove('hidden');

    setTimeout(() => {
        playRoyalSound('success');
        resultBox.className = 'activation-result success';
        if (state.lang === 'ar') {
            resultBox.innerHTML = `
                <div style="font-size: 1.4rem; margin-bottom: 6px;"><i class="fa-solid fa-crown text-gold"></i> تم تفعيل العضوية الملكية بنجاح!</div>
                <p>كود صالح: <strong>${val}</strong></p>
                <p>الصلاحية: <strong>سنة كاملة حتى 2027</strong> | الألعاب السحابية: <strong>مفعلة 4K 60FPS</strong></p>
            `;
        } else {
            resultBox.innerHTML = `
                <div style="font-size: 1.4rem; margin-bottom: 6px;"><i class="fa-solid fa-crown text-gold"></i> Royal VIP Membership Activated!</div>
                <p>Valid Key: <strong>${val}</strong></p>
                <p>Duration: <strong>1 Full Year (2027)</strong> | Cloud Gaming: <strong>4K 60FPS Enabled</strong></p>
            `;
        }
        showToast(state.lang === 'ar' ? '👑 مبروك! أصبحت عضواً ملكياً في تاج الملوك' : '👑 Congratulations! You are now a Crown VIP Member');
    }, 1000);
}

// --- Download Triggers ---
function triggerDownload(targetName) {
    playRoyalSound('success');
    showToast(state.lang === 'ar' 
        ? `🚀 بدء تنزيل ${targetName}... يرجى الانتظار`
        : `🚀 Starting download for ${targetName}... Please wait`);
}

function downloadItem(itemName) {
    playRoyalSound('success');
    showToast(state.lang === 'ar' 
        ? `📥 تم تجهيز رابط تنزيل: ${itemName}`
        : `📥 Download link ready for: ${itemName}`);
}

function launchCloudGame(gameName) {
    playRoyalSound('open');
    showToast(state.lang === 'ar'
        ? `🎮 جاري الاتصال بالسيرفر السحابي للعبة ${gameName}...`
        : `🎮 Connecting to cloud server for ${gameName}...`);
}

// --- Filtering in Apps/Games ---
function filterCategory(type, category) {
    playRoyalSound('click');
    const container = document.getElementById('appsGrid');
    if (!container) return;

    // Update active pill
    document.querySelectorAll('.filter-pills .pill').forEach(btn => btn.classList.remove('active'));
    event.target.classList.add('active');

    const cards = container.querySelectorAll('.item-card');
    cards.forEach(card => {
        const cat = card.getAttribute('data-category');
        if (category === 'all' || cat === category) {
            card.style.display = 'flex';
        } else {
            card.style.display = 'none';
        }
    });
}

function filterItems(type) {
    const query = document.getElementById('appSearchInput').value.toLowerCase().trim();
    const container = document.getElementById('appsGrid');
    if (!container) return;

    const cards = container.querySelectorAll('.item-card');
    cards.forEach(card => {
        const name = (card.getAttribute('data-name') || '').toLowerCase();
        const text = card.textContent.toLowerCase();
        if (name.includes(query) || text.includes(query)) {
            card.style.display = 'flex';
        } else {
            card.style.display = 'none';
        }
    });
}

// --- Tutorials Modal Details ---
function openTutorialModal(id) {
    playRoyalSound('open');
    const isAr = state.lang === 'ar';
    let title = '';
    let bodyHtml = '';

    if (id === 1) {
        title = isAr ? 'طريقة تفعيل كود الاشتراك بالمنصة' : 'How to Activate Subscription Key';
        bodyHtml = `
            <div style="line-height: 1.8;">
                <h4 style="color: #F5B800; margin-bottom: 10px;">خطوات تفعيل كود التاج الملكي:</h4>
                <ol style="padding-right: 20px; padding-left: 20px;">
                    <li>انتقل إلى قسم <strong>تفعيل كود</strong> من القائمة الجانبية أو الواجهة.</li>
                    <li>قم بنسخ كود التفعيل الذي حصلت عليه (مثال: TAJ-2026-VIP-XXXX).</li>
                    <li>اضغط على زر <strong>تفعيل الآن</strong>، وسيتم ربط صلاحياتك بحسابك فوراً.</li>
                </ol>
                <div style="margin-top: 15px; padding: 12px; background: rgba(0,240,255,0.1); border-radius: 8px;">
                    💡 <strong>ملاحظة:</strong> الأكواد تعمل على أجهزة متعددة وتمنحك أولوية في السيرفرات السحابية.
                </div>
            </div>
        `;
    } else if (id === 2) {
        title = isAr ? 'طريقة تثبيت متجر تاج الملوك' : 'How to Install Crown Store';
        bodyHtml = `
            <div style="line-height: 1.8;">
                <h4 style="color: #00F0FF; margin-bottom: 10px;">لأجهزة الأندرويد:</h4>
                <p>1. قم بتحميل ملف APK واضغط عليه للتثبيت.<br>2. في حال ظهرت رسالة مصادر غير معروفة، اضغط 'سماح' وسيتم التثبيت بنجاح.</p>
                <h4 style="color: #9D4EDD; margin-top: 15px; margin-bottom: 10px;">لأجهزة الآيفون والآيباد:</h4>
                <p>1. قم بتثبيت ملف التعريف (Profile) من الرابط المباشر.<br>2. توجه إلى الإعدادات > عام > إدارة الجهاز > وثّق الشهادة المؤسسية.</p>
            </div>
        `;
    } else if (id === 3) {
        title = isAr ? 'كيفية تشغيل الألعاب السحابية' : 'How to Play Cloud Games';
        bodyHtml = `
            <div style="line-height: 1.8;">
                <h4 style="color: #10B981; margin-bottom: 10px;">متطلبات اللعب السحابي:</h4>
                <p>• سرعة إنترنت 10 ميغابت/ثانية على الأقل.<br>• متصفح حديث (Chrome, Safari, Edge).<br>• يمكن اللعب باللمس أو ربط أي يد تحكم بلوتوث (PS / Xbox).</p>
            </div>
        `;
    } else if (id === 4) {
        title = isAr ? 'إعداد المحاكي للكمبيوتر PC' : 'Setting up PC Emulator';
        bodyHtml = `
            <div style="line-height: 1.8;">
                <h4 style="color: #F5B800; margin-bottom: 10px;">أفضل إعدادات للأداء العالي 120 FPS:</h4>
                <p>• تفعيل تقنية Virtualization (VT-x / AMD-V) من البيوس.<br>• تخصيص 4 أنوية للمعالج و 4GB رام للمحاكي.<br>• تفعيل وضع ألعاب DirectX أو OpenGL في الإعدادات.</p>
            </div>
        `;
    }

    showTutorialModal(title, bodyHtml);
}

function showTutorialModal(title, html) {
    const modal = document.getElementById('tutorialModal');
    const backdrop = document.getElementById('tutorialModalBackdrop');
    const titleEl = document.getElementById('tutModalTitle');
    const bodyEl = document.getElementById('tutModalBody');

    if (titleEl) titleEl.innerHTML = `<i class="fa-solid fa-graduation-cap text-gold"></i> ${title}`;
    if (bodyEl) bodyEl.innerHTML = html;

    if (modal) modal.classList.add('active');
    if (backdrop) backdrop.classList.add('active');
}

function closeTutorialModal() {
    const modal = document.getElementById('tutorialModal');
    const backdrop = document.getElementById('tutorialModalBackdrop');
    if (modal) modal.classList.remove('active');
    if (backdrop) backdrop.classList.remove('active');
}

function openNewsDetail(id) {
    playRoyalSound('open');
    const isAr = state.lang === 'ar';
    showTutorialModal(
        isAr ? 'تفاصيل إطلاق الإصدار الملكي V3.4' : 'Crown Store V3.4 Release Details',
        isAr 
        ? `<p style="line-height: 1.8;">يسر إدارة <strong>تاج الملوك</strong> الإعلان عن اكتمال البنية التحتية للسيرفرات السحابية فائقة السرعة مع حماية شاملة ضد الحظر وتشفير فائق للبيانات. استمتع بتجربة ألعاب لا مثيل لها وبدون إعلانات مزعجة.</p>`
        : `<p style="line-height: 1.8;">We are thrilled to present Crown Store V3.4 with enhanced cloud computing clusters, zero latency servers, and unified cross-platform sync. Enjoy non-stop gaming with zero ads.</p>`
    );
}

// --- AI Assistant Bot Logic ---
function toggleChatBot() {
    playRoyalSound('click');
    const chatWindow = document.getElementById('botChatWindow');
    if (chatWindow) {
        chatWindow.classList.toggle('active');
        if (chatWindow.classList.contains('active')) {
            const input = document.getElementById('chatInputText');
            if (input) input.focus();
        }
    }
}

function sendQuickBotQuery(text) {
    playRoyalSound('click');
    appendChatMessage(text, 'user');
    respondFromBot(text);
}

function sendUserMessage() {
    const input = document.getElementById('chatInputText');
    if (!input) return;
    const text = input.value.trim();
    if (!text) return;

    playRoyalSound('click');
    appendChatMessage(text, 'user');
    input.value = '';
    respondFromBot(text);
}

function handleChatKeyPress(e) {
    if (e.key === 'Enter') {
        sendUserMessage();
    }
}

function appendChatMessage(text, sender) {
    const container = document.getElementById('chatMessages');
    if (!container) return;

    const msgDiv = document.createElement('div');
    msgDiv.className = `chat-msg ${sender}-msg`;
    msgDiv.innerHTML = `<div class="msg-bubble"><p>${text}</p></div>`;
    container.appendChild(msgDiv);
    container.scrollTop = container.scrollHeight;
}

function respondFromBot(query) {
    const isAr = state.lang === 'ar';
    let reply = '';
    const q = query.toLowerCase();

    if (q.includes('كود') || q.includes('تفعيل') || q.includes('code') || q.includes('activate')) {
        reply = isAr 
            ? 'لتفعيل الكود، اضغط على قسم **تفعيل كود** في القائمة، وضع رمز الاشتراك الخاص بك ثم اضغط "تفعيل الآن". إذا كنت تريد شراء كود جديد، تفضل بزيارة قسم **شراء كود** 👑'
            : 'To activate your code, head over to the **Activate Code** department in the menu, paste your VIP key and click "Activate Now". For new keys, visit **Buy Code** 👑';
    } else if (q.includes('تحميل') || q.includes('متجر') || q.includes('download') || q.includes('store') || q.includes('apk')) {
        reply = isAr
            ? 'يمكنك تنزيل متجر تاج الملوك بصيغة APK للأندرويد، أو ملف التعريف للآيفون والآيباد، أو نسخة الكمبيوتر مباشرة من قسم **تحميل المتجر** 🚀'
            : 'You can download the Crown Store APK for Android, iOS profile, or PC version directly from the **Download Store** section 🚀';
    } else if (q.includes('سحابي') || q.includes('cloud') || q.includes('العاب')) {
        reply = isAr
            ? 'الألعاب السحابية تتيح لك تشغيل ألعاب PC و PS5 بجودة 4K ومعدل 60 إطاراً في الثانية من متصفحك مباشرة بدون تحميل! تفضل بزيارة قسم **العاب سحابية** للبدء 🎮'
            : 'Cloud Gaming allows you to stream top PC & PS5 games at 4K 60FPS directly in your browser without downloads! Check out **Cloud Games** 🎮';
    } else if (q.includes('دعم') || q.includes('بشري') || q.includes('support') || q.includes('help')) {
        reply = isAr
            ? 'فريق الدعم الفني الملكي متاح على مدار الساعة عبر سيرفر الديسكورد وقناة التلغرام الرسمية في قسم **الروابط**. يمكنك الانضمام فوراً 💬'
            : 'Our Royal Support team is available 24/7 on Discord and Telegram in the **Links** section. Feel free to join right away 💬';
    } else {
        reply = isAr
            ? `شكراً لتواصلك مع تاج الملوك! 👑 بخصوص استفسارك ("${query}")، فريقنا ومنصتنا توفر لك كافة التطبيقات والألعاب والخدمات. هل ترغب بأن أفتح لك قسماً معيناً؟`
            : `Thank you for reaching Crown of Kings! 👑 Regarding ("${query}"), our platform offers complete modded tools & gaming. Would you like me to guide you to a specific department?`;
    }

    setTimeout(() => {
        playRoyalSound('open');
        appendChatMessage(reply, 'bot');
    }, 450);
}

// --- Auth Simulation (Login / Guest) ---
function switchAuthTab(tab) {
    playRoyalSound('click');
    const tabLogin = document.getElementById('tabLogin');
    const tabRegister = document.getElementById('tabRegister');
    const groupName = document.getElementById('groupName');
    const authBtnText = document.getElementById('authBtnText');

    if (tab === 'login') {
        tabLogin.classList.add('active');
        tabRegister.classList.remove('active');
        if (groupName) groupName.style.display = 'none';
        if (authBtnText) authBtnText.textContent = state.lang === 'ar' ? 'دخول الحساب' : 'Login';
    } else {
        tabRegister.classList.add('active');
        tabLogin.classList.remove('active');
        if (groupName) groupName.style.display = 'block';
        if (authBtnText) authBtnText.textContent = state.lang === 'ar' ? 'إنشاء الحساب الملكي' : 'Register Account';
    }
}

function handleAuthSubmit(e) {
    e.preventDefault();
    playRoyalSound('success');
    const email = document.getElementById('authEmail').value;
    const name = document.getElementById('authName') ? document.getElementById('authName').value : 'العضو الملكي';
    
    state.isGuest = false;
    state.user = { email, name: name || 'عضو تاج الملوك' };

    const guestBadge = document.getElementById('guestBadge');
    if (guestBadge) {
        guestBadge.innerHTML = `<span class="status-dot"></span> <i class="fa-solid fa-crown text-gold"></i> <span>${state.user.name}</span>`;
    }

    showToast(state.lang === 'ar' 
        ? `👑 أهلاً بك يا ${state.user.name} في منصة تاج الملوك!`
        : `👑 Welcome ${state.user.name} to Crown of Kings!`);
    
    closeSection();
}

function stayAsGuest() {
    playRoyalSound('click');
    showToast(state.lang === 'ar' ? 'أنت تتصفح كزائر ملكي بصلاحيات كاملة 👑' : 'Continuing as Guest with Full Access 👑');
    closeSection();
}

// --- Settings Actions ---
function toggleGlowEffects(checkbox) {
    playRoyalSound('click');
    state.neonGlowEnabled = checkbox.checked;
    if (!state.neonGlowEnabled) {
        document.body.style.setProperty('--shadow-neon-gold', 'none');
        document.body.style.setProperty('--shadow-neon-cyan', 'none');
        showToast(state.lang === 'ar' ? 'تم تعطيل تأثيرات النيون لتوفير الطاقة' : 'Neon glow effects disabled');
    } else {
        document.body.style.removeProperty('--shadow-neon-gold');
        document.body.style.removeProperty('--shadow-neon-cyan');
        showToast(state.lang === 'ar' ? 'تم تفعيل التوهج النيوني الفاخر' : 'Neon glow effects enabled');
    }
}

function clearAppData() {
    playRoyalSound('click');
    localStorage.clear();
    showToast(state.lang === 'ar' ? 'تم مسح الكاش والذاكرة المؤقتة بنجاح' : 'Cache and local data cleared successfully');
}

// --- Toast System ---
function showToast(message) {
    const container = document.getElementById('toastContainer');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = 'toast-msg';
    toast.innerHTML = `<i class="fa-solid fa-crown text-gold"></i> <span>${message}</span>`;
    container.appendChild(toast);

    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateY(-10px)';
        toast.style.transition = 'all 0.3s ease';
        setTimeout(() => toast.remove(), 300);
    }, 3200);
}

// --- Event Listeners Setup ---
function setupEventListeners() {
    // Top Bar buttons
    const themeBtn = document.getElementById('themeToggleBtn');
    if (themeBtn) themeBtn.addEventListener('click', toggleTheme);

    const langBtn = document.getElementById('langToggleBtn');
    if (langBtn) langBtn.addEventListener('click', toggleLanguage);

    // Escape key handling
    window.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            closeSidebar();
            closeSection();
            closeTutorialModal();
            const chatWindow = document.getElementById('botChatWindow');
            if (chatWindow && chatWindow.classList.contains('active')) {
                chatWindow.classList.remove('active');
            }
        }
    });

    // Sound toggle in settings
    const soundToggle = document.getElementById('toggleSound');
    if (soundToggle) {
        soundToggle.addEventListener('change', (e) => {
            state.soundEnabled = e.target.checked;
            showToast(state.soundEnabled ? 'تم تفعيل المؤثرات الصوتية 🔊' : 'تم كتم المؤثرات الصوتية 🔇');
        });
    }
}

// ===== 2026 Royal Update: splash, IDs, empty sections =====
(function royalUpdate(){
  const EMPTY_SECTIONS = new Set(['apps','cloud-games','paid-games','emulators']);
  const originalOpenSection = window.openSection;

  function ensureGuestId(){
    let id = localStorage.getItem('tajGuestId');
    if(!id){
      const part = (Date.now().toString().slice(-6) + Math.floor(Math.random()*900+100)).slice(-7);
      id = 'G-' + part;
      localStorage.setItem('tajGuestId', id);
    }
    return id;
  }
  function ensureMemberId(){
    let id = localStorage.getItem('tajMemberId');
    if(!id){
      id = String(1000 + Math.floor(Math.random()*8999000));
      localStorage.setItem('tajMemberId', id);
    }
    return id;
  }
  window.getTajVisitorId = ensureGuestId;
  window.getTajMemberId = ensureMemberId;

  function showEmpty(sectionId, comingSoon){
    if(typeof originalOpenSection === 'function') originalOpenSection(sectionId);
    const view = document.getElementById('view-'+sectionId);
    if(!view) return;
    const body = view.querySelector('.view-body');
    if(body){
      body.innerHTML = `<div class="empty-state-royal"><i class="fa-solid ${comingSoon?'fa-hourglass-half':'fa-box-open'}"></i><h3>${comingSoon?'قريبًا':'لا يوجد محتوى حاليًا'}</h3><p>${comingSoon?'سيتم توفير هذه الخدمة قريبًا.':'سيتم إضافة المحتوى عند توفره.'}</p></div>`;
    }
  }
  window.openSection = function(sectionId){
    if(sectionId === 'buy-code'){ showEmpty(sectionId,true); return; }
    if(EMPTY_SECTIONS.has(sectionId)){ showEmpty(sectionId,false); return; }
    return originalOpenSection(sectionId);
  };
  window.simulateBuy = function(){ showEmpty('buy-code',true); };

  function updateIdentityBadge(){
    const badge = document.getElementById('guestBadge');
    if(!badge) return;
    const member = localStorage.getItem('tajLoggedIn') === 'true';
    const id = member ? ensureMemberId() : ensureGuestId();
    const span = badge.querySelector('[data-key="guest_status"]') || badge.querySelector('span:last-child');
    if(span) span.textContent = member ? `ID: ${id}` : `زائر • ${id}`;
    badge.title = member ? `معرّف الحساب: ${id}` : `معرّف الزائر: ${id}`;
  }

  // Royal procedural intro sound: no external audio file required.
  let royalEntryAudio = null;
  function playRoyalIntroSound(){
    try{
      if(!royalEntryAudio){
        royalEntryAudio = new Audio('royal-entry.wav');
        royalEntryAudio.preload = 'auto';
        royalEntryAudio.volume = 0.92;
      }
      royalEntryAudio.currentTime = 0;
      const p = royalEntryAudio.play();
      if(p && p.catch) p.catch(()=>{});
    }catch(e){}
  }

  document.addEventListener('DOMContentLoaded',()=>{
    updateIdentityBadge();
    const splash=document.getElementById('royalSplash'), video=document.getElementById('royalIntroVideo'), bar=document.getElementById('royalProgressBar'), txt=document.getElementById('royalProgressText');
    if(!splash) return;
    let started=performance.now(), soundPlayed=false;
    const duration=5000;
    const tick=()=>{
      if(!soundPlayed){playRoyalIntroSound();soundPlayed=true;}
      const p=Math.min(100,Math.round((performance.now()-started)/duration*100));
      if(bar)bar.style.width=p+'%'; if(txt)txt.textContent=p+'%';
      if(p>=100){ splash.classList.add('done'); setTimeout(()=>splash.remove(),550); return; }
      requestAnimationFrame(tick);
    };
    if(video){ video.muted=true; video.volume=0; video.play().catch(()=>{}); }
    requestAnimationFrame(tick);
  });

  // Extend existing local demo auth with a persistent member ID.
  const oldAuth = window.handleAuthSubmit;
  if(typeof oldAuth === 'function'){
    window.handleAuthSubmit = function(e){
      const result = oldAuth(e);
      localStorage.setItem('tajLoggedIn','true'); ensureMemberId();
      setTimeout(updateIdentityBadge,50);
      return result;
    };
  }
})();

// ===== Compact header, ticker position, live clock/FPS and splash audio =====
(function tajHeaderRefine(){
  function shortLanguageLabel(){
    const el=document.getElementById('langText');
    if(el) el.textContent = state.lang === 'ar' ? 'EN' : 'AR';
  }
  const oldApplyLanguage=window.applyLanguage;
  if(typeof oldApplyLanguage==='function'){
    window.applyLanguage=function(lang){ const r=oldApplyLanguage(lang); shortLanguageLabel(); return r; };
  }

  document.addEventListener('DOMContentLoaded',()=>{
    shortLanguageLabel();
    // Move breaking-news strip below the platform header.
    const ticker=document.querySelector('.ads-ticker-wrap');
    const header=document.querySelector('.main-header');
    if(ticker && header){ ticker.classList.add('announcement-under-header'); header.insertAdjacentElement('afterend',ticker); }

    // Clock.
    const clock=document.getElementById('liveClock');
    const updateClock=()=>{ if(clock){ const d=new Date(), h=d.getHours(), ap=h>=12?'م':'ص', hh=((h%12)||12).toString().padStart(2,'0'), mm=d.getMinutes().toString().padStart(2,'0'); clock.textContent=`${hh}:${mm} ${ap}`; } };
    updateClock(); setInterval(updateClock,1000);

    // Smoothed live FPS counter.
    const fpsEl=document.getElementById('liveFps'); let frames=0,last=performance.now(),fps=60;
    function frame(now){ frames++; if(now-last>=700){fps=Math.round(frames*1000/(now-last));frames=0;last=now;if(fpsEl)fpsEl.textContent='FPS '+fps;} requestAnimationFrame(frame); }
    requestAnimationFrame(frame);

    // Browsers often block autoplay audio. Try immediately; if blocked show one-tap sound activation on splash.
    const video=document.getElementById('royalIntroVideo'); const soundBtn=document.getElementById('enableIntroSound');
    if(video){
      video.muted=true; video.volume=0;
      const tryPlay=video.play();
      if(tryPlay && tryPlay.catch) tryPlay.catch(()=>{ video.muted=true; video.play().catch(()=>{}); if(soundBtn)soundBtn.classList.add('show'); });
    }
    if(soundBtn) soundBtn.addEventListener('click',()=>{
      if(video){video.muted=true;video.volume=0;video.play().catch(()=>{});} 
      try{ if(typeof playRoyalIntroSound==='function') playRoyalIntroSound(); }catch(e){}
      soundBtn.classList.remove('show');
    });
  });
})();

// ===== V4: timed activation code prototype (client-side) =====
(function timedCodesV4(){
  const STORE_KEY='tajActiveCodeV4';
  const DEMO_CODES={
    'TAJ-TRIAL-60':{typeAr:'تجريبي',typeEn:'Trial',duration:60*60*1000},
    'TAJ-BASIC-24H':{typeAr:'أساسي',typeEn:'Basic',duration:24*60*60*1000},
    'TAJ-2026-ROYAL-VIP':{typeAr:'تجريبي',typeEn:'Trial',duration:60*60*1000},
    'TAJ-PLUS-GOLD-99':{typeAr:'أساسي',typeEn:'Basic',duration:24*60*60*1000}
  };
  let timer=null;
  function read(){try{return JSON.parse(localStorage.getItem(STORE_KEY)||'null')}catch(e){return null}}
  function write(v){localStorage.setItem(STORE_KEY,JSON.stringify(v))}
  function remaining(s){return Math.max(0,(s?.expiresAt||0)-Date.now())}
  function fmt(ms){const t=Math.ceil(ms/1000),h=Math.floor(t/3600),m=Math.floor((t%3600)/60),s=t%60;return `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`}
  function render(){
    const box=document.getElementById('activationResult'), input=document.getElementById('activationCodeInput');
    if(!box||!input)return;
    const s=read(); if(timer){clearInterval(timer);timer=null}
    if(!s){input.disabled=false;return}
    const left=remaining(s), active=left>0;
    input.value=s.code; input.disabled=active;
    box.className='activation-result '+(active?'success':'error'); box.classList.remove('hidden');
    const ar=(window.state?.lang||'ar')==='ar';
    box.innerHTML=`<div class="code-status-card ${active?'is-active':'is-expired'}">
      <div class="code-status-top"><strong>${active?'🟢 '+(ar?'مفعّل':'Active'):'🔴 '+(ar?'غير مفعّل':'Inactive')}</strong><span>${ar?s.typeAr:s.typeEn}</span></div>
      <div class="code-status-value">${s.code}</div>
      <div class="code-status-time"><small>${ar?(active?'الوقت المتبقي':'انتهت الصلاحية'):(active?'Time remaining':'Expired')}</small><b>${active?fmt(left):'00:00:00'}</b></div>
      ${active?`<p>${ar?'لا يمكن استبدال الكود حتى انتهاء مدته.':'The code cannot be replaced until it expires.'}</p>`:`<p>${ar?'يمكنك الآن إدخال كود جديد.':'You can now enter a new code.'}</p>`}
    </div>`;
    if(active) timer=setInterval(()=>{ if(remaining(read())<=0){render();showToast(ar?'انتهت صلاحية الكود، يمكنك تفعيل كود جديد.':'Code expired. You can activate a new code.')} else {const b=box.querySelector('.code-status-time b');if(b)b.textContent=fmt(remaining(read()))}},1000);
  }
  window.handleActivateCode=function(){
    const input=document.getElementById('activationCodeInput'); if(!input)return;
    const current=read();
    if(current&&remaining(current)>0){render();showToast('يوجد كود مفعّل بالفعل');return}
    const code=input.value.trim().toUpperCase();
    if(!code){showToast('يرجى إدخال كود التفعيل');return}
    const def=DEMO_CODES[code];
    if(!def){const box=document.getElementById('activationResult');if(box){box.className='activation-result error';box.classList.remove('hidden');box.innerHTML='❌ الكود غير صالح أو غير موجود.'}return}
    const now=Date.now(); write({code,typeAr:def.typeAr,typeEn:def.typeEn,activatedAt:now,expiresAt:now+def.duration});
    render(); playRoyalSound('success'); showToast(def.typeAr==='تجريبي'?'تم تفعيل الكود التجريبي لمدة 60 دقيقة':'تم تفعيل الكود الأساسي');
  };
  window.fillCode=function(code){const s=read();if(s&&remaining(s)>0){render();showToast('لا يمكن تغيير الكود أثناء التفعيل');return}const i=document.getElementById('activationCodeInput');if(i)i.value=code};
  document.addEventListener('DOMContentLoaded',()=>setTimeout(render,150));
  const oldOpen=window.openSection; window.openSection=function(id){const r=oldOpen(id);if(id==='activate-code')setTimeout(render,50);return r};
})();


// ===== V11: Ultra Gaming Mode =====
(function ultraGamingMode(){
    const KEY = 'taj_ultra_gaming_mode';
    let navAudioCtx = null;
    let lastGamingSoundAt = 0;

    function setMode(enabled, notify){
        document.documentElement.classList.toggle('gaming-mode', !!enabled);
        localStorage.setItem(KEY, enabled ? '1' : '0');
        const toggle = document.getElementById('toggleGamingMode');
        if (toggle) toggle.checked = !!enabled;
        if (notify && typeof showToast === 'function') {
            showToast(enabled ? '🎮 تم تفعيل مود الألعاب العصري' : 'تم إيقاف مود الألعاب');
        }
    }

    window.toggleGamingMode = function(input){
        const enabled = typeof input === 'boolean' ? input : !!input.checked;
        setMode(enabled, true);
        if (enabled) gamingNavSound();
    };

    function gamingNavSound(){
        if (!document.documentElement.classList.contains('gaming-mode')) return;
        const t = performance.now();
        if (t - lastGamingSoundAt < 90) return;
        lastGamingSoundAt = t;
        if (state && state.soundEnabled === false) return;
        try {
            const AC = window.AudioContext || window.webkitAudioContext;
            if (!AC) return;
            navAudioCtx = navAudioCtx || new AC();
            const ctx = navAudioCtx, now = ctx.currentTime;
            const osc = ctx.createOscillator(), gain = ctx.createGain();
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(420, now);
            osc.frequency.exponentialRampToValueAtTime(980, now + .07);
            gain.gain.setValueAtTime(.045, now);
            gain.gain.exponentialRampToValueAtTime(.001, now + .11);
            osc.connect(gain); gain.connect(ctx.destination);
            osc.start(now); osc.stop(now + .12);
        } catch(e) {}
    }

    document.addEventListener('click', function(e){
        if (!document.documentElement.classList.contains('gaming-mode')) return;
        const target = e.target.closest('button,.nav-link,.btn,.category-card,.app-card,.game-card,a');
        if (target) gamingNavSound();
    }, true);

    document.addEventListener('DOMContentLoaded', function(){
        setMode(localStorage.getItem(KEY) === '1', false);
    });
    // script may execute after DOMContentLoaded
    if (document.readyState !== 'loading') setMode(localStorage.getItem(KEY) === '1', false);
})();

// ===== V14: Gaming Mode is a standalone primary theme =====
(function gamingPrimaryThemeV14(){
  const KEY='taj_ultra_gaming_mode', PREV='taj_theme_before_gaming';
  const oldToggleGaming=window.toggleGamingMode;
  const oldToggleTheme=window.toggleTheme;

  function syncThemeControl(){
    const gaming=document.documentElement.classList.contains('gaming-mode');
    const btn=document.getElementById('themeToggleBtn');
    if(btn){
      btn.classList.toggle('theme-disabled-by-gaming',gaming);
      btn.setAttribute('aria-disabled',gaming?'true':'false');
      btn.title=gaming?'أوقف مود الألعاب أولاً لتغيير الوضع الليلي/النهاري':'';
    }
  }
  window.toggleGamingMode=function(input){
    const enabled=typeof input==='boolean'?input:!!input.checked;
    if(enabled){
      localStorage.setItem(PREV,state.theme||localStorage.getItem('taj_theme')||'dark');
      document.documentElement.classList.add('gaming-mode');
      document.documentElement.setAttribute('data-theme','gaming');
      localStorage.setItem(KEY,'1');
      const t=document.getElementById('toggleGamingMode'); if(t)t.checked=true;
      if(typeof showToast==='function')showToast('🎮 تم تفعيل مود الألعاب');
    }else{
      document.documentElement.classList.remove('gaming-mode');
      localStorage.setItem(KEY,'0');
      const restore=localStorage.getItem(PREV)||'dark';
      applyTheme(restore);
      const t=document.getElementById('toggleGamingMode'); if(t)t.checked=false;
      if(typeof showToast==='function')showToast('تم إيقاف مود الألعاب');
    }
    syncThemeControl();
  };
  window.toggleTheme=function(){
    if(document.documentElement.classList.contains('gaming-mode')){
      if(typeof showToast==='function')showToast('🎮 أوقف مود الألعاب أولاً لتغيير الوضع الليلي أو النهاري');
      return;
    }
    return oldToggleTheme();
  };
  function boot(){
    if(localStorage.getItem(KEY)==='1'){
      document.documentElement.classList.add('gaming-mode');
      document.documentElement.setAttribute('data-theme','gaming');
      const t=document.getElementById('toggleGamingMode'); if(t)t.checked=true;
    }
    syncThemeControl();
  }
  document.addEventListener('DOMContentLoaded',boot);
  if(document.readyState!=='loading')boot();
})();
