/**
 * Bilingual strings for the fundraising rounds module.
 * English is the default; Arabic activates when html[dir="rtl"].
 *
 * Usage:
 *   const t = useRoundsT();
 *   <h1>{t("rounds.title")}</h1>
 *
 * String guidelines:
 *   - Keep Arabic strings right-to-left in the source file.
 *   - Numbers/SAR amounts are formatted by the caller; only label strings live here.
 *   - Cairo font activates automatically via [dir="rtl"] in globals.css.
 */

export type RoundsKey =
  | "rounds.title"
  | "rounds.subtitle"
  | "rounds.new"
  | "rounds.empty.heading"
  | "rounds.empty.body"
  | "rounds.empty.cta"
  | "rounds.col.round"
  | "rounds.col.instrument"
  | "rounds.col.pre_money"
  | "rounds.col.target"
  | "rounds.col.close"
  | "rounds.col.status"
  | "rounds.status.draft"
  | "rounds.status.open"
  | "rounds.status.closed"
  | "rounds.instrument.isafe"
  | "rounds.instrument.safe"
  | "rounds.instrument.convertible_note"
  | "rounds.instrument.ordinary"
  | "round.back"
  | "round.badge.fundraising"
  | "round.section.meta"
  | "round.meta.instrument"
  | "round.meta.pre_money"
  | "round.meta.target"
  | "round.meta.actual"
  | "round.meta.lead"
  | "round.meta.close"
  | "round.meta.resolution"
  | "round.section.investors"
  | "round.add_investor"
  | "round.no_investors"
  | "round.col.investor"
  | "round.col.amount"
  | "round.col.date"
  | "round.pending_conversions"
  | "round.section.pipeline"
  | "round.section.data_room"
  | "round.section.visibility"
  | "round.visibility.title"
  | "round.visibility.body"
  | "round.visibility.live"
  | "round.visibility.draft_warn"
  | "round.visibility.profile_warn"
  | "round.actions.open"
  | "round.actions.close"
  | "round.actions.delete"
  | "round.close.title"
  | "round.close.body"
  | "round.close.pre_money_label"
  | "round.close.fd_shares_label"
  | "round.close.fd_shares_hint"
  | "round.close.actual_label"
  | "round.close.confirm"
  | "round.close.cancel"
  | "round.closed.title"
  | "round.closed.body";

type Translations = Record<RoundsKey, string>;

const en: Translations = {
  "rounds.title": "Fundraising",
  "rounds.subtitle": "Manage your fundraising rounds end-to-end. Open a round, add investors, and close — your cap table updates automatically.",
  "rounds.new": "+ New round",
  "rounds.empty.heading": "No rounds yet.",
  "rounds.empty.body": "Start a round to track investors, instrument terms, and close so your cap table updates in one step.",
  "rounds.empty.cta": "Start your first round",
  "rounds.col.round": "Round",
  "rounds.col.instrument": "Instrument",
  "rounds.col.pre_money": "Pre-money",
  "rounds.col.target": "Target",
  "rounds.col.close": "Close",
  "rounds.col.status": "Status",
  "rounds.status.draft": "Draft",
  "rounds.status.open": "Open",
  "rounds.status.closed": "Closed",
  "rounds.instrument.isafe": "iSAFE",
  "rounds.instrument.safe": "SAFE",
  "rounds.instrument.convertible_note": "Convertible Note",
  "rounds.instrument.ordinary": "Priced Round",
  "round.back": "← All rounds",
  "round.badge.fundraising": "Fundraising round",
  "round.section.meta": "Round details",
  "round.meta.instrument": "Instrument",
  "round.meta.pre_money": "Pre-money valuation",
  "round.meta.target": "Target raise",
  "round.meta.actual": "Actual raised",
  "round.meta.lead": "Lead investor",
  "round.meta.close": "Expected close",
  "round.meta.resolution": "Board resolution",
  "round.section.investors": "Investors in this round",
  "round.add_investor": "+ Add investor",
  "round.no_investors": "No investors linked to this round yet.",
  "round.col.investor": "Investor",
  "round.col.amount": "Amount / Shares",
  "round.col.date": "Date",
  "round.pending_conversions": "unconverted instrument(s) will convert on close",
  "round.section.pipeline": "Investor pipeline",
  "round.section.data_room": "Data room",
  "round.section.visibility": "Public profile",
  "round.visibility.title": "Show on public profile",
  "round.visibility.body": "When on, this round appears on your public Explore page. Only announcement-safe fields are shown.",
  "round.visibility.live": "Live on your public profile.",
  "round.visibility.draft_warn": "Drafts are never shown publicly. Open the round to publish.",
  "round.visibility.profile_warn": "Your public profile is not published.",
  "round.actions.open": "Open round",
  "round.actions.close": "Close round",
  "round.actions.delete": "Delete round",
  "round.close.title": "Close round",
  "round.close.body": "All unconverted iSAFE and SAFE holders will be converted to ordinary shares.",
  "round.close.pre_money_label": "Pre-money valuation (SAR)",
  "round.close.fd_shares_label": "Fully diluted shares pre-round",
  "round.close.fd_shares_hint": "Total existing ordinary + ESOP pool, before this round.",
  "round.close.actual_label": "Actual raise (SAR)",
  "round.close.confirm": "Confirm close",
  "round.close.cancel": "Cancel",
  "round.closed.title": "Round closed",
  "round.closed.body": "All iSAFE and SAFE holders converted to ordinary shares — check the cap table for updated ownership.",
};

