/* Textes et libellés de l'écran « Donner un avis » — aucun texte en dur dans les composants. */

export const CRITERES_AVIS = [
  { id: "hygiene", label: "Hygiène" },
  { id: "accueil", label: "Accueil" },
  { id: "presentation", label: "Présentation du personnel" },
] as const;

export type CritereAvisId = (typeof CRITERES_AVIS)[number]["id"];

/** Étiquette affichée sous les étoiles selon la note 1–5. */
export const ETIQUETTES_NOTE = ["Insuffisant", "Moyen", "Correct", "Très bien", "Excellent"] as const;

/** Puces de motif affichées quand une note vaut 2 étoiles ou moins. */
export const PUCES_PLAINTES = ["Propreté des lieux", "Attente trop longue", "Accueil froid", "Tenue du personnel", "Autre"] as const;

/** Suggestions de début de commentaire, proposées selon les bonnes notes déjà données. */
export const SUGGESTIONS_COMMENTAIRE = ["Service impeccable", "Salle très propre", "Accueil chaleureux", "Personnel soigné"] as const;

export const TEXTES_AVIS = {
  titre: "Donner un avis",
  visite: (date: string) => `Visite du ${date}`,
  etapeNotes: "1. Notez votre expérience",
  etapeCommentaire: "2. Votre commentaire",
  etapePhotos: "3. Ajoutez des photos",
  optionnel: "optionnel",
  placeholderCommentaire: "Partagez votre expérience en quelques mots...",
  rappelCourtoisie: "Restez courtois : les avis injurieux sont refusés.",
  questionPlaint: "Que s'est-il passé ?",
  ajouterPhotos: "Ajouter des photos",
  prendrePhoto: "Prendre une photo",
  choisirGalerie: "Choisir dans la galerie",
  infoPhotos: "Évitez de photographier des personnes sans leur accord.",
  publier: "Publier mon avis",
  enCours: "Publication en cours...",
  enregistrer: "Enregistrer les modifications",
  succesTitre: "Merci pour votre avis !",
  succesTexte: "Il sera publié après vérification, généralement sous 24 heures.",
  succesContribution: "Votre avis aide d'autres usagers à choisir en confiance.",
  retourReservations: "Retour à mes réservations",
  explorerAutres: "Explorer d'autres établissements",
  refusTitre: "Votre avis n'a pas pu être publié",
  refusAction: "Modifier mon avis et le renvoyer",
  dejaNoteTitre: "Vous avez déjà donné votre avis",
  dejaNoteAction: "Voir mon avis publié",
  delaiDepasseTitre: "Délai dépassé",
  delaiDepasseTexte: "Le délai pour donner votre avis est de 30 jours après la visite.",
  pasDeVisiteTitre: "Pas encore de visite",
  pasDeVisiteTexte: "Vous pourrez donner votre avis après votre visite.",
  codeVisite: "J'ai un code de visite (QR ou ticket)",
  quitterTitre: "Quitter sans publier ?",
  quitterTexte: "Vos notes et votre commentaire seront conservés en brouillon.",
  quitterRester: "Rester",
  quitterQuitter: "Quitter",
  horsLigne: "Avis enregistré, envoi dès que la connexion revient.",
} as const;

export const MAX_PHOTOS = 4;
export const MAX_TAILLE_PHOTO = 5 * 1024 * 1024;
export const LARGEUR_PHOTO = 1600;
export const DELAI_AVIS_JOURS = 30;
export const DELAI_MODIFICATION_JOURS = 7;

/* ---------- Traductions de l'écran avis (fr = source ci-dessus) ---------- */
import type { Langue } from "./langue.ts";

export const CRITERES_AVIS_I18N: Record<Langue, { id: CritereAvisId; label: string }[]> = {
  fr: [...CRITERES_AVIS],
  en: [
    { id: "hygiene", label: "Hygiene" },
    { id: "accueil", label: "Welcome" },
    { id: "presentation", label: "Staff presentation" },
  ],
  es: [
    { id: "hygiene", label: "Higiene" },
    { id: "accueil", label: "Acogida" },
    { id: "presentation", label: "Presentación del personal" },
  ],
  ar: [
    { id: "hygiene", label: "النظافة الصحية" },
    { id: "accueil", label: "الاستقبال" },
    { id: "presentation", label: "مظهر الموظفين" },
  ],
  zh: [
    { id: "hygiene", label: "卫生" },
    { id: "accueil", label: "接待" },
    { id: "presentation", label: "员工仪容" },
  ],
};

export const ETIQUETTES_NOTE_I18N: Record<Langue, readonly string[]> = {
  fr: ETIQUETTES_NOTE,
  en: ["Insufficient", "Fair", "Good", "Very good", "Excellent"],
  es: ["Insuficiente", "Regular", "Correcto", "Muy bien", "Excelente"],
  ar: ["غير كافٍ", "متوسط", "جيد", "جيد جداً", "ممتاز"],
  zh: ["不足", "一般", "不错", "很好", "优秀"],
};

