import { InlineKeyboard } from "grammy";
import { STEPS, SECTION_LABELS, TOTAL_STEPS } from "../constants/questions.js";
import { answerLabel, calcScore, maxScore, getReadinessLevel } from "./score.js";

// منوی اصلی — با دکمه جدید "آخرین تحلیل من"
export function mainMenuKB() {
  return new InlineKeyboard()
    .text("🧠 مشاوره هوشمند کاندیداتوری", "start_consult")
    .row()
    .text("📋 آخرین تحلیل من", "my_report")
    .row()
    .text("📦 پلن‌های خدمات", "show_plans")
    .row()
    .text("📞 ارتباط با ما", "contact")
    .row()
    .text("📊 نمونه تحلیل‌ها", "samples")
    .row()
    .text("ℹ️ درباره ما", "about");
}

export function stepKB(idx) {
  const kb = new InlineKeyboard();
  STEPS[idx].options.forEach((o, i) => {
    kb.text(o.text, `ans_${idx}_${i}`).row();
  });
  kb.text("انصراف و بازگشت", "cancel_consult");
  return kb;
}

export function textStepKB() {
  return new InlineKeyboard().text("انصراف و بازگشت", "cancel_consult");
}

export function summaryKB() {
  const kb = new InlineKeyboard();
  const sections = ["A", "B", "C", "D", "E", "F"];
  sections.forEach((sec) => {
    const firstIdx = STEPS.findIndex((s) => s.section === sec);
    if (firstIdx >= 0) {
      kb.text("ویرایش " + SECTION_LABELS[sec], "edit_section_" + sec).row();
    }
  });
  kb.text("تایید نهایی و دریافت گزارش", "confirm").row();
  kb.text("انصراف", "cancel_consult");
  return kb;
}

export function editCancelKB() {
  return new InlineKeyboard().text("انصراف از ویرایش", "back_summary");
}

export function afterReportKB() {
  return new InlineKeyboard()
    .text("📦 مشاهده پلن‌ها", "show_plans")
    .row()
    .text("📞 ارتباط با ما", "contact")
    .row()
    .text("🔄 مشاوره جدید", "start_consult")
    .row()
    .text("🏠 منوی اصلی", "main_menu");
}

export function backKB() {
  return new InlineKeyboard().text("🏠 بازگشت به منوی اصلی", "main_menu");
}

export function buildSummaryText(answers, score) {
  const max = maxScore();
  const readiness = getReadinessLevel(score);
  const fullName = answers.fullName || "---";

  let txt = "خلاصه اطلاعات شما\n";
  txt += "نام: " + fullName + "\n";
  txt += "━━━━━━━━━━━━━━━━━━━━━\n\n";

  const sections = ["A", "B", "C", "D", "E", "F"];
  for (const sec of sections) {
    const secSteps = STEPS.filter((s) => s.section === sec);
    txt += SECTION_LABELS[sec] + ":\n";

    secSteps.forEach((step) => {
      const raw = answers[step.key];
      let display;
      if (step.type === "text") {
        display = raw ? (raw.length > 40 ? raw.substring(0, 40) + "..." : raw) : "---";
      } else {
        display = answerLabel(raw);
      }
      txt += "  - " + display + "\n";
    });
    txt += "\n";
  }

  txt += "━━━━━━━━━━━━━━━━━━━━━\n";
  txt += "امتیاز: " + score + " از " + max + " (" + Math.round(readiness.percent) + "%)\n";
  txt += "سطح: " + readiness.label + "\n\n";
  txt += "تایید نهایی بزنید یا بخش مورد نظر را ویرایش کنید";

  return txt;
}
