import { readFileSync } from "node:fs";
import { handleGoals } from "./goals-api.mjs";
import assert from "node:assert/strict";
const schema=readFileSync(new URL("../integration-schema.sql",import.meta.url),"utf8");
assert(schema.includes("CREATE TABLE personal_goals_v2"),"goals schema missing");
function mockDb(allowChanges=1){
  const calls=[];
  const db={
    calls,
    prepare(sql){const q={bind(...args){calls.push({sql,args});return q},async all(){return {results:[]}},async run(){return {meta:{changes:allowChanges}}}};return q},
    async batch(stmts){assert.equal(stmts.length,2);return [{success:true},{success:true}]}
  };
  return db;
}
const user={id:9000000011,name:"Synthetic",username:null};
const json=async response=>({status:response.status,body:await response.json()});
const db=mockDb();
assert.equal((await json(await handleGoals(db,user,{action:"list"}))).status,200);
assert.equal(db.calls[0].args[0],user.id);
assert.equal((await json(await handleGoals(db,user,{action:"create",title:"x",details:"",target_date:""}))).status,400);
const created=await json(await handleGoals(db,user,{action:"create",title:"Synthetic goal",details:"test",target_date:"2026-11-15"}));
assert.equal(created.status,201);
const update=await json(await handleGoals(db,user,{action:"status",id:created.body.id,status:"done"}));
assert.equal(update.status,200);
assert.equal(db.calls.at(-1).args.at(-1),user.id);
const denied=await json(await handleGoals(mockDb(0),user,{action:"delete",id:created.body.id}));
assert.equal(denied.status,404);
console.log("PASS goals schema, input validation, owner-scoped reads and updates, missing-row denial");
