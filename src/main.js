// 🔍 دیباگ — بعداً حذف کن
export default async function (context) {
  context.log("=== DEBUG ENV ===");
  context.log("context.env type: " + typeof context.env);
  context.log("context.env keys: " + JSON.stringify(Object.keys(context.env || {})));
  context.log("process.env.BOT_TOKEN exists: " + !!process.env.BOT_TOKEN);
  context.log("context.env.BOT_TOKEN exists: " + !!(context.env || {}).BOT_TOKEN);
  
  return context.res.json({ ok: true, debug: true }, 200);
}
