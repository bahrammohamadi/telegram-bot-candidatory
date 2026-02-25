export default async function (context) {
  const log = context.log;

  log("=== SAFE DEBUG v2 ===");
  log("method: " + context.req.method);

  // لیست تمام کلیدهای req
  const keys = Object.keys(context.req);
  log("req keys: " + keys.join(", "));

  // هر کلید رو جداگانه چک کن
  for (const key of keys) {
    try {
      const val = context.req[key];
      const t = typeof val;

      if (val === null || val === undefined) {
        log(key + ": null/undefined");
      } else if (t === "string") {
        log(key + " [string] length=" + val.length + " preview=" + val.substring(0, 200));
      } else if (t === "object") {
        if (val instanceof Uint8Array || (val.buffer && val.byteLength !== undefined)) {
          // binary data
          log(key + " [binary] length=" + val.length);
          try {
            const txt = new TextDecoder("utf-8").decode(val);
            log(key + " decoded length=" + txt.length + " preview=" + txt.substring(0, 300));
          } catch (e) {
            log(key + " decode fail: " + e.message);
          }
        } else {
          // regular object
          try {
            const str = JSON.stringify(val);
            log(key + " [object] length=" + str.length + " preview=" + str.substring(0, 300));
          } catch (e) {
            log(key + " [object] stringify fail: " + e.message);
            // سعی کن کلیدهاش رو بخون
            try {
              log(key + " keys: " + Object.keys(val).join(", "));
            } catch {}
          }
        }
      } else {
        log(key + " [" + t + "] = " + String(val).substring(0, 100));
      }
    } catch (e) {
      log(key + " ERROR: " + e.message);
    }
  }

  return context.res.json({ ok: true }, 200);
}
