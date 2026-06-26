import {
  createContext,
  useContext,
  useState,
  useEffect,
  type ReactNode,
} from "react";

export type Lang = "vi" | "en" | "fr";

const LANG_LABELS: Record<Lang, string> = {
  vi: "vi",
  en: "en",
  fr: "fr",
};

const translations: Record<Lang, Record<string, string>> = {
  vi: {
    brand: "🎓 tốt nghiệp của khoai",
    "nav.hero": ".in đét",
    "nav.countdown": ".đếm ngược",
    "nav.gallery": ".ảnh",
    "nav.checkin": ".check-in",
    "potato.title": "chỗ này của khoai",

    "hero.title.prefix": "khoai ",
    "hero.title.highlight": "TỐT NGHIỆP",
    "hero.title.suffix": " ròiii!",
    "hero.subtitle": "🎉 tới lúc khoai cúc khỏi cái trường này 🎉",
    "hero.viewPhotos": "📸 xem ảnh",
    "hero.checkinNow": "🎟 check-in ngay",

    "countdown.remaining": "⏳ còn",
    "countdown.days": "ngày",
    "countdown.hours": "giờ",
    "countdown.minutes": "phút",
    "countdown.seconds": "giây",
    "countdown.upcomingTitle": "🎉 tới lễ tốt nghiệp của khoai 🎉",
    "countdown.ongoingTitle": "🎉 lễ tốt nghiệp của khoai đang diễn ra! 🎉",
    "countdown.doneMessage": "cảm ơn mọi người đã đến chúc mừng!",
    "countdown.until": "đến {title}!",

    "gallery.title": "📸 khoảnh khắc tốt nghiệp",
    "gallery.subtitle":
      "những tấm hình đẹp nhất trong ngày lễ tốt nghiệp của khoai",
    "gallery.uploadPrompt":
      "gửi ảnh bạn đã chụp cùng khoai để lưu lại kỷ niệm nhaa 🫶",
    "gallery.dropHere": "kéo thả ảnh vào đây",
    "gallery.clickToSelect": "hoặc click để chọn ảnh",
    "gallery.uploadAll": "⬆️ tải lên tất cả",
    "gallery.photosCount": "{count} ảnh",
    "gallery.pending": "({count} chưa tải lên)",
    "gallery.uploadBtn": "⬆️ tải lên",
    "gallery.thanks": "cảm ơn bạn! ảnh đã được gửi vào album của khoai 🎉",
    "gallery.noPhotos": "chưa có ảnh nào được public, chờ khoai xíu nghen.",
    "gallery.carousel": "carousel",
    "gallery.grid": "lưới",
    "gallery.nicknameLabel": "biệt danh của bạn (tùy chọn)",
    "gallery.nicknamePlaceholder": "cukhoaitaykhonglo",
    "gallery.feedbackLabel": "lời nhắn (tùy chọn)",
    "gallery.feedbackPlaceholder": "lễ tốt nghiệp thật tuyệt!",

    "checkin.title": "🎟 check-in",
    "checkin.description":
      "nhận code bí mật - tới check-in để nhận quà của khoaiii!",
    "checkin.nickname": "nickname",
    "checkin.nicknamePlaceholder": "cukhoaitaykhonglo",
    "checkin.emailLabel": "email nhận code",
    "checkin.emailPlaceholder": "cukhoaitaykhonglo69@gmail.com",
    "checkin.getCode": "🎟 nhận code",
    "checkin.loading": "⏳ đang xử lý...",
    "checkin.security":
      "🔒 thông tin của bạn được bảo mật. code sẽ được gửi qua email.",
    "checkin.success": "thành công!",
    "checkin.yourCode": "mã bí mật của bạn là:",
    "checkin.copyTitle": "copy mã",
    "checkin.emailSent":
      "📧 mã đã được gửi đến email của bạn. nếu không thấy email, thử kiểm tra trong spam nhé!",
    "checkin.bringCode":
      "hãy mang mã này đến {title} để nhận quà từ khoai nhooo! 🎁",
    "checkin.errorRequired": "vui lòng điền đầy đủ thông tin!",
    "checkin.errorNoCode": "hết code rồi! liên hệ admin để được cấp thêm.",
    "checkin.errorGeneric": "có lỗi xảy ra: {msg}",
    "checkin.emailExists":
      "ối dồi ôi! email có code bí mật rồi mà còn đòi thêm nữa hả?? về kiểm tra hòm thư (hoặc spam) của bạn điii, đừng có tham nha 🧐",

    "footer.text": "🎓 tạo bởi tình iu cho ngày tốt nghiệp của khoai • 2026",
    "footer.quote": '"chúng ta tồn tại để thắc mắc về lí do tồn tại"',

    "admin.title": "🥔 chỗ này của khoai, đừng có vô",
    "admin.passPlaceholder": "mật khẩu admin",
    "admin.login": "đăng nhập",
    "admin.wrongPass": "sai mật khẩu!",
    "admin.tab.event": "📋 sự kiện",
    "admin.tab.checkins": "✅ check-ins",
    "admin.tab.photos": "📸 ảnh",
    "admin.tab.codes": "🔑 codes",
    "admin.tab.password": "🔐 mật khẩu",
    "admin.eventName": "tên sự kiện",
    "admin.date": "ngày",
    "admin.time": "giờ",
    "admin.location": "địa điểm",
    "admin.notes": "ghi chú / lưu ý",
    "admin.save": "💾 lưu thông tin",
    "admin.saving": "💾 đang lưu...",
    "admin.confirm": "xác nhận",
    "admin.undo": "hoàn tác",
    "admin.captionPlaceholder": "chú thích...",
    "admin.upload": "📤 tải lên",
    "admin.public": "public",
    "admin.pending": "pending",
    "admin.hide": "🔒 ẩn",
    "admin.approve": "✅ duyệt",
    "admin.changePassTitle": "🔐 đổi mật khẩu admin",
    "admin.newPassPlaceholder": "mật khẩu mới (≥6 ký tự)",
    "admin.confirmPassPlaceholder": "nhập lại mật khẩu mới",
    "admin.changePassBtn": "đổi mật khẩu",
    "admin.cancel": "huỷ",
    "admin.confirmPassChange": "xác nhận",
    "admin.codeCount": "số lượng mã:",
    "admin.generate": "🎲 tạo mã",
    "admin.passTooShort": "mật khẩu phải có ít nhất 6 ký tự!",
    "admin.passMismatch": "mật khẩu nhập lại không khớp!",
    "admin.passChanged": "đã đổi mật khẩu thành công!",
    "admin.codesGenerated": "đã tạo {count} mã code mới!",
    "admin.delete": "🗑",
    "admin.used": "used",
    "admin.available": "available",
    "admin.nickname": "nickname",
    "admin.email": "email",
    "admin.code": "code",
    "admin.confirmed": "confirmed",
    "admin.action": "action",
    "admin.status": "status",
    "admin.assignedTo": "assigned to",
    "admin.tab.hero": "🖼 hero ảnh",
    "admin.tab.feedback": "💬 feedback",
    "admin.heroTitle": "🖼 ảnh đại diện hero",
    "admin.heroDesc":
      "ảnh này sẽ hiển thị ở phần hero đầu trang thay cho ảnh mặc định.",
    "admin.heroUpload": "📤 tải lên",
    "admin.heroUploading": "⏳ đang tải...",
    "admin.heroDelete": "🗑 xoá ảnh",
    "admin.heroSuccess": "✅ đã tải lên ảnh hero thành công!",
    "admin.heroFail": "❌ tải lên thất bại!",
    "admin.heroConfirmDelete": "xoá ảnh hero?",
    "admin.optional": "không bắt buộc",
    "admin.requiredField": "bắt buộc",
    "admin.feedbackTime": "thời gian",
  },
  en: {
    brand: "🎓 khoai's grad",
    "nav.hero": ".index",
    "nav.countdown": ".countdown",
    "nav.gallery": ".photos",
    "nav.checkin": ".check-in",
    "potato.title": "this is khoai's spot",

    "hero.title.prefix": "khoai ",
    "hero.title.highlight": "has GRADUATED!",
    "hero.title.suffix": "",
    "hero.subtitle": "🎉 time for khoai to get out of this university 🎉",
    "hero.viewPhotos": "📸 view photos",
    "hero.checkinNow": "🎟 check-in now",

    "countdown.remaining": "⏳ remaining",
    "countdown.days": "days",
    "countdown.hours": "hours",
    "countdown.minutes": "minutes",
    "countdown.seconds": "seconds",
    "countdown.upcomingTitle": "🎉 countdown to khoai's graduation 🎉",
    "countdown.ongoingTitle": "🎉 khoai's graduation is happening now! 🎉",
    "countdown.doneMessage": "thank you everyone for coming!",
    "countdown.until": "until {title}!",

    "gallery.title": "📸 graduation moments",
    "gallery.subtitle": "the best photos from khoai's graduation day",
    "gallery.uploadPrompt":
      "share photos you took with khoai to save the memories 🫶",
    "gallery.dropHere": "drop photos here",
    "gallery.clickToSelect": "or click to select photos",
    "gallery.uploadAll": "⬆️ upload all",
    "gallery.photosCount": "{count} photos",
    "gallery.pending": "({count} not uploaded yet)",
    "gallery.uploadBtn": "⬆️ upload",
    "gallery.thanks": "thank you! photos have been added to khoai's album 🎉",
    "gallery.noPhotos": "no public photos yet, wait for khoai a bit.",
    "gallery.carousel": "carousel",
    "gallery.grid": "grid",
    "gallery.nicknameLabel": "your nickname (optional)",
    "gallery.nicknamePlaceholder": "agiantpotato",
    "gallery.feedbackLabel": "your message (optional)",
    "gallery.feedbackPlaceholder": "the graduation ceremony was wonderful!",

    "checkin.title": "🎟 check-in",
    "checkin.description":
      "get your secret code - check in to get khoai's gifts!",
    "checkin.nickname": "nickname",
    "checkin.nicknamePlaceholder": "agiantpotato",
    "checkin.emailLabel": "email to receive code",
    "checkin.emailPlaceholder": "agiantpotato69@gmail.com",
    "checkin.getCode": "🎟 get code",
    "checkin.loading": "⏳ processing...",
    "checkin.security":
      "🔒 your information is secure. code will be sent via email.",
    "checkin.success": "success!",
    "checkin.yourCode": "your secret code is:",
    "checkin.copyTitle": "copy code",
    "checkin.emailSent":
      "📧 code has been sent to your email. check spam if you don't see it!",
    "checkin.bringCode": "bring this code to {title} to get khoai's gifts! 🎁",
    "checkin.errorRequired": "please fill in all required fields!",
    "checkin.errorNoCode": "no more codes! contact admin for more.",
    "checkin.errorGeneric": "an error occurred: {msg}",
    "checkin.emailExists":
      "hey hey hey! email already got a secret code! go check your inbox (or spam), you greedy potato 🥔🧐",

    "footer.text": "🎓 made with luv for khoai's graduation • 2026",
    "footer.quote": '"we exist to question the meaning of existence"',

    "admin.title": "🥔 this is khoai's spot, don't come in",
    "admin.passPlaceholder": "admin password",
    "admin.login": "login",
    "admin.wrongPass": "wrong password!",
    "admin.tab.event": "📋 event",
    "admin.tab.checkins": "✅ check-ins",
    "admin.tab.photos": "📸 photos",
    "admin.tab.codes": "🔑 codes",
    "admin.tab.password": "🔐 password",
    "admin.eventName": "event name",
    "admin.date": "date",
    "admin.time": "time",
    "admin.location": "location",
    "admin.notes": "notes",
    "admin.save": "💾 save settings",
    "admin.saving": "💾 saving...",
    "admin.confirm": "confirm",
    "admin.undo": "undo",
    "admin.captionPlaceholder": "caption...",
    "admin.upload": "📤 upload",
    "admin.public": "public",
    "admin.pending": "pending",
    "admin.hide": "🔒 hide",
    "admin.approve": "✅ approve",
    "admin.changePassTitle": "🔐 change admin password",
    "admin.newPassPlaceholder": "new password (≥6 characters)",
    "admin.confirmPassPlaceholder": "confirm new password",
    "admin.changePassBtn": "change password",
    "admin.cancel": "cancel",
    "admin.confirmPassChange": "confirm",
    "admin.codeCount": "code count:",
    "admin.generate": "🎲 generate",
    "admin.passTooShort": "password must be at least 6 characters!",
    "admin.passMismatch": "passwords do not match!",
    "admin.passChanged": "password changed successfully!",
    "admin.codesGenerated": "generated {count} new codes!",
    "admin.delete": "🗑",
    "admin.used": "used",
    "admin.available": "available",
    "admin.nickname": "nickname",
    "admin.email": "email",
    "admin.code": "code",
    "admin.confirmed": "confirmed",
    "admin.action": "action",
    "admin.status": "status",
    "admin.assignedTo": "assigned to",
    "admin.tab.hero": "🖼 hero image",
    "admin.tab.feedback": "💬 feedback",
    "admin.heroTitle": "🖼 hero image",
    "admin.heroDesc":
      "this image will be displayed in the hero section instead of the default.",
    "admin.heroUpload": "📤 upload",
    "admin.heroUploading": "⏳ uploading...",
    "admin.heroDelete": "🗑 delete",
    "admin.heroSuccess": "✅ hero image uploaded successfully!",
    "admin.heroFail": "❌ upload failed!",
    "admin.heroConfirmDelete": "delete hero image?",
    "admin.optional": "optional",
    "admin.requiredField": "required",
    "admin.feedbackTime": "time",
  },
  fr: {
    brand: "🎓 diplôme de khoai",
    "nav.hero": ".index",
    "nav.countdown": ".compte à rebours",
    "nav.gallery": ".photos",
    "nav.checkin": ".enregistrement",
    "potato.title": "c'est la place de khoai",

    "hero.title.prefix": "khoai ",
    "hero.title.highlight": "a OBTENU SON DIPLÔME!",
    "hero.title.suffix": "",
    "hero.subtitle": "🎉 il est temps pour khoai de quitter cette école 🎉",
    "hero.viewPhotos": "📸 voir les photos",
    "hero.checkinNow": "🎟 enregistrez-vous",

    "countdown.remaining": "⏳ restant",
    "countdown.days": "jours",
    "countdown.hours": "heures",
    "countdown.minutes": "minutes",
    "countdown.seconds": "secondes",
    "countdown.upcomingTitle":
      "🎉 compte à rebours pour le diplôme de khoai 🎉",
    "countdown.ongoingTitle":
      "🎉 la remise de diplôme de khoai est en cours! 🎉",
    "countdown.doneMessage": "merci à tous d'être venus!",
    "countdown.until": "jusqu'à {title}!",

    "gallery.title": "📸 moments de diplôme",
    "gallery.subtitle":
      "les meilleures photos du jour de la remise des diplômes de khoai",
    "gallery.uploadPrompt":
      "partagez les photos que vous avez prises avec khoai pour garder les souvenirs 🫶",
    "gallery.dropHere": "déposez les photos ici",
    "gallery.clickToSelect": "ou cliquez pour sélectionner des photos",
    "gallery.uploadAll": "⬆️ tout télécharger",
    "gallery.photosCount": "{count} photos",
    "gallery.pending": "({count} pas encore téléchargé)",
    "gallery.uploadBtn": "⬆️ télécharger",
    "gallery.thanks":
      "merci! les photos ont été ajoutées à l'album de khoai 🎉",
    "gallery.noPhotos": "pas encore de photos publiques, attendez un peu.",
    "gallery.carousel": "carrousel",
    "gallery.grid": "grille",
    "gallery.nicknameLabel": "votre pseudo (optionnel)",
    "gallery.nicknamePlaceholder": "unepommedeterregeante",
    "gallery.feedbackLabel": "votre message (optionnel)",
    "gallery.feedbackPlaceholder":
      "la cérémonie de remise des diplômes était magnifique!",

    "checkin.title": "🎟 enregistrement",
    "checkin.description":
      "obtenez votre code secret - enregistrez-vous pour recevoir les cadeaux de khoai!",
    "checkin.nickname": "pseudo",
    "checkin.nicknamePlaceholder": "unepommedeterregeante",
    "checkin.emailLabel": "email pour recevoir le code",
    "checkin.emailPlaceholder": "unepommedeterregeante69@gmail.com",
    "checkin.getCode": "🎟 obtenir le code",
    "checkin.loading": "⏳ traitement...",
    "checkin.security":
      "🔒 vos informations sont sécurisées. le code sera envoyé par email.",
    "checkin.success": "succès!",
    "checkin.yourCode": "votre code secret est :",
    "checkin.copyTitle": "copier le code",
    "checkin.emailSent":
      "📧 le code a été envoyé à votre email. vérifiez les spams si vous ne le voyez pas!",
    "checkin.bringCode":
      "apportez ce code à {title} pour recevoir le cadeau de khoai! 🎁",
    "checkin.errorRequired": "veuillez remplir tous les champs obligatoires!",
    "checkin.errorNoCode": "plus de codes! contactez l'administrateur.",
    "checkin.errorGeneric": "une erreur est survenue : {msg}",
    "checkin.emailExists":
      "oho! l'email a déjà un code secret! va vérifier ta boîte de réception (ou les spams), espèce de patate gourmande 🥔🧐",

    "footer.text":
      "🎓 fait avec amour pour la remise des diplômes de khoai • 2026",
    "footer.quote": '"nous existons pour questionner le sens de l\'existence."',

    "admin.title": "🥔 c'est la place de khoai, n'entrez pas",
    "admin.passPlaceholder": "mot de passe admin",
    "admin.login": "connexion",
    "admin.wrongPass": "mot de passe incorrect!",
    "admin.tab.event": "📋 événement",
    "admin.tab.checkins": "✅ enregistrements",
    "admin.tab.photos": "📸 photos",
    "admin.tab.codes": "🔑 codes",
    "admin.tab.password": "🔐 mot de passe",
    "admin.eventName": "nom de l'événement",
    "admin.date": "date",
    "admin.time": "heure",
    "admin.location": "lieu",
    "admin.notes": "notes",
    "admin.save": "💾 enregistrer",
    "admin.saving": "💾 enregistrement...",
    "admin.confirm": "confirmer",
    "admin.undo": "annuler",
    "admin.captionPlaceholder": "légende...",
    "admin.upload": "📤 télécharger",
    "admin.public": "public",
    "admin.pending": "en attente",
    "admin.hide": "🔒 cacher",
    "admin.approve": "✅ approuver",
    "admin.changePassTitle": "🔐 changer le mot de passe admin",
    "admin.newPassPlaceholder": "nouveau mot de passe (≥6 caractères)",
    "admin.confirmPassPlaceholder": "confirmer le nouveau mot de passe",
    "admin.changePassBtn": "changer le mot de passe",
    "admin.cancel": "annuler",
    "admin.confirmPassChange": "confirmer",
    "admin.codeCount": "nombre de codes :",
    "admin.generate": "🎲 générer",
    "admin.passTooShort":
      "le mot de passe doit contenir au moins 6 caractères!",
    "admin.passMismatch": "les mots de passe ne correspondent pas!",
    "admin.passChanged": "mot de passe changé avec succès!",
    "admin.codesGenerated": "{count} nouveaux codes générés!",
    "admin.delete": "🗑",
    "admin.used": "utilisé",
    "admin.available": "disponible",
    "admin.nickname": "pseudo",
    "admin.email": "email",
    "admin.code": "code",
    "admin.confirmed": "confirmé",
    "admin.action": "action",
    "admin.status": "statut",
    "admin.assignedTo": "assigné à",
    "admin.tab.hero": "🖼 image hero",
    "admin.tab.feedback": "💬 feedback",
    "admin.heroTitle": "🖼 image hero",
    "admin.heroDesc":
      "cette image sera affichée dans la section hero à la place de l'image par défaut.",
    "admin.heroUpload": "📤 télécharger",
    "admin.heroUploading": "⏳ téléchargement...",
    "admin.heroDelete": "🗑 supprimer",
    "admin.heroSuccess": "✅ image hero téléchargée avec succès!",
    "admin.heroFail": "❌ échec du téléchargement!",
    "admin.heroConfirmDelete": "supprimer l'image hero ?",
    "admin.optional": "optionnel",
    "admin.requiredField": "obligatoire",
    "admin.feedbackTime": "date",
  },
};

export function t(
  lang: Lang,
  key: string,
  vars?: Record<string, string | number>,
): string {
  let text = translations[lang]?.[key] ?? translations["vi"][key] ?? key;
  if (vars) {
    for (const [k, v] of Object.entries(vars)) {
      text = text.replace(`{${k}}`, String(v));
    }
  }
  return text;
}

interface I18nContextType {
  lang: Lang;
  setLang: (lang: Lang) => void;
  t: (key: string, vars?: Record<string, string | number>) => string;
  LANG_LABELS: Record<Lang, string>;
}

const I18nContext = createContext<I18nContextType | null>(null);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<Lang>("vi");

  useEffect(() => {
    document.documentElement.lang = lang;
    const titles: Record<Lang, string> = {
      vi: "tốt nghiệp của khoai",
      en: "khoai's graduation",
      fr: "diplôme de khoai",
    };
    document.title = titles[lang];
  }, [lang]);

  const translate = (key: string, vars?: Record<string, string | number>) =>
    t(lang, key, vars);

  return (
    <I18nContext.Provider value={{ lang, setLang, t: translate, LANG_LABELS }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used within I18nProvider");
  return ctx;
}
