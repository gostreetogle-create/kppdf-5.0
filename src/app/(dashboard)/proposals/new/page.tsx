'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Download, Eye, Search, Minus, Plus, Trash2, FileText, Check, AlertCircle, ChevronDown, Settings } from 'lucide-react';
import { generateProposalPdf, downloadPdf, type ProposalPdfData } from '@/lib/pdf';
import { DocPreview } from '@/components/ui/doc-preview';
import { A4Canvas } from '@/components/ui/a4-canvas';
import { buildProposalBlocks, getTemplateBlocks } from '@/lib/proposal-block-builder';
import type { DocBlock, DocumentTemplateData } from '@/types';

interface Product {
  id: string;
  sku: string;
  name: string;
  productType: string;
  basePrice: number;
  defaultMarkupPercent: number;
  unit: string;
  category: { id: string; name: string } | null;
  isActive: boolean;
}

interface Category { id: string; name: string; }

interface CartItem {
  id: string;
  productId: string;
  quantity: number;
  priceSnapshot: number;
  markupPercent: number | null;
  product: Product;
}

interface CartSession { id: string; items: CartItem[]; }

interface Organization {
  id: string;
  name: string;
  shortName: string;
  vatRate?: number;
}

interface Client {
  id: string;
  lastName: string;
  firstName: string;
  patronymic: string | null;
  phone: string;
  personalMarkupPercent?: number;
  organization: { name: string } | null;
}

interface DocumentTemplate {
  id: string;
  name: string;
  description: string | null;
  organizationId?: string | null;
}