const ar: Translations = {
  "rounds.title": "جمع التمويل",
  "rounds.subtitle": "أدِر جولات التمويل من البداية إلى النهاية. افتح جولة، أضف المستثمرين، وأغلقها — ستُحدَّث جدول المساهمين تلقائياً.",
  "rounds.new": "+ جولة جديدة",
  "rounds.empty.heading": "لا توجد جولات بعد.",
  "rounds.empty.body": "ابدأ جولة لتتبع المستثمرين وشروط الصكوك، وعند الإغلاق يتحدث جدول المساهمين بخطوة واحدة.",
  "rounds.empty.cta": "ابدأ جولتك الأولى",
  "rounds.col.round": "الجولة",
  "rounds.col.instrument": "الصك",
  "rounds.col.pre_money": "التقييم القبلي",
  "rounds.col.target": "المستهدف",
  "rounds.col.close": "تاريخ الإغلاق",
  "rounds.col.status": "الحالة",
  "rounds.status.draft": "مسودة",
  "rounds.status.open": "مفتوحة",
  "rounds.status.closed": "مغلقة",
  "rounds.instrument.isafe": "iSAFE",
  "rounds.instrument.safe": "SAFE",
  "rounds.instrument.convertible_note": "سند قابل للتحويل",
  "rounds.instrument.ordinary": "جولة مسعّرة",
  "round.back": "→ كل الجولات",
  "round.badge.fundraising": "جولة تمويلية",
  "round.section.meta": "تفاصيل الجولة",
  "round.meta.instrument": "الصك",
  "round.meta.pre_money": "التقييم القبلي",
  "round.meta.target": "المبلغ المستهدف",
  "round.meta.actual": "المبلغ المُجمَّع فعلياً",
  "round.meta.lead": "المستثمر الرئيسي",
  "round.meta.close": "تاريخ الإغلاق المتوقع",
  "round.meta.resolution": "قرار مجلس الإدارة",
  "round.section.investors": "المستثمرون في هذه الجولة",
  "round.add_investor": "+ إضافة مستثمر",
  "round.no_investors": "لم يتم ربط أي مستثمرين بهذه الجولة بعد.",
  "round.col.investor": "المستثمر",
  "round.col.amount": "المبلغ / الأسهم",
  "round.col.date": "التاريخ",
  "round.pending_conversions": "صك(وك) غير محوّلة ستُحوَّل عند الإغلاق",
  "round.section.pipeline": "خط سير المستثمرين",
  "round.section.data_room": "غرفة البيانات",
  "round.section.visibility": "الملف الشخصي العام",
  "round.visibility.title": "عرض على الملف الشخصي العام",
  "round.visibility.body": "عند التفعيل، تظهر هذه الجولة على صفحة الاستكشاف العامة. تُعرض الحقول الآمنة للإعلان فقط.",
  "round.visibility.live": "ظاهرة على ملفك الشخصي العام.",
  "round.visibility.draft_warn": "المسودات لا تُعرض أبداً للعموم. افتح الجولة أولاً.",
  "round.visibility.profile_warn": "ملفك الشخصي العام غير منشور.",
  "round.actions.open": "فتح الجولة",
  "round.actions.close": "إغلاق الجولة",
  "round.actions.delete": "حذف الجولة",
  "round.close.title": "إغلاق الجولة",
  "round.close.body": "سيتم تحويل جميع صكوك iSAFE وSAFE غير المحوّلة إلى أسهم عادية.",
  "round.close.pre_money_label": "التقييم القبلي (ريال سعودي)",
  "round.close.fd_shares_label": "الأسهم المخفَّفة بالكامل قبل الجولة",
  "round.close.fd_shares_hint": "مجموع الأسهم العادية وبرنامج الأسهم الوظيفي (ESOP) قبل هذه الجولة.",
  "round.close.actual_label": "المبلغ المُجمَّع فعلياً (ريال سعودي)",
  "round.close.confirm": "تأكيد الإغلاق",
  "round.close.cancel": "إلغاء",
  "round.closed.title": "تم إغلاق الجولة",
  "round.closed.body": "تم تحويل جميع حاملي iSAFE وSAFE إلى أسهم عادية — راجع جدول المساهمين للاطلاع على التحديثات.",
};

export const roundsTranslations: Record<"en" | "ar", Translations> = { en, ar };