export const PUCES_PLAINTES_I18N: Record<Langue, readonly string[]> = {
  fr: PUCES_PLAINTES,
  en: ["Cleanliness of the place", "Wait too long", "Cold welcome", "Staff attire", "Other"],
  es: ["Limpieza del lugar", "Espera demasiado larga", "Acogida fría", "Uniforme del personal", "Otro"],
  ar: ["نظافة المكان", "انتظار طويل جداً", "استقبال بارد", "مظهر الموظفين", "أخرى"],
  zh: ["场所卫生", "等待太久", "接待冷淡", "员工着装", "其他"],
};

export const SUGGESTIONS_I18N: Record<Langue, readonly string[]> = {
  fr: SUGGESTIONS_COMMENTAIRE,
  en: ["Impeccable service", "Very clean room", "Warm welcome", "Neat staff"],
  es: ["Servicio impecable", "Sala muy limpia", "Acogida cálida", "Personal cuidado"],
  ar: ["خدمة لا تشوبها شائبة", "قاعة نظيفة جداً", "استقبال حار", "طاقم مرتب"],
  zh: ["服务无可挑剔", "房间非常干净", "热情接待", "员工整洁"],
};

const TEXTES_EN = {
  titre: "Leave a review",
  visite: (date: string) => `Your visit on ${date}`,
  etapeNotes: "1. Rate your experience",
  etapeCommentaire: "2. Your comment",
  etapePhotos: "3. Add photos",
  optionnel: "optional",
  placeholderCommentaire: "Share your experience in a few words...",
  rappelCourtoisie: "Stay courteous: abusive reviews are rejected.",
  questionPlaint: "What went wrong?",
  ajouterPhotos: "Add photos",
  prendrePhoto: "Take a photo",
  choisirGalerie: "Choose from gallery",
  infoPhotos: "Avoid photographing people without their consent.",
  publier: "Publish my review",
  enCours: "Publishing...",
  enregistrer: "Save changes",
  succesTitre: "Thanks for your review!",
  succesTexte: "It will be published after verification, usually within 24 hours.",
  succesContribution: "Your review helps other users choose with confidence.",
  retourReservations: "Back to my bookings",
  explorerAutres: "Explore other establishments",
  refusTitre: "Your review could not be published",
  refusAction: "Edit my review and resend",
  dejaNoteTitre: "You've already left your review",
  dejaNoteAction: "See my published review",
  delaiDepasseTitre: "Deadline exceeded",
  delaiDepasseTexte: "Reviews can be left within 30 days of the visit.",
  pasDeVisiteTitre: "No visit yet",
  pasDeVisiteTexte: "You can leave your review after your visit.",
  codeVisite: "I have a visit code (QR or ticket)",
  quitterTitre: "Leave without publishing?",
  quitterTexte: "Your ratings and comment will be kept as a draft.",
  quitterRester: "Stay",
  quitterQuitter: "Leave",
  horsLigne: "Review saved, it will be sent once you're back online.",
} as const;

const TEXTES_ES = {
  titre: "Dejar una opinión",
  visite: (date: string) => `Tu visita del ${date}`,
  etapeNotes: "1. Valora tu experiencia",
  etapeCommentaire: "2. Tu comentario",
  etapePhotos: "3. Añade fotos",
  optionnel: "opcional",
  placeholderCommentaire: "Comparte tu experiencia en pocas palabras...",
  rappelCourtoisie: "Sé cortés: las opiniones ofensivas se rechazan.",
  questionPlaint: "¿Qué pasó?",
  ajouterPhotos: "Añadir fotos",
  prendrePhoto: "Tomar una foto",
  choisirGalerie: "Elegir de la galería",
  infoPhotos: "Evita fotografiar personas sin su permiso.",
  publier: "Publicar mi opinión",
  enCours: "Publicando...",
  enregistrer: "Guardar cambios",
  succesTitre: "¡Gracias por tu opinión!",
  succesTexte: "Se publicará tras la verificación, normalmente en 24 horas.",
  succesContribution: "Tu opinión ayuda a otros usuarios a elegir con confianza.",
  retourReservations: "Volver a mis reservas",
  explorerAutres: "Explorar otros establecimientos",
  refusTitre: "Tu opinión no pudo publicarse",
  refusAction: "Editar mi opinión y reenviar",
  dejaNoteTitre: "Ya dejaste tu opinión",
  dejaNoteAction: "Ver mi opinión publicada",
  delaiDepasseTitre: "Plazo superado",
  delaiDepasseTexte: "Las opiniones se pueden dejar dentro de los 30 días de la visita.",
  pasDeVisiteTitre: "Aún sin visita",
  pasDeVisiteTexte: "Podrás dejar tu opinión después de tu visita.",
  codeVisite: "Tengo un código de visita (QR o ticket)",
  quitterTitre: "¿Salir sin publicar?",
  quitterTexte: "Tus notas y tu comentario se guardarán como borrador.",
  quitterRester: "Quedarse",
  quitterQuitter: "Salir",
  horsLigne: "Opinión guardada, se enviará cuando vuelva la conexión.",
} as const;

