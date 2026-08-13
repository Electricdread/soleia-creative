import { describe, it, expect, vi, beforeEach } from 'vitest';
const rpcMock = vi.fn(); const fromMock = vi.fn();
vi.mock('@/integrations/supabase/client', () => ({ supabase: { rpc: (...a:any[])=>rpcMock(...a), from: (...a:any[])=>fromMock(...a) } }));
beforeEach(()=>{ (global as any).fetch = vi.fn(()=>Promise.reject(new Error('x'))); rpcMock.mockResolvedValue({data:[{id:'1',title:'A',price:1,category:'C',long_description:'d',sort_order:1}],error:null}); fromMock.mockReturnValue({select:()=>Promise.resolve({data:[],error:null})}); });
import { generateProposalPdf } from '@/lib/proposalPdfGenerator';
function count(b64:string){const raw=Buffer.from(b64,'base64').toString('latin1');return (raw.match(/\/Type\s*\/Page(?![s\/A-Za-z])/g)||[]).length;}
const ITEMS = Array.from({length:11},(_,i)=>({title:'Item '+i, description:'Some description of the line item that is moderately long for wrapping purposes.', price:500, quantity:1, client_selected:true}));
describe('unsigned',()=>{ it('one page',async()=>{ const r:any = await generateProposalPdf({event_name:'MOC&CO x ZAXBYS',client_name:'Zaxbys',status:'sent'} as any, ITEMS as any, [{phase:'a',description:'b'},{phase:'c',description:'d'},{phase:'e',description:'f'}] as any, null, [], {returnBase64:true}); const p=count(r.base64); console.log('PAGES',p); expect(p).toBe(1); }); });