export default function ProposalShowcasePage() {
  const router = useRouter();
  const [cartId, setCartId] = useState<string | null>(null);
  const [cart, setCart] = useState<CartSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [templates, setTemplates] = useState<DocumentTemplate[]>([]);
  const [selectedOrgId, setSelectedOrgId] = useState('');
  const [selectedClientId, setSelectedClientId] = useState('');
  const [selectedTemplateId, setSelectedTemplateId] = useState('');
  const [proposalTitle, setProposalTitle] = useState('');
  const [discountPercent, setDiscountPercent] = useState(0);
  const [showSettings, setShowSettings] = useState(false);
  const [templateBlocks, setTemplateBlocks] = useState<DocBlock[]>([]);
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null);
  const [selectedTemplateData, setSelectedTemplateData] = useState<DocumentTemplateData | null>(null);
  const [showPdfPreview, setShowPdfPreview] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [showOrgDropdown, setShowOrgDropdown] = useState(false);
  const [showClientDropdown, setShowClientDropdown] = useState(false);
  const [showTemplateDropdown, setShowTemplateDropdown] = useState(false);

  useEffect(() => {
    async function init() {
      try {
        const res = await fetch('/api/cart', { method: 'POST' });
        const data = await res.json();
        if (data.success) { setCartId(data.data.id); setCart(data.data); }
      } catch (e) { console.error('Cart init error:', e); }
      finally { setLoading(false); }
    }
    init();
  }, []);

  useEffect(() => {
    async function load() {
      try {
        const [pRes, cRes, oRes, clRes, tRes] = await Promise.all([
          fetch('/api/products?limit=200&sort=name'),
          fetch('/api/products/categories?limit=100'),
          fetch('/api/organizations?limit=100'),
          fetch('/api/clients?limit=100'),
          fetch('/api/document-templates?limit=100'),
        ]);
        const [pData, cData, oData, clData, tData] = await Promise.all([
          pRes.json(), cRes.json(), oRes.json(), clRes.json(), tRes.json(),
        ]);
        if (pData.success) setProducts(pData.data.items.filter((p: Product) => p.isActive));
        if (cData.success) setCategories(cData.data.items || []);
        if (oData.success) setOrganizations(oData.data.items || []);
        if (clData.success) setClients(clData.data.items || []);
        if (tData.success) setTemplates(tData.data.items || []);
      } catch (e) { console.error('Load error:', e); }
    }
    load();
  }, []);

  const filteredProducts = products.filter((p) => {
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      if (!p.name.toLowerCase().includes(q) && !p.sku.toLowerCase().includes(q)) return false;
    }
    if (filterCategory && p.category?.id !== filterCategory) return false;
    return true;
  });

  const addToCart = useCallback(async (product: Product) => {
    if (!cartId) return;
    try {
      await fetch(`/api/cart/${cartId}/items`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId: product.id, priceSnapshot: product.basePrice, markupPercent: product.defaultMarkupPercent }),
      });
      const res = await fetch(`/api/cart/${cartId}`);
      const data = await res.json();
      if (data.success) setCart(data.data);
    } catch (e) { console.error('Add to cart error:', e); }
  }, [cartId]);

  const updateQuantity = useCallback(async (itemId: string, quantity: number) => {
    if (!cartId || quantity < 1) return;
    await fetch(`/api/cart/${cartId}/items/${itemId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ quantity }),
    });
    const res = await fetch(`/api/cart/${cartId}`);
    const data = await res.json();
    if (data.success) setCart(data.data);
  }, [cartId]);

  const removeItem = useCallback(async (itemId: string) => {
    if (!cartId) return;
    await fetch(`/api/cart/${cartId}/items/${itemId}`, { method: 'DELETE' });
    const res = await fetch(`/api/cart/${cartId}`);
    const data = await res.json();
    if (data.success) setCart(data.data);
  }, [cartId]);

  const createProposal = useCallback(async () => {
    if (!cartId || !cart || cart.items.length === 0) return;
    setSaving(true);
    setError('');
    try {
      const res = await fetch(`/api/cart/${cartId}/convert`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: proposalTitle || undefined,
          clientId: selectedClientId || undefined,
          organizationId: selectedOrgId || undefined,
          templateId: selectedTemplateId || undefined,
        }),
      });
      const data = await res.json();
      if (data.success) { setSuccess(true); setTimeout(() => router.push('/proposals'), 1500); }
      else setError(data.message || 'Ошибка создания КП');
    } catch { setError('Ошибка сети'); }
    finally { setSaving(false); }
  }, [cartId, cart, proposalTitle, selectedClientId, selectedOrgId, selectedTemplateId, router]);

  useEffect(() => {
    if (!selectedTemplateId) { setSelectedTemplateData(null); setTemplateBlocks([]); return; }
    fetch(`/api/document-templates/${selectedTemplateId}`).then(r => r.json()).then(d => {
      if (d.success) { setSelectedTemplateData(d.data); setTemplateBlocks(getTemplateBlocks(d.data)); }
    }).catch(() => {});
  }, [selectedTemplateId]);

  const selectedOrg = organizations.find((o) => o.id === selectedOrgId);
  const selectedClient = clients.find((c) => c.id === selectedClientId);
  const effectiveMarkup = (item: CartItem): number => selectedClient?.personalMarkupPercent ?? item.markupPercent ?? 0;
  const subtotal = cart?.items.reduce((sum, item) => {
    const markup = effectiveMarkup(item);
    return sum + item.priceSnapshot * (1 + markup / 100) * item.quantity;
  }, 0) ?? 0;
  const discountAmount = discountPercent > 0 ? Math.round(subtotal * discountPercent / 100) : 0;
  const totalAfterDiscount = subtotal - discountAmount;
  const selectedVatRate = selectedOrg?.vatRate ?? 20;
  const vatAmount = totalAfterDiscount > 0 ? Math.round(totalAfterDiscount * selectedVatRate / (100 + selectedVatRate)) : 0;
  const grandTotal = totalAfterDiscount;

  const proposalBlocks = templateBlocks.length > 0 && cart?.items.length
    ? buildProposalBlocks({
        templateBlocks,
        cartItems: cart.items.map((item) => ({
          product: { name: item.product.name, sku: item.product.sku, unit: item.product.unit },
          quantity: item.quantity,
          priceSnapshot: item.priceSnapshot,
          markupPercent: item.markupPercent,
        })),
        finance: { subtotal, discountPercent, discountAmount, vatRate: selectedVatRate, vatAmount, grandTotal },
        clientMarkup: selectedClient?.personalMarkupPercent,
      })
    : templateBlocks;

  const formatPrice = (price: number) => Math.round(price).toLocaleString('ru-RU') + ' ₽';

  const pdfData = useCallback((): ProposalPdfData | null => {
    if (!cart || cart.items.length === 0) return null;
    const org = organizations.find((o) => o.id === selectedOrgId);
    const client = clients.find((c) => c.id === selectedClientId);
    return {
      number: 'ПРОЕКТ-' + String(Date.now()).slice(-6),
      title: proposalTitle || 'Коммерческое предложение',
      status: 'draft',
      client: client ? { lastName: client.lastName, firstName: client.firstName, patronymic: client.patronymic || undefined, phone: client.phone } : undefined,
      organization: org ? { name: org.name, shortName: org.shortName } : undefined,
      items: cart.items.map((item) => ({
        name: item.product.name, quantity: item.quantity, unit: item.product.unit,
        unitPrice: item.priceSnapshot, markupPercent: item.markupPercent ?? 0,
        total: Math.round(item.priceSnapshot * (1 + (item.markupPercent || 0) / 100) * item.quantity),
      })),
      markupPercent: 0,
      createdAt: new Date().toISOString(),
      discountPercent,
      discountAmount,
      vatRate: selectedVatRate,
      vatAmount,
      grandTotal,
    };
  }, [cart, organizations, clients, selectedOrgId, selectedClientId, proposalTitle, discountPercent, discountAmount, selectedVatRate, vatAmount, grandTotal]);

  const handleDownloadPdf = useCallback(async () => {
    const data = pdfData();
    if (!data) return;
    const doc = await generateProposalPdf(data);
    downloadPdf(doc, `КП-${Date.now()}.pdf`);
  }, [pdfData]);

  if (loading) return <div className="flex items-center justify-center h-screen"><div className="h-8 w-8 animate-spin rounded-full border-2 border-[var(--primary)] border-t-transparent" /></div>;

  if (success) return (
    <div className="flex flex-col items-center justify-center h-screen gap-4 animate-fadeIn">
      <div className="h-16 w-16 rounded-full bg-[var(--success)]/10 flex items-center justify-center"><Check className="h-8 w-8 text-[var(--success)]" /></div>
      <h2 className="text-xl font-semibold">КП создано!</h2>
    </div>
  );

  if (!cartId) return <div className="flex items-center justify-center h-screen"><p className="text-[var(--muted-foreground)]">Ошибка инициализации</p></div>;

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col overflow-hidden">
      {/* Compact header */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-[var(--border)] bg-[var(--card)] shrink-0">
        <div className="flex items-center gap-3">
          <h1 className="text-sm font-bold text-[var(--foreground)]">Оформление КП</h1>
          <span className="text-xs text-[var(--muted-foreground)]">({cart?.items.length || 0} поз.)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <button onClick={() => setShowPdfPreview(true)} disabled={!cart?.items.length} className="px-3 py-1.5 rounded-md border border-[var(--border)] text-xs font-medium hover:bg-[var(--muted)] transition-all disabled:opacity-40 flex items-center gap-1">
            <Eye className="h-3 w-3" /> PDF
          </button>
          <button onClick={handleDownloadPdf} disabled={!cart?.items.length} className="px-3 py-1.5 rounded-md border border-[var(--border)] text-xs font-medium hover:bg-[var(--muted)] transition-all disabled:opacity-40 flex items-center gap-1">
            <Download className="h-3 w-3" />
          </button>
          <button onClick={createProposal} disabled={!cart?.items.length || saving} className="px-3 py-1.5 rounded-md bg-[var(--primary)] text-[var(--primary-foreground)] text-xs font-medium hover:opacity-90 transition-all disabled:opacity-40 flex items-center gap-1">
            {saving ? <div className="h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent" /> : <FileText className="h-3 w-3" />}
            Создать КП
          </button>
        </div>
      </div>

      {error && (
        <div className="mx-4 mt-2 p-2 rounded-lg bg-[var(--destructive)]/10 border border-[var(--destructive)]/20 flex items-center gap-2 text-xs text-[var(--destructive)] shrink-0">
          <AlertCircle className="h-3 w-3 shrink-0" /> {error}
        </div>
      )}

      {/* Main: Left products, Right A4 */}
      <div className="flex-1 flex overflow-hidden">
        {/* LEFT: Products + Cart */}
        <div className="w-[45%] flex flex-col border-r border-[var(--border)] overflow-hidden">
          {/* Top bar: Search + Filters */}
          <div className="px-3 py-2 border-b border-[var(--border)] space-y-2 shrink-0">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[var(--muted-foreground)]" />
              <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Поиск..."
                className="w-full h-8 pl-8 pr-3 rounded-md border border-[var(--input)] bg-[var(--background)] text-xs focus:outline-none focus:ring-1 focus:ring-[var(--ring)]" />
            </div>
            <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)}
              className="w-full h-7 px-2 rounded-md border border-[var(--input)] bg-[var(--background)] text-xs appearance-none">
              <option value="">Все категории</option>
              {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>

          {/* Org / Client / Template / Discount selectors */}
          <div className="px-3 py-2 border-b border-[var(--border)] grid grid-cols-2 gap-2 shrink-0">
            <div className="relative">
              <label className="text-[10px] font-medium text-[var(--muted-foreground)] uppercase">Организация</label>
              <button onClick={() => { setShowOrgDropdown(!showOrgDropdown); setShowClientDropdown(false); setShowTemplateDropdown(false); }}
                className="w-full h-7 px-2 mt-0.5 rounded-md border border-[var(--input)] bg-[var(--background)] text-xs text-left flex items-center justify-between">
                <span className="truncate">{selectedOrg?.shortName || selectedOrg?.name || '—'}</span>
                <ChevronDown className="h-3 w-3 shrink-0 text-[var(--muted-foreground)]" />
              </button>
              {showOrgDropdown && (
                <div className="absolute z-50 top-full mt-1 w-full bg-[var(--card)] border border-[var(--border)] rounded-md shadow-lg max-h-32 overflow-auto">
                  <button onClick={() => { setSelectedOrgId(''); setShowOrgDropdown(false); }} className="w-full px-2 py-1 text-xs text-left hover:bg-[var(--muted)]">— Не выбрана —</button>
                  {organizations.map((o) => (
                    <button key={o.id} onClick={() => { setSelectedOrgId(o.id); setShowOrgDropdown(false); }}
                      className="w-full px-2 py-1 text-xs text-left hover:bg-[var(--muted)] truncate">{o.shortName || o.name}</button>
                  ))}
                </div>
              )}
            </div>
            <div className="relative">
              <label className="text-[10px] font-medium text-[var(--muted-foreground)] uppercase">Клиент</label>
              <button onClick={() => { setShowClientDropdown(!showClientDropdown); setShowOrgDropdown(false); setShowTemplateDropdown(false); }}
                className="w-full h-7 px-2 mt-0.5 rounded-md border border-[var(--input)] bg-[var(--background)] text-xs text-left flex items-center justify-between">
                <span className="truncate">{selectedClient ? `${selectedClient.lastName} ${selectedClient.firstName}` : '—'}</span>
                <ChevronDown className="h-3 w-3 shrink-0 text-[var(--muted-foreground)]" />
              </button>
              {showClientDropdown && (
                <div className="absolute z-50 top-full mt-1 w-full bg-[var(--card)] border border-[var(--border)] rounded-md shadow-lg max-h-32 overflow-auto">
                  <button onClick={() => { setSelectedClientId(''); setShowClientDropdown(false); }} className="w-full px-2 py-1 text-xs text-left hover:bg-[var(--muted)]">— Не выбран —</button>
                  {clients.map((c) => (
                    <button key={c.id} onClick={() => { setSelectedClientId(c.id); setShowClientDropdown(false); }}
                      className="w-full px-2 py-1 text-xs text-left hover:bg-[var(--muted)] truncate">{c.lastName} {c.firstName}</button>
                  ))}
                </div>
              )}
            </div>
            <div className="relative">
              <label className="text-[10px] font-medium text-[var(--muted-foreground)] uppercase">Шаблон</label>
              <button onClick={() => { setShowTemplateDropdown(!showTemplateDropdown); setShowOrgDropdown(false); setShowClientDropdown(false); }}
                className="w-full h-7 px-2 mt-0.5 rounded-md border border-[var(--input)] bg-[var(--background)] text-xs text-left flex items-center justify-between">
                <span className="truncate">{selectedTemplateData?.name || '—'}</span>
                <ChevronDown className="h-3 w-3 shrink-0 text-[var(--muted-foreground)]" />
              </button>
              {showTemplateDropdown && (
                <div className="absolute z-50 top-full mt-1 w-full bg-[var(--card)] border border-[var(--border)] rounded-md shadow-lg max-h-32 overflow-auto">
                  <button onClick={() => { setSelectedTemplateId(''); setShowTemplateDropdown(false); }} className="w-full px-2 py-1 text-xs text-left hover:bg-[var(--muted)]">— Без шаблона —</button>
                  {templates.map((t) => (
                    <button key={t.id} onClick={() => { setSelectedTemplateId(t.id); setShowTemplateDropdown(false); }}
                      className="w-full px-2 py-1 text-xs text-left hover:bg-[var(--muted)] truncate">{t.name}</button>
                  ))}
                </div>
              )}
            </div>
            <div>
              <label className="text-[10px] font-medium text-[var(--muted-foreground)] uppercase">Скидка {discountPercent}%</label>
              <input type="range" min="0" max="30" step="1" value={discountPercent}
                onChange={(e) => setDiscountPercent(Number(e.target.value))}
                className="w-full mt-1 h-5" />
            </div>
          </div>

          {/* Product list (scrollable) */}
          <div className="flex-1 overflow-y-auto">
            <div className="divide-y divide-[var(--border)]">
              {filteredProducts.map((product) => {
                const inCart = cart?.items.some((i) => i.productId === product.id);
                return (
                  <div key={product.id} onClick={() => !inCart && addToCart(product)}
                    className={`flex items-center gap-2 px-3 py-2 cursor-pointer transition-colors ${inCart ? 'bg-[var(--primary)]/5' : 'hover:bg-[var(--muted)]/50'}`}>
                    <div className={`h-7 w-7 rounded flex items-center justify-center text-[10px] font-bold shrink-0 ${inCart ? 'bg-[var(--primary)] text-[var(--primary-foreground)]' : 'bg-[var(--muted)] text-[var(--muted-foreground)]'}`}>
                      {product.name.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-[var(--foreground)] truncate">{product.name}</p>
                      <p className="text-[10px] text-[var(--muted-foreground)]">{product.sku} · {product.unit}</p>
                    </div>
                    <span className="text-xs font-semibold text-[var(--foreground)] shrink-0">{formatPrice(product.basePrice)}</span>
                    {inCart && <Check className="h-3 w-3 text-[var(--primary)] shrink-0" />}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Cart items (scrollable, compact) */}
          <div className="border-t border-[var(--border)] max-h-[35%] overflow-y-auto">
            <div className="px-3 py-1.5 bg-[var(--muted)]/30 border-b border-[var(--border)] flex items-center justify-between">
              <span className="text-[10px] font-semibold uppercase text-[var(--muted-foreground)]">Корзина ({cart?.items.length || 0})</span>
              <span className="text-xs font-bold text-[var(--foreground)]">{formatPrice(grandTotal)}</span>
            </div>
            {cart && cart.items.length > 0 ? (
              <div className="divide-y divide-[var(--border)]">
                {cart.items.map((item) => {
                  const total = item.priceSnapshot * (1 + (item.markupPercent || 0) / 100) * item.quantity;
                  return (
                    <div key={item.id} className="flex items-center gap-2 px-3 py-1.5">
                      <div className="flex-1 min-w-0">
                        <p className="text-[11px] font-medium text-[var(--foreground)] truncate">{item.product.name}</p>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <button onClick={() => updateQuantity(item.id, item.quantity - 1)} disabled={item.quantity <= 1}
                          className="h-5 w-5 rounded border border-[var(--border)] flex items-center justify-center hover:bg-[var(--muted)] disabled:opacity-30">
                          <Minus className="h-2.5 w-2.5" />
                        </button>
                        <span className="text-[11px] font-medium w-6 text-center">{item.quantity}</span>
                        <button onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          className="h-5 w-5 rounded border border-[var(--border)] flex items-center justify-center hover:bg-[var(--muted)]">
                          <Plus className="h-2.5 w-2.5" />
                        </button>
                      </div>
                      <span className="text-[11px] font-semibold text-[var(--foreground)] w-16 text-right shrink-0">{formatPrice(total)}</span>
                      <button onClick={() => removeItem(item.id)} className="text-[var(--muted-foreground)] hover:text-[var(--destructive)] shrink-0">
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="py-4 text-center text-[10px] text-[var(--muted-foreground)]">Нажмите на товар чтобы добавить</div>
            )}
            {cart && cart.items.length > 0 && (
              <div className="px-3 py-1.5 border-t border-[var(--border)] space-y-0.5">
                <div className="flex justify-between text-[10px]"><span className="text-[var(--muted-foreground)]">Сумма:</span><span>{formatPrice(subtotal)}</span></div>
                {discountPercent > 0 && <div className="flex justify-between text-[10px]"><span className="text-[var(--muted-foreground)]">Скидка:</span><span className="text-[var(--destructive)]">−{formatPrice(discountAmount)}</span></div>}
                <div className="flex justify-between text-[10px]"><span className="text-[var(--muted-foreground)]">НДС ({selectedVatRate}%):</span><span>{formatPrice(vatAmount)}</span></div>
                <div className="flex justify-between text-xs font-bold pt-1 border-t border-[var(--border)]"><span>Итого:</span><span>{formatPrice(grandTotal)}</span></div>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT: A4 Canvas */}
        <div className="w-[55%] overflow-auto bg-[var(--muted)]/30 flex items-start justify-center p-4">
          {selectedTemplateData && proposalBlocks.length > 0 ? (
            <A4Canvas
              blocks={proposalBlocks}
              selectedBlockId={selectedBlockId}
              backgroundImage={selectedTemplateData.backgroundImages?.[0]}
              backgroundOpacity={selectedTemplateData.backgroundOpacity}
              scale={0.52}
              editable={false}
              onBlockSelect={setSelectedBlockId}
              onBlocksReorder={() => {}}
              onBlockEdit={() => {}}
              onBlockRemove={() => {}}
            />
          ) : cart && cart.items.length > 0 ? (
            <div className="w-full max-w-[210mm] mx-auto bg-[var(--card)] border border-[var(--border)] rounded-lg shadow-sm p-4">
              {selectedOrg && (
                <p className="text-[10px] text-[var(--muted-foreground)] font-medium mb-2">{selectedOrg.name}</p>
              )}
              <div className="text-center mb-3">
                <p className="text-xs font-bold uppercase">Коммерческое предложение</p>
                <p className="text-[10px] text-[var(--muted-foreground)]">Без шаблона — стандартный бланк</p>
              </div>
              {selectedClient && (
                <p className="text-[10px] text-[var(--muted-foreground)] mb-2">Клиент: {selectedClient.lastName} {selectedClient.firstName}</p>
              )}
              <table className="w-full text-[10px] border-collapse border border-[var(--border)]">
                <thead>
                  <tr className="bg-[var(--muted)]">
                    <th className="border border-[var(--border)] p-1 text-left">№</th>
                    <th className="border border-[var(--border)] p-1 text-left">Наименование</th>
                    <th className="border border-[var(--border)] p-1 text-right">Кол-во</th>
                    <th className="border border-[var(--border)] p-1 text-center">Ед.</th>
                    <th className="border border-[var(--border)] p-1 text-right">Цена</th>
                    <th className="border border-[var(--border)] p-1 text-right">Сумма</th>
                  </tr>
                </thead>
                <tbody>
                  {cart.items.map((item: CartItem, i: number) => {
                    const total = item.priceSnapshot * (1 + (item.markupPercent || 0) / 100) * item.quantity;
                    return (
                      <tr key={item.id} className="hover:bg-[var(--muted)]/30 transition-colors">
                        <td className="border border-[var(--border)] p-1 text-center">{i + 1}</td>
                        <td className="border border-[var(--border)] p-1">{item.product.name}</td>
                        <td className="border border-[var(--border)] p-1 text-right">{item.quantity}</td>
                        <td className="border border-[var(--border)] p-1 text-center">{item.product.unit || 'шт'}</td>
                        <td className="border border-[var(--border)] p-1 text-right">{formatPrice(item.priceSnapshot * (1 + (item.markupPercent || 0) / 100))}</td>
                        <td className="border border-[var(--border)] p-1 text-right font-medium">{formatPrice(total)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              <div className="mt-2 space-y-0.5 text-[10px]">
                <div className="flex justify-between"><span className="text-[var(--muted-foreground)]">Сумма:</span><span>{formatPrice(subtotal)}</span></div>
                {discountPercent > 0 && <div className="flex justify-between"><span className="text-[var(--muted-foreground)]">Скидка:</span><span className="text-[var(--destructive)]">−{formatPrice(discountAmount)}</span></div>}
                <div className="flex justify-between"><span className="text-[var(--muted-foreground)]">НДС ({selectedVatRate}%):</span><span>{formatPrice(vatAmount)}</span></div>
                <div className="flex justify-between text-xs font-bold pt-1 border-t border-[var(--border)]"><span>Итого:</span><span>{formatPrice(grandTotal)}</span></div>
              </div>
              <p className="text-[10px] text-[var(--muted-foreground)] mt-4 pt-2 border-t border-[var(--border)]">
                Подпись: ___________________
              </p>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-64 text-[var(--muted-foreground)]">
              <FileText className="h-12 w-12 mb-3 opacity-30" />
              <p className="text-sm font-medium">Выберите шаблон</p>
              <p className="text-xs mt-1">для предпросмотра документа</p>
            </div>
          )}
        </div>
      </div>

      {/* Settings dialog */}
      {showSettings && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setShowSettings(false)}>
          <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl shadow-xl p-5 w-80" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-sm font-semibold mb-3">Настройки</h3>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium text-[var(--muted-foreground)]">Название КП</label>
                <input type="text" value={proposalTitle} onChange={(e) => setProposalTitle(e.target.value)} placeholder="Коммерческое предложение"
                  className="w-full h-8 px-3 mt-1 rounded-md border border-[var(--input)] bg-[var(--background)] text-xs" />
              </div>
            </div>
            <div className="flex justify-end mt-4">
              <button onClick={() => setShowSettings(false)} className="px-3 py-1.5 rounded-md bg-[var(--primary)] text-[var(--primary-foreground)] text-xs font-medium">Готово</button>
            </div>
          </div>
        </div>
      )}

      {/* PDF Preview */}
      {showPdfPreview && (() => {
        const data = pdfData();
        if (!data) return null;
        const total = data.items.reduce((s, i) => s + i.total, 0);
        const discAmount = data.discountAmount ?? 0;
        const vat = data.vatAmount ?? 0;
        const grand = data.grandTotal ?? total;
        return (
          <DocPreview title={`Предпросмотр — ${data.number}`} onDownload={handleDownloadPdf} downloadLabel="Скачать PDF">
            <div className="space-y-4 text-sm text-[var(--foreground)]">
              {data.organization && <p className="text-xs text-[var(--muted-foreground)] font-medium">{data.organization.name}</p>}
              <div className="text-center">
                <h2 className="text-lg font-bold">КОММЕРЧЕСКОЕ ПРЕДЛОЖЕНИЕ</h2>
                <p className="text-sm text-[var(--muted-foreground)]">№ {data.number} от {new Date(data.createdAt).toLocaleDateString('ru-RU')}</p>
              </div>
              {data.client && <p className="text-xs text-[var(--muted-foreground)]">Клиент: {data.client.lastName} {data.client.firstName}</p>}
              {data.items && data.items.length > 0 && (
                <table className="w-full text-xs border-collapse border border-[var(--border)]">
                  <thead><tr className="bg-[var(--muted)]"><th className="border border-[var(--border)] p-1.5 text-left">Наименование</th><th className="border border-[var(--border)] p-1.5 text-right">Кол-во</th><th className="border border-[var(--border)] p-1.5 text-center">Ед.</th><th className="border border-[var(--border)] p-1.5 text-right">Цена</th><th className="border border-[var(--border)] p-1.5 text-right">Сумма</th></tr></thead>
                  <tbody>
                    {data.items.map((item, i) => (<tr key={i} className="hover:bg-[var(--muted)]/50 transition-colors"><td className="border border-[var(--border)] p-1.5">{item.name}</td><td className="border border-[var(--border)] p-1.5 text-right">{item.quantity}</td><td className="border border-[var(--border)] p-1.5 text-center">{item.unit || 'шт'}</td><td className="border border-[var(--border)] p-1.5 text-right">{item.unitPrice.toLocaleString('ru-RU')} ₽</td><td className="border border-[var(--border)] p-1.5 text-right">{item.total.toLocaleString('ru-RU')} ₽</td></tr>))}
                  </tbody>
                  <tfoot>
                    <tr className="bg-[var(--muted)] font-bold"><td colSpan={4} className="border border-[var(--border)] p-1.5 text-right">Сумма:</td><td className="border border-[var(--border)] p-1.5 text-right">{total.toLocaleString('ru-RU')} ₽</td></tr>
                    {discAmount > 0 && <tr className="text-[var(--destructive)]"><td colSpan={4} className="border border-[var(--border)] p-1.5 text-right">Скидка ({data.discountPercent}%):</td><td className="border border-[var(--border)] p-1.5 text-right">−{discAmount.toLocaleString('ru-RU')} ₽</td></tr>}
                    <tr><td colSpan={4} className="border border-[var(--border)] p-1.5 text-right">НДС ({data.vatRate || 20}%):</td><td className="border border-[var(--border)] p-1.5 text-right">{vat.toLocaleString('ru-RU')} ₽</td></tr>
                    <tr className="bg-[var(--muted)] font-bold text-base"><td colSpan={4} className="border border-[var(--border)] p-1.5 text-right">ИТОГО:</td><td className="border border-[var(--border)] p-1.5 text-right">{grand.toLocaleString('ru-RU')} ₽</td></tr>
                  </tfoot>
                </table>
              )}
              <p className="text-xs pt-4 border-t border-[var(--border)] text-[var(--muted-foreground)]">
                Подпись: ___________________
              </p>
            </div>
          </DocPreview>
        );
      })()}
    </div>
  );
}
