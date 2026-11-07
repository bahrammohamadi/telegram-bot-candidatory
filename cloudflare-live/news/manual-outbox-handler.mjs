// Release-specific, one-shot informational posts. No public HTTP posting route.
// Runs inside the EXISTING five-minute scheduled event. Does not touch the news queues.
async function runManualPublishOutbox(env){
  if(env.PUBLISH_ENABLED!=='true'||!env.TELEGRAM_BOT_TOKEN||!env.NEWS_DB)return;
  const record=await env.NEWS_DB.prepare(
    "SELECT id,channel,content FROM manual_publish_outbox WHERE status='queued' AND attempts=0 ORDER BY created_at,id LIMIT 1"
  ).first();
  if(!record)return;
  // Atomic one-time claim; prevents concurrent cron invocations from double-sending.
  const claim=await env.NEWS_DB.prepare(
    "UPDATE manual_publish_outbox SET status='sending',attempts=attempts+1,claimed_at=CURRENT_TIMESTAMP WHERE id=? AND status='queued' AND attempts=0"
  ).bind(record.id).run();
  if(claim.meta?.changes!==1)return;
  let outcome={ok:false,description:'Unknown Telegram response'};
  try{
    const response=await fetch('https://api.telegram.org/bot'+env.TELEGRAM_BOT_TOKEN+'/sendMessage',{
      method:'POST',
      headers:{'content-type':'application/json'},
      body:JSON.stringify({
        chat_id:record.channel,
        text:record.content,
        link_preview_options:{is_disabled:true}
      }),
      signal:AbortSignal.timeout(12000)
    });
    outcome=await response.json();
    if(!response.ok||!outcome?.ok||!Number.isSafeInteger(outcome?.result?.message_id)){
      const description=String(outcome?.description||('Telegram HTTP '+response.status)).slice(0,280);
      await env.NEWS_DB.prepare(
        "UPDATE manual_publish_outbox SET status='failed',last_error=? WHERE id=? AND status='sending'"
      ).bind(description,record.id).run();
      console.warn('Manual Candidatory notice not sent',record.id,description);
      return;
    }
    await env.NEWS_DB.prepare(
      "UPDATE manual_publish_outbox SET status='published',message_id=?,last_error=NULL,sent_at=CURRENT_TIMESTAMP WHERE id=? AND status='sending'"
    ).bind(outcome.result.message_id,record.id).run();
    console.info('Manual Candidatory notice published',record.id,outcome.result.message_id);
  }catch(e){
    // Never automatically retry an ambiguous send: Telegram may have received it.
    await env.NEWS_DB.prepare(
      "UPDATE manual_publish_outbox SET status='failed',last_error=? WHERE id=? AND status='sending'"
    ).bind(String(e).slice(0,280),record.id).run();
    console.warn('Manual Candidatory notice needs inspection',record.id);
  }
}
