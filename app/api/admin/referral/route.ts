import { NextRequest } from "next/server";
import { adminUnauthorized, getAdminOrNull } from "@/lib/auth/require-admin";
import { bad, q, supabase } from "@/lib/auth/backend";

const sources = ["daily", "aiTrading"] as const;
const defaults = { daily: 5, aiTrading: 5 };

export async function GET() {
  if (!(await getAdminOrNull())) return adminUnauthorized();
  const [milestones, settings, referrals] = await Promise.all([
    supabase<{id:string;required_active:number;reward:number}[]>("referral_milestones?select=id,required_active,reward&active=eq.true&order=required_active.asc"),
    supabase<{value:Record<string,number>}[]>("auth_settings?select=value&key=eq.referral_commission_rates&limit=1").catch(() => []),
    supabase<{referrer_id:string;referred_id:string;is_eligible:boolean}[]>("referrals?select=referrer_id,referred_id,is_eligible"),
  ]);
  const rates = { ...defaults, ...(settings[0]?.value || {}) };
  const totals = new Map<string,{userId:string;name:string;email:string;totalReferred:number;active:number;commission:number}>();
  for (const ref of referrals) {
    const row = totals.get(ref.referrer_id) || {userId:ref.referrer_id,name:ref.referrer_id,email:"",totalReferred:0,active:0,commission:0};
    row.totalReferred++; if(ref.is_eligible) row.active++; totals.set(ref.referrer_id,row);
  }
  const people = totals.size ? await supabase<{id:string;user_id:string;first_name:string;last_name:string;email:string}[]>(`auth_users?select=id,user_id,first_name,last_name,email&id=in.(${[...totals.keys()].map(q).join(",")})`) : [];
  const peopleMap = new Map(people.map(p=>[p.id,p]));
  for (const [id,row] of totals) {
    const person=peopleMap.get(id); if(person){row.userId=person.user_id || id;row.name=`${person.first_name} ${person.last_name}`;row.email=person.email;}
    const commissions = await supabase<{commission_amount:number}[]>(`referral_commissions?select=commission_amount&referrer_id=eq.${q(id)}`);
    row.commission = commissions.reduce((sum,c)=>sum+Number(c.commission_amount),0);
  }
  return Response.json({milestones,rates,top:[...totals.values()].sort((a,b)=>b.active-a.active).slice(0,20)});
}

export async function PUT(req: NextRequest) {
  if (!(await getAdminOrNull())) return adminUnauthorized();
  const body = await req.json().catch(() => null);
  if (body?.milestones) {
    const items = body.milestones;
    if (!Array.isArray(items) || items.some((m:{requiredActive:number;reward:number}) => !Number.isInteger(m.requiredActive) || m.requiredActive < 1 || !Number.isFinite(m.reward) || m.reward < 0) || new Set(items.map((m:{requiredActive:number})=>m.requiredActive)).size !== items.length) return bad("Invalid milestones");
    const current = await supabase<{id:string;required_active:number}[]>("referral_milestones?select=id,required_active");
    const requested = new Set(items.map((m:{requiredActive:number})=>m.requiredActive));
    for (const row of current) {
      const match = items.find((m:{requiredActive:number})=>m.requiredActive===row.required_active);
      await supabase(`referral_milestones?id=eq.${q(row.id)}`, {method:"PATCH",headers:{Prefer:"return=minimal"},body:JSON.stringify(match ? {reward:match.reward,active:true,updated_at:new Date().toISOString()} : {active:false,updated_at:new Date().toISOString()})});
    }
    const existing = new Set(current.map(row=>row.required_active));
    const added = items.filter((m:{requiredActive:number})=>!existing.has(m.requiredActive));
    if(added.length) await supabase("referral_milestones", {method:"POST",headers:{Prefer:"return=minimal"},body:JSON.stringify(added.map((m:{requiredActive:number;reward:number})=>({required_active:m.requiredActive,reward:m.reward,active:true})))});
  }
  if (body?.rates) {
    const rates = body.rates as Record<string,unknown>;
    if (sources.some(k => typeof rates[k] !== "number" || rates[k] < 0 || rates[k] > 100)) return bad("Invalid commission rates");
    await supabase("auth_settings?on_conflict=key",{method:"POST",headers:{Prefer:"resolution=merge-duplicates,return=minimal"},body:JSON.stringify({key:"referral_commission_rates",value:rates})});
  }
  return Response.json({ok:true});
}
