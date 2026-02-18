const az = {
  app: {
    name: "Bazar",
    subtitle: "Bazar izləmə sistemi",
    logout: "Çıxış",
    loading: "Yüklənir...",
    builtWith: "React + Supabase ilə hazırlanıb",
  },

  nav: {
    today: "Bugün",
    products: "Məhsullar",
    analysis: "Analiz",
    logout: "Çıxış"
  },

  login: {
    title: "Bazar İzləmə Sistemi",
    subtitle: "Məhsulları və gündəlik alqı-satqını idarə etmək üçün daxil olun",
    email: "Email",
    password: "Şifrə",
    emailPlaceholder: "siz@email.com",
    passwordPlaceholder: "••••••••",
    login: "Daxil ol",
    loggingIn: "Daxil olunur...",
    success: "Uğurla daxil oldunuz!",
    tip: "Məsləhət: Hazırda tək istifadəçi rejimi aktivdir.",
  },

  products: {
    title: "Məhsullar",
    subtitle: "Məhsulları əlavə edin, adını dəyişin və ya gizlədin",
    addPlaceholder: "Yeni məhsul adı (məs. Alma)",
    add: "Əlavə et",
    name: "Məhsul",
    status: "Status",
    actions: "Əməliyyatlar",
    active: "Aktiv",
    hidden: "Gizli",
    rename: "Adı dəyiş",
    hide: "Gizlət",
    restore: "Bərpa et",
    noProducts: "Hələ məhsul yoxdur",
    loading: "Yüklənir...",
    confirmHide: "Bu məhsulu gizlətmək istədiyinizə əminsiniz?",
    confirmRestore: "Bu məhsulu yenidən aktiv etmək istədiyinizə əminsiniz?",
  },

  today: {
    title: "Bugün",
    subtitle: "Bu gün aldığınız və satdığınız məhsulları əlavə edin",
    date: "Tarix",
    buys: "Alışlar",
    sells: "Satışlar",
    addRow: "Sətir əlavə et",
    product: "Məhsul",
    qty: "Miqdar (kq)",
    price: "Qiymət / kq",
    total: "Cəm",
    actions: "Əməliyyatlar",
    remove: "Sil",
    confirmRemove: "Bu sətri silmək istədiyinizə əminsiniz?",
    subtotal: "Alt cəm",

    totals: {
      title: "Bugünkü yekun",
      boughtAmount: "Alış məbləği",
      soldAmount: "Satış məbləği",
      profit: "Mənfəət",
    },

    touchedProducts: {
      title: "Bu gün istifadə olunan məhsullar",
      boughtKg: "Alınan (kq)",
      boughtAmount: "Alış məbləği",
      soldKg: "Satılan (kq)",
      soldAmount: "Satış məbləği",
      profit: "Mənfəət",
      empty: "Bu gün hələ məhsul əlavə edilməyib",
      totals: "Cəmi",
    },

    stockNote:
      "Satış mövcud stokla məhdudlaşdırılır (əvvəlki alışlar − satışlar + bugünkü alışlar).",

    validation: {
      emptyFields: "Məhsul, miqdar və qiymət boş ola bilməz",
      duplicateProduct: "Eyni məhsul bir cədvəldə bir dəfədən çox ola bilməz",
      noStock: "Stok kifayət deyil. Mövcud miqdar satışdan azdır.",
    },
  },

  analysis: {
    title: "Analiz",
    subtitle:
      "Məhsullar üzrə ümumi alış, satış və mənfəət (seçilmiş tarix aralığı)",
    product: "Məhsul",
    boughtKg: "Alınan (kq)",
    boughtAmount: "Alış məbləği",
    soldKg: "Satılan (kq)",
    soldAmount: "Satış məbləği",
    profit: "Mənfəət",
    noData: "Məlumat yoxdur",
    loading: "Yüklənir...",
  },

  common: {
    yes: "Bəli",
    no: "Xeyr",
    save: "Yadda saxla",
    cancel: "Ləğv et",
  },
};

export default az;