const TEXTES_AR = {
  titre: "أترك رأيك",
  visite: (date: string) => `زيارتك في ${date}`,
  etapeNotes: "1. قيّم تجربتك",
  etapeCommentaire: "2. تعليقك",
  etapePhotos: "3. أضف صوراً",
  optionnel: "اختياري",
  placeholderCommentaire: "شارك تجربتك في بضع كلمات...",
  rappelCourtoisie: "التزم اللباقة: الآراء المسيئة مرفوضة.",
  questionPlaint: "ماذا حدث؟",
  ajouterPhotos: "إضافة صور",
  prendrePhoto: "التقط صورة",
  choisirGalerie: "اختر من المعرض",
  infoPhotos: "تجنّب تصوير الأشخاص دون موافقتهم.",
  publier: "انشر رأيي",
  enCours: "جارٍ النشر...",
  enregistrer: "حفظ التعديلات",
  succesTitre: "شكراً لرأيك!",
  succesTexte: "سيتم نشره بعد التحقق، عادة خلال 24 ساعة.",
  succesContribution: "رأيك يساعد المستخدمين الآخرين على الاختيار بثقة.",
  retourReservations: "العودة إلى حجوزاتي",
  explorerAutres: "استكشف مؤسسات أخرى",
  refusTitre: "تعذّر نشر رأيك",
  refusAction: "عدّل رأيي وأعد إرساله",
  dejaNoteTitre: "لقد أرسلت رأيك بالفعل",
  dejaNoteAction: "عرض رأيي المنشور",
  delaiDepasseTitre: "انتهت المهلة",
  delaiDepasseTexte: "يمكن إبداء الرأي خلال 30 يوماً من الزيارة.",
  pasDeVisiteTitre: "لا توجد زيارة بعد",
  pasDeVisiteTexte: "يمكنك إبداء رأيك بعد زيارتك.",
  codeVisite: "لديّ رمز زيارة (QR أو تذكرة)",
  quitterTitre: "المغادرة دون نشر؟",
  quitterTexte: "سيتم الاحتفاظ بتقييماتك وتعليقك كمسودة.",
  quitterRester: "البقاء",
  quitterQuitter: "مغادرة",
  horsLigne: "تم حفظ الرأي، سيُرسل فور عودة الاتصال.",
} as const;

export type TextesAvis = { [K in keyof typeof TEXTES_EN]: (typeof TEXTES_EN)[K] extends string ? string : (typeof TEXTES_EN)[K] };

/** zh rempli automatiquement ; repli anglais sur les clés absentes. */
const TEXTES_ZH: Partial<TextesAvis> = {
  titre: "发表评价",
  visite: (date: string) => `您在${date}的访问`,
  etapeNotes: "1. 评价您的体验",
  etapeCommentaire: "2. 您的评论",
  etapePhotos: "3. 添加照片",
  optionnel: "可选项",
  placeholderCommentaire: "用几句话分享您的体验……",
  rappelCourtoisie: "保持礼貌：侮辱性评价将被拒绝。",
  questionPlaint: "什么地方错了？ ",
  ajouterPhotos: "添加图片",
  prendrePhoto: "拍一张照片",
  choisirGalerie: "从相簿选择",
  infoPhotos: "避免在未经他人同意的情况下拍照。",
  publier: "发布我的评价",
  enCours: "发布中...",
  enregistrer: "保存修改",
  succesTitre: "感谢您的评论",
  succesTexte: "它将在验证后发布，通常在24小时内。",
  succesContribution: "您的评价有助于其他用户放心选择。",
  retourReservations: "返回我的预订",
  explorerAutres: "浏览其他机构",
  refusTitre: "您的评价无法发布",
  refusAction: "编辑我的评价并重新发送",
  dejaNoteTitre: "您已撰写评价",
  dejaNoteAction: "查看我发布的评价",
  delaiDepasseTitre: "已超过截止日期",
  delaiDepasseTexte: "您可以在体验开始后30天内撰写评价。",
  pasDeVisiteTitre: "暂无访视",
  pasDeVisiteTexte: "访问结束后，您可以发表评价。",
  codeVisite: "我有访问代码（二维码或门票）",
  quitterTitre: "离开而不发布？",
  quitterTexte: "您的评分和评论将保留为草稿。",
  quitterRester: "留下",
  quitterQuitter: "离开",
  horsLigne: "评价已保存，重新上线后将发送给您。",
};

/** Textes de l'écran avis par langue. */
export const TEXTES_AVIS_I18N: Record<Langue, TextesAvis> = {
  fr: TEXTES_AVIS,
  en: TEXTES_EN,
  es: TEXTES_ES,
  ar: TEXTES_AR,
  zh: { ...TEXTES_EN, ...TEXTES_ZH },
};
