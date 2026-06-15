'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Download, Eye, Search, Plus, Minus, Trash2, FileText, Building2, User, Percent, AlertCircle, Check, Package } from 'lucide-react';
import { generateProposalPdf, downloadPdf, type ProposalPdfData } from '@/lib/pdf';
import { DocPreview } from '@/components/ui/doc-preview';
import { A4Canvas } from '@/components/ui/a4-canvas';
import { buildProposalBlocks, getTemplateBlocks } from '@/lib/proposal-block-builder';
import type { DocBlock, DocumentTemplateData } from '@/types';

interface Product {
  id: string;
  sku: string;
  name: string;
  description: string | null;
  productType: string;
  basePrice: number;
  defaultMarkupPercent: number;
  unit: string;
  category: { id: string; name: string } | null;
  isActive: boolean;
}

interface Category {
  id: string;
  name: string;
}

interface CartItem {
  id: string;
  productId: string;
  quantity: number;
  priceSnapshot: number;
  markupPercent: number | null;
  product: Product;
}

interface CartSession {
  id: string;
  items: CartItem[];
}

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
  docType?: { name: string } | null;
}

export default function ProposalShowcasePage() {
  const router = useRouter();

  // Cart
  const [cartId, setCartId] = useState<string | null>(null);
  const [cart, setCart] = useState<CartSession | null>(null);
  const [loading, setLoading] = useState(true);

  // Products
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterType, setFilterType] = useState('');
  const [loadingProducts, setLoadingProducts] = useState(true);

  // Org/Client/Template
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [templates, setTemplates] = useState<DocumentTemplate[]>([]);
  const [selectedOrgId, setSelectedOrgId] = useState('');
  const [selectedClientId, setSelectedClientId] = useState('');
  const [selectedTemplateId, setSelectedTemplateId] = useState('');
  const [proposalTitle, setProposalTitle] = useState('');
  const [proposalNotes, setProposalNotes] = useState('');
  const [proposalValidUntil, setProposalValidUntil] = useState('');

  // Discount & settings
  const [discountPercent, setDiscountPercent] = useState(0);
  const [showSettings, setShowSettings] = useState(false);

  // Template blocks for A4Canvas
  const [templateBlocks, setTemplateBlocks] = useState<DocBlock[]>([]);
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null);
  const [selectedTemplateData, setSelectedTemplateData] = useState<DocumentTemplateData | null>(null);

  // Row editing dialog
  const [editDialogVisible, setEditDialogVisible] = useState(false);
  const [editItemId, setEditItemId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editSku, setEditSku] = useState('');
  const [editQuantity, setEditQuantity] = useState(1);
  const [editPrice, setEditPrice] = useState(0);
  const [editMarkup, setEditMarkup] = useState(0);

  // PDF preview
  const [showPdfPreview, setShowPdfPreview] = useState(false);

  // Saving
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  // Инициализация корзины
  useEffect(() => {
    async function init() {
      try {
        const res = await fetch('/api/cart', { method: 'POST' });
        const data = await res.json();
        if (data.success) {
          setCartId(data.data.id);
          setCart(data.data);
        }
      } catch (e) {
        console.error('Cart init error:', e);
      } finally {
        setLoading(false);
      }
    }
    init();
  }, []);

  // Загрузка товаров
  useEffect(() => {
    async function load() {
      setLoadingProducts(true);
      try {
        const params = new URLSearchParams({ limit: '100', sort: 'name' });
        const res = await fetch(`/api/products?${params}`);
        const data = await res.json();
        if (data.success) {
          setProducts(data.data.items.filter((p: Product) => p.isActive));
        }

        // Категории
        const catRes = await fetch('/api/products/categories?limit=100');
        const catData = await catRes.json();
        if (catData.success) setCategories(catData.data.items || []);

        // Организации
        const orgRes = await fetch('/api/organizations?limit=100');
        const orgData = await orgRes.json();
        if (orgData.success) setOrganizations(orgData.data.items || []);

        // Клиенты
        const clRes = await fetch('/api/clients?limit=100');
        const clData = await clRes.json();
        if (clData.success) setClients(clData.data.items || []);

        // Шаблоны документов
        const tmplRes = await fetch('/api/document-templates?limit=100');
        const tmplData = await tmplRes.json();
        if (tmplData.success) setTemplates(tmplData.data.items || []);
      } catch (e) {
        console.error('Load error:', e);
      } finally {
        setLoadingProducts(false);
      }
    }
    load();
  }, []);

  // Загрузка шаблона при выборе
  useEffect(() => {
    if (!selectedTemplateId) {
      setSelectedTemplateData(null);
      setTemplateBlocks([]);
      return;
    }
    async function loadTemplate() {
      try {
        const res = await fetch(`/api/document-templates/${selectedTemplateId}`);
        const data = await res.json();
        if (data.success) {
          setSelectedTemplateData(data.data);
          const blocks = getTemplateBlocks(data.data);
          setTemplateBlocks(blocks);
        }
      } catch (e) {
        console.error('Load template error:', e);
      }
    }
    loadTemplate();
  }, [selectedTemplateId]);

  // Фильтрация товаров
  const filteredProducts = products.filter((p) => {
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      if (!p.name.toLowerCase().includes(q) && !p.sku.toLowerCase().includes(q)) return false;
    }
    if (filterCategory && p.category?.id !== filterCategory) return false;
    if (filterType && p.productType !== filterType) return false;
    return true;
  });

  // Добавление товара в корзину
  const addToCart = useCallback(async (product: Product) => {
    if (!cartId) return;
    try {
      const res = await fetch(`/api/cart/${cartId}/items`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: product.id,
          priceSnapshot: product.basePrice,
          markupPercent: product.defaultMarkupPercent,
        }),
      });
      const data = await res.json();
      if (data.success) {
        // Обновляем корзину
        const cartRes = await fetch(`/api/cart/${cartId}`);
        const cartData = await cartRes.json();
        if (cartData.success) setCart(cartData.data);
      }
    } catch (e) {
      console.error('Add to cart error:', e);
    }
  }, [cartId]);

  // Обновление количества
  const updateQuantity = useCallback(async (itemId: string, quantity: number) => {
    if (!cartId || quantity < 1) return;
    try {
      await fetch(`/api/cart/${cartId}/items/${itemId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quantity }),
      });
      const res = await fetch(`/api/cart/${cartId}`);
      const data = await res.json();
      if (data.success) setCart(data.data);
    } catch (e) {
      console.error('Update quantity error:', e);
    }
  }, [cartId]);

  // Обновление наценки
  const updateMarkup = useCallback(async (itemId: string, markupPercent: number) => {
    if (!cartId) return;
    try {
      await fetch(`/api/cart/${cartId}/items/${itemId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ markupPercent }),
      });
      const res = await fetch(`/api/cart/${cartId}`);
      const data = await res.json();
      if (data.success) setCart(data.data);
    } catch (e) {
      console.error('Update markup error:', e);
    }
  }, [cartId]);

  // Удаление позиции
  const removeItem = useCallback(async (itemId: string) => {
    if (!cartId) return;
    try {
      await fetch(`/api/cart/${cartId}/items/${itemId}`, { method: 'DELETE' });
      const res = await fetch(`/api/cart/${cartId}`);
      const data = await res.json();
      if (data.success) setCart(data.data);
    } catch (e) {
      console.error('Remove item error:', e);
    }
  }, [cartId]);

  // Создание КП
  const createProposal = useCallback(async () => {
    if (!cartId || !cart || cart.items.length === 0) return;
    if (!selectedOrgId && !selectedClientId) {
      setError('Выберите организацию или клиента');
      return;
    }
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
          notes: proposalNotes || undefined,
          validUntil: proposalValidUntil || undefined,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setSuccess(true);
        setCartId(null);
        setCart(null);
        setTimeout(() => router.push('/proposals'), 1500);
      } else {
        setError(data.message || 'Ошибка создания КП');
      }
    } catch (e) {
      setError('Ошибка сети');
    } finally {
      setSaving(false);
    }
  }, [cartId, cart, proposalTitle, selectedClientId, selectedOrgId, selectedTemplateId, proposalNotes, proposalValidUntil, router]);

  // Финансовые расчёты
  const selectedOrg = organizations.find((o) => o.id === selectedOrgId);
  const selectedClient = clients.find((c) => c.id === selectedClientId);

  // Эффективная наценка: клиентская переопределяет товарную
  const effectiveMarkup = (item: CartItem): number => {
    if (selectedClient?.personalMarkupPercent) return selectedClient.personalMarkupPercent;
    return item.markupPercent ?? 0;
  };

  // Сумма без скидки
  const subtotal = cart?.items.reduce((sum, item) => {
    const markup = effectiveMarkup(item);
    const unitPrice = item.priceSnapshot * (1 + markup / 100);
    return sum + unitPrice * item.quantity;
  }, 0) ?? 0;

  // Скидка
  const discountAmount = discountPercent > 0 ? Math.round(subtotal * discountPercent / 100) : 0;
  const totalAfterDiscount = subtotal - discountAmount;

  // НДС (выделение из суммы)
  const selectedVatRate = selectedOrg?.vatRate ?? 20;
  const vatAmount = totalAfterDiscount > 0
    ? Math.round(totalAfterDiscount * selectedVatRate / (100 + selectedVatRate))
    : 0;

  // Итого к оплате
  const grandTotal = totalAfterDiscount;

  // Собранные блоки для A4Canvas (шаблон + данные корзины)
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

  // Открыть редактор строки
  const openEditDialog = (item: CartItem) => {
    setEditItemId(item.id);
    setEditName(item.product.name);
    setEditSku(item.product.sku);
    setEditQuantity(item.quantity);
    setEditPrice(item.priceSnapshot);
    setEditMarkup(effectiveMarkup(item));
    setEditDialogVisible(true);
  };

  // Сохранить редактирование строки
  const saveEditItem = async () => {
    if (!cartId || !editItemId) return;
    const qty = Math.max(1, Math.round(editQuantity));
    const markup = Math.max(0, editMarkup);
    try {
      await fetch(`/api/cart/${cartId}/items/${editItemId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quantity: qty, markupPercent: markup }),
      });
      const res = await fetch(`/api/cart/${cartId}`);
      const data = await res.json();
      if (data.success) setCart(data.data);
      setEditDialogVisible(false);
    } catch (e) {
      console.error('Edit item error:', e);
    }
  };

  // Сборка данных для PDF
  const pdfData = useCallback((): ProposalPdfData | null => {
    if (!cart || cart.items.length === 0) return null;
    const org = organizations.find((o) => o.id === selectedOrgId);
    const client = clients.find((c) => c.id === selectedClientId);
    return {
      number: 'ПРОЕКТ-' + String(Date.now()).slice(-6),
      title: proposalTitle || 'Коммерческое предложение',
      status: 'draft',
      client: client ? {
        lastName: client.lastName,
        firstName: client.firstName,
        patronymic: client.patronymic || undefined,
        phone: client.phone,
      } : undefined,
      organization: org ? {
        name: org.name,
        shortName: org.shortName,
      } : undefined,
      items: cart.items.map((item) => ({
        name: item.product.name,
        quantity: item.quantity,
        unit: item.product.unit,
        unitPrice: item.priceSnapshot,
        markupPercent: item.markupPercent ?? 0,
        total: Math.round(item.priceSnapshot * (1 + (item.markupPercent || 0) / 100) * item.quantity),
      })),
      markupPercent: 0,
      notes: proposalNotes || undefined,
      validUntil: proposalValidUntil || undefined,
      createdAt: new Date().toISOString(),
    };
  }, [cart, organizations, clients, selectedOrgId, selectedClientId, proposalTitle, proposalNotes, proposalValidUntil]);

  // Скачать PDF
  const handleDownloadPdf = useCallback(async () => {
    const data = pdfData();
    if (!data) return;
    const doc = await generateProposalPdf(data);
    downloadPdf(doc, `КП-проект-${Date.now()}.pdf`);
  }, [pdfData]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[var(--primary)] border-t-transparent" />
      </div>
    );
  }

  if (success) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4 animate-fadeIn">
        <div className="h-16 w-16 rounded-full bg-[var(--success)]/10 flex items-center justify-center">
          <Check className="h-8 w-8 text-[var(--success)]" />
        </div>
        <h2 className="text-xl font-semibold text-[var(--foreground)]">КП успешно создано!</h2>
        <p className="text-sm text-[var(--muted-foreground)]">Перенаправление в список предложений...</p>
      </div>
    );
  }

  if (!cartId) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-[var(--muted-foreground)]">Ошибка инициализации корзины</p>
      </div>
    );
  }

  return (
    <div className="animate-fadeIn">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[var(--foreground)]">📋 Оформление КП</h1>
          <p className="text-sm text-[var(--muted-foreground)] mt-1">
            Выберите товары слева, настройте параметры и создайте коммерческое предложение
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowPdfPreview(true)}
            disabled={!cart?.items.length}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border border-[var(--border)] text-sm font-medium hover:bg-[var(--muted)] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Eye className="h-4 w-4" />
            Предпросмотр
          </button>
          <button
            onClick={handleDownloadPdf}
            disabled={!cart?.items.length}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border border-[var(--border)] text-sm font-medium hover:bg-[var(--muted)] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Download className="h-4 w-4" />
            Скачать PDF
          </button>
          <button
            onClick={createProposal}
            disabled={!cart?.items.length || saving}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[var(--primary)] text-[var(--primary-foreground)] text-sm font-medium hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
          >
            {saving ? (
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
            ) : (
              <FileText className="h-4 w-4" />
            )}
            {saving ? 'Сохранение...' : 'Создать КП'}
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 rounded-lg bg-[var(--destructive)]/10 border border-[var(--destructive)]/20 flex items-center gap-2 text-sm text-[var(--destructive)]">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      {/* Two-panel layout */}
      <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">
        {/* ===== LEFT: Product showcase ===== */}
        <div className="xl:col-span-3 space-y-4">
          {/* Search and filters */}
          <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-4 space-y-3 shadow-sm">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--muted-foreground)]" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Поиск товаров по названию или артикулу..."
                className="w-full h-10 pl-9 pr-3 rounded-lg border border-[var(--input)] bg-[var(--background)] text-sm text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
              />
            </div>
            <div className="flex gap-3">
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="flex-1 h-10 px-3 rounded-lg border border-[var(--input)] bg-[var(--background)] text-sm text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--ring)] appearance-none"
              >
                <option value="">Все категории</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="flex-1 h-10 px-3 rounded-lg border border-[var(--input)] bg-[var(--background)] text-sm text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--ring)] appearance-none"
              >
                <option value="">Все типы</option>
                <option value="purchased">Закупаемые</option>
                <option value="manufactured">Производимые</option>
              </select>
            </div>
          </div>

          {/* Products grid */}
          {loadingProducts ? (
            <div className="flex items-center justify-center h-48">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-[var(--primary)] border-t-transparent" />
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 gap-2 text-[var(--muted-foreground)]">
              <Package className="h-12 w-12 opacity-30" />
              <p className="text-sm">Товары не найдены</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {filteredProducts.map((product) => {
                const inCart = cart?.items.some((i) => i.productId === product.id);
                return (
                  <div
                    key={product.id}
                    onClick={() => !inCart && addToCart(product)}
                    className={`group relative bg-[var(--card)] border rounded-xl p-4 transition-all duration-200 ${
                      inCart
                        ? 'border-[var(--primary)] bg-[var(--primary)]/5 cursor-default'
                        : 'border-[var(--border)] hover:border-[var(--primary)]/50 hover:shadow-md cursor-pointer'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`h-10 w-10 rounded-lg flex items-center justify-center text-lg font-bold shrink-0 ${
                        inCart ? 'bg-[var(--primary)] text-[var(--primary-foreground)]' : 'bg-[var(--muted)] text-[var(--muted-foreground)]'
                      }`}>
                        {product.name.charAt(0)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <p className="font-medium text-sm text-[var(--foreground)] truncate">{product.name}</p>
                            <p className="text-xs text-[var(--muted-foreground)]">{product.sku}</p>
                          </div>
                          <span className="text-sm font-semibold text-[var(--foreground)] whitespace-nowrap">
                            {formatPrice(product.basePrice)}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 mt-2">
                          <span className="text-xs px-1.5 py-0.5 rounded bg-[var(--muted)] text-[var(--muted-foreground)]">
                            {product.unit}
                          </span>
                          {product.category && (
                            <span className="text-xs px-1.5 py-0.5 rounded bg-[var(--muted)] text-[var(--muted-foreground)]">
                              {product.category.name}
                            </span>
                          )}
                          <span className={`text-xs px-1.5 py-0.5 rounded ${
                            product.productType === 'manufactured'
                              ? 'bg-[var(--info)]/10 text-[var(--info)]'
                              : 'bg-[var(--success)]/10 text-[var(--success)]'
                          }`}>
                            {product.productType === 'manufactured' ? 'Произв.' : 'Закуп.'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {inCart ? (
                      <div className="mt-2 flex items-center gap-1.5 text-xs text-[var(--primary)]">
                        <Check className="h-3 w-3" />
                        <span>Добавлено в КП</span>
                      </div>
                    ) : (
                      <div className="absolute inset-0 rounded-xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-[var(--primary)]/5">
                        <span className="flex items-center gap-1.5 text-sm font-medium text-[var(--primary)]">
                          <Plus className="h-4 w-4" />
                          Добавить
                        </span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* ===== RIGHT: Cart / A4Canvas panel ===== */}
        <div className="xl:col-span-2 space-y-4">
          {/* A4Canvas when template selected */}
          {selectedTemplateData && (
            <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl shadow-sm overflow-hidden">
              <div className="px-4 py-3 border-b border-[var(--border)] flex items-center justify-between">
                <h2 className="font-semibold text-[var(--foreground)] text-sm flex items-center gap-2">
                  <FileText className="h-4 w-4 text-[var(--primary)]" />
                  Предпросмотр: {selectedTemplateData.name}
                </h2>
              </div>
              <div className="p-4 flex justify-center overflow-auto max-h-[600px]">
                <A4Canvas
                  blocks={proposalBlocks}
                  selectedBlockId={selectedBlockId}
                  backgroundImage={selectedTemplateData.backgroundImages?.[0]}
                  backgroundOpacity={selectedTemplateData.backgroundOpacity}
                  scale={0.55}
                  editable={false}
                  onBlockSelect={setSelectedBlockId}
                  onBlocksReorder={setTemplateBlocks}
                  onBlockEdit={() => {}}
                  onBlockRemove={() => {}}
                />
              </div>
            </div>
          )}

          {/* Cart */}
          <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl shadow-sm">
            <div className="px-4 py-3 border-b border-[var(--border)] flex items-center justify-between">
              <h2 className="font-semibold text-[var(--foreground)] text-sm flex items-center gap-2">
                <Package className="h-4 w-4 text-[var(--primary)]" />
                Корзина КП
                {cart && <span className="text-xs text-[var(--muted-foreground)]">({cart.items.length})</span>}
              </h2>
              {cart && cart.items.length > 0 && (
                <button
                  onClick={createProposal}
                  disabled={saving}
                  className="text-xs text-[var(--primary)] hover:underline font-medium"
                >
                  Создать КП
                </button>
              )}
            </div>

            {!cart || cart.items.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 px-4 text-[var(--muted-foreground)]">
                <Package className="h-12 w-12 opacity-20 mb-3" />
                <p className="text-sm font-medium">Корзина пуста</p>
                <p className="text-xs mt-1 text-center">Нажмите на товар слева, чтобы добавить его в КП</p>
              </div>
            ) : (
              <div className="divide-y divide-[var(--border)]">
                {cart.items.map((item) => {
                  const basePrice = item.priceSnapshot;
                  const markupMult = 1 + (item.markupPercent || 0) / 100;
                  const unitPrice = basePrice * markupMult;
                  const total = unitPrice * item.quantity;

                  return (
                    <div key={item.id} className="p-4 hover:bg-[var(--muted)]/30 transition-colors">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-[var(--foreground)] truncate">
                            {item.product.name}
                          </p>
                          <p className="text-xs text-[var(--muted-foreground)]">{item.product.sku}</p>
                        </div>
                        <button
                          onClick={() => removeItem(item.id)}
                          className="text-[var(--muted-foreground)] hover:text-[var(--destructive)] transition-colors p-1"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>

                      <div className="grid grid-cols-3 gap-2 mt-3">
                        {/* Quantity */}
                        <div>
                          <label className="text-[10px] font-medium text-[var(--muted-foreground)] uppercase tracking-wider">Кол-во</label>
                          <div className="flex items-center gap-1 mt-1">
                            <button
                              onClick={() => updateQuantity(item.id, item.quantity - 1)}
                              disabled={item.quantity <= 1}
                              className="h-7 w-7 rounded-md border border-[var(--border)] flex items-center justify-center hover:bg-[var(--muted)] disabled:opacity-30 transition-colors"
                            >
                              <Minus className="h-3 w-3" />
                            </button>
                            <input
                              type="number"
                              value={item.quantity}
                              onChange={(e) => {
                                const val = parseInt(e.target.value);
                                if (val > 0) updateQuantity(item.id, val);
                              }}
                              className="h-7 w-full text-center text-sm rounded-md border border-[var(--input)] bg-[var(--background)] text-[var(--foreground)] focus:outline-none focus:ring-1 focus:ring-[var(--ring)]"
                              min={1}
                            />
                            <button
                              onClick={() => updateQuantity(item.id, item.quantity + 1)}
                              className="h-7 w-7 rounded-md border border-[var(--border)] flex items-center justify-center hover:bg-[var(--muted)] transition-colors"
                            >
                              <Plus className="h-3 w-3" />
                            </button>
                          </div>
                        </div>

                        {/* Markup */}
                        <div>
                          <label className="text-[10px] font-medium text-[var(--muted-foreground)] uppercase tracking-wider flex items-center gap-1">
                            <Percent className="h-3 w-3" />
                            Наценка
                          </label>
                          <div className="relative mt-1">
                            <input
                              type="number"
                              value={item.markupPercent ?? 0}
                              onChange={(e) => updateMarkup(item.id, Number(e.target.value))}
                              className="h-7 w-full text-sm text-center rounded-md border border-[var(--input)] bg-[var(--background)] text-[var(--foreground)] focus:outline-none focus:ring-1 focus:ring-[var(--ring)] pr-5"
                              min={0}
                              step={0.5}
                            />
                            <span className="absolute right-1.5 top-1/2 -translate-y-1/2 text-xs text-[var(--muted-foreground)]">%</span>
                          </div>
                        </div>

                        {/* Total */}
                        <div>
                          <label className="text-[10px] font-medium text-[var(--muted-foreground)] uppercase tracking-wider">Сумма</label>
                          <p className="mt-1 text-sm font-semibold text-[var(--foreground)]">
                            {formatPrice(total)}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Total and actions */}
            {cart && cart.items.length > 0 && (
              <div className="border-t border-[var(--border)] p-4 space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-[var(--muted-foreground)]">Сумма без скидки:</span>
                  <span>{formatPrice(subtotal)}</span>
                </div>
                {discountPercent > 0 && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-[var(--muted-foreground)]">Скидка {discountPercent}%:</span>
                    <span className="text-[var(--destructive)]">−{formatPrice(discountAmount)}</span>
                  </div>
                )}
                <div className="flex items-center justify-between text-sm">
                  <span className="text-[var(--muted-foreground)]">НДС ({selectedVatRate}%):</span>
                  <span>{formatPrice(vatAmount)}</span>
                </div>
                <div className="flex items-center justify-between pt-2 border-t border-[var(--border)]">
                  <span className="font-semibold">Итого к оплате:</span>
                  <span className="text-lg font-bold text-[var(--foreground)]">{formatPrice(grandTotal)}</span>
                </div>
                <button
                  onClick={() => setShowSettings(true)}
                  className="w-full mt-2 text-xs text-[var(--primary)] hover:underline text-center"
                >
                  ⚙ Настройки цены и скидки
                </button>
              </div>
            )}
          </div>

          {/* Order details */}
          <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-4 shadow-sm space-y-3">
            <h3 className="text-sm font-semibold text-[var(--foreground)] flex items-center gap-2">
              <FileText className="h-4 w-4 text-[var(--primary)]" />
              Детали КП
            </h3>

            <div>
              <label className="text-xs font-medium text-[var(--muted-foreground)]">Название</label>
              <input
                type="text"
                value={proposalTitle}
                onChange={(e) => setProposalTitle(e.target.value)}
                placeholder="Коммерческое предложение"
                className="w-full h-9 px-3 mt-1 rounded-lg border border-[var(--input)] bg-[var(--background)] text-sm text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
              />
            </div>

            <div>
              <label className="text-xs font-medium text-[var(--muted-foreground)] flex items-center gap-1">
                <Building2 className="h-3 w-3" />
                Организация
              </label>
              <select
                value={selectedOrgId}
                onChange={(e) => setSelectedOrgId(e.target.value)}
                className="w-full h-9 px-3 mt-1 rounded-lg border border-[var(--input)] bg-[var(--background)] text-sm text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--ring)] appearance-none"
              >
                <option value="">—</option>
                {organizations.map((o) => (
                  <option key={o.id} value={o.id}>{o.shortName || o.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-medium text-[var(--muted-foreground)] flex items-center gap-1">
                <User className="h-3 w-3" />
                Клиент
              </label>
              <select
                value={selectedClientId}
                onChange={(e) => setSelectedClientId(e.target.value)}
                className="w-full h-9 px-3 mt-1 rounded-lg border border-[var(--input)] bg-[var(--background)] text-sm text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--ring)] appearance-none"
              >
                <option value="">—</option>
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.lastName} {c.firstName}{c.organization ? ` (${c.organization.name})` : ''}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-medium text-[var(--muted-foreground)] flex items-center gap-1">
                <FileText className="h-3 w-3" />
                Шаблон документа
              </label>
              <select
                value={selectedTemplateId}
                onChange={(e) => setSelectedTemplateId(e.target.value)}
                className="w-full h-9 px-3 mt-1 rounded-lg border border-[var(--input)] bg-[var(--background)] text-sm text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--ring)] appearance-none"
              >
                <option value="">Без шаблона</option>
                {templates.map((t) => (
                  <option key={t.id} value={t.id}>{t.name}{t.docType ? ` (${t.docType.name})` : ''}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-medium text-[var(--muted-foreground)]">Действует до</label>
              <input
                type="date"
                value={proposalValidUntil}
                onChange={(e) => setProposalValidUntil(e.target.value)}
                className="w-full h-9 px-3 mt-1 rounded-lg border border-[var(--input)] bg-[var(--background)] text-sm text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
              />
            </div>

            <div>
              <label className="text-xs font-medium text-[var(--muted-foreground)]">Примечания</label>
              <textarea
                value={proposalNotes}
                onChange={(e) => setProposalNotes(e.target.value)}
                rows={2}
                className="w-full px-3 py-2 mt-1 rounded-lg border border-[var(--input)] bg-[var(--background)] text-sm text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--ring)] resize-none"
                placeholder="Опционально"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Settings dialog */}
      {showSettings && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={() => setShowSettings(false)}>
          <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl shadow-xl p-6 w-full max-w-sm mx-4" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold mb-4">⚙ Настройки цены</h3>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-medium text-[var(--muted-foreground)]">
                  Скидка на всё КП: {discountPercent}%
                </label>
                <input
                  type="range"
                  min="0"
                  max="30"
                  step="1"
                  value={discountPercent}
                  onChange={(e) => setDiscountPercent(Number(e.target.value))}
                  className="w-full mt-2"
                />
                <div className="flex justify-between text-xs text-[var(--muted-foreground)] mt-1">
                  <span>0%</span>
                  <span>30%</span>
                </div>
              </div>
              {cart && (
                <div className="bg-[var(--muted)]/30 rounded-lg p-3 space-y-1.5 text-sm">
                  <div className="flex justify-between">
                    <span className="text-[var(--muted-foreground)]">Товаров:</span>
                    <span className="font-medium">{cart.items.length} шт.</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[var(--muted-foreground)]">Сумма до скидки:</span>
                    <span className="font-medium">{formatPrice(subtotal)}</span>
                  </div>
                  {discountPercent > 0 && (
                    <div className="flex justify-between text-[var(--destructive)]">
                      <span>Скидка {discountPercent}%:</span>
                      <span>−{formatPrice(discountAmount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-[var(--muted-foreground)]">
                    <span>НДС ({selectedVatRate}%):</span>
                    <span>{formatPrice(vatAmount)}</span>
                  </div>
                  <div className="flex justify-between font-semibold pt-1 border-t border-[var(--border)]">
                    <span>Итого:</span>
                    <span>{formatPrice(grandTotal)}</span>
                  </div>
                  <div className="flex justify-between text-xs text-[var(--muted-foreground)]">
                    <span>Ставка НДС</span>
                    <span>{selectedOrg?.vatRate ?? 20}%</span>
                  </div>
                </div>
              )}
            </div>
            <div className="flex justify-end mt-4">
              <button
                onClick={() => setShowSettings(false)}
                className="px-4 py-2 rounded-lg bg-[var(--primary)] text-[var(--primary-foreground)] text-sm font-medium"
              >
                Готово
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Row editing dialog */}
      {editDialogVisible && editItemId && (() => {
        const item = cart?.items.find((i) => i.id === editItemId);
        if (!item) return null;
        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={() => setEditDialogVisible(false)}>
            <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl shadow-xl p-6 w-full max-w-md mx-4" onClick={(e) => e.stopPropagation()}>
              <h3 className="text-lg font-semibold mb-4">✎ Редактирование позиции</h3>
              <div className="space-y-3">
                <div>
                  <label className="text-xs font-medium text-[var(--muted-foreground)]">Название</label>
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="w-full h-9 px-3 mt-1 rounded-lg border border-[var(--input)] bg-[var(--background)] text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-[var(--muted-foreground)]">Артикул</label>
                  <input
                    type="text"
                    value={editSku}
                    onChange={(e) => setEditSku(e.target.value)}
                    className="w-full h-9 px-3 mt-1 rounded-lg border border-[var(--input)] bg-[var(--background)] text-sm"
                  />
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="text-xs font-medium text-[var(--muted-foreground)]">Кол-во</label>
                    <input
                      type="number"
                      value={editQuantity}
                      onChange={(e) => setEditQuantity(Math.max(1, Number(e.target.value)))}
                      min={1}
                      className="w-full h-9 px-3 mt-1 rounded-lg border border-[var(--input)] bg-[var(--background)] text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-[var(--muted-foreground)]">Цена</label>
                    <input
                      type="number"
                      value={editPrice}
                      onChange={(e) => setEditPrice(Math.max(0, Number(e.target.value)))}
                      min={0}
                      step={0.01}
                      className="w-full h-9 px-3 mt-1 rounded-lg border border-[var(--input)] bg-[var(--background)] text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-[var(--muted-foreground)]">Наценка %</label>
                    <input
                      type="number"
                      value={editMarkup}
                      onChange={(e) => setEditMarkup(Math.max(0, Number(e.target.value)))}
                      min={0}
                      step={0.5}
                      className="w-full h-9 px-3 mt-1 rounded-lg border border-[var(--input)] bg-[var(--background)] text-sm"
                    />
                  </div>
                </div>
                <div className="pt-2 text-sm">
                  <span className="text-[var(--muted-foreground)]">Итого по позиции: </span>
                  <strong>{formatPrice(editPrice * (1 + editMarkup / 100) * editQuantity)}</strong>
                </div>
              </div>
              <div className="flex justify-end gap-2 mt-4">
                <button
                  onClick={() => setEditDialogVisible(false)}
                  className="px-4 py-2 rounded-lg border border-[var(--border)] text-sm hover:bg-[var(--muted)] transition-colors"
                >
                  Отмена
                </button>
                <button
                  onClick={saveEditItem}
                  className="px-4 py-2 rounded-lg bg-[var(--primary)] text-[var(--primary-foreground)] text-sm font-medium hover:opacity-90"
                >
                  💾 Сохранить
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* PDF Preview Modal */}
      {showPdfPreview && (() => {
        const data = pdfData();
        if (!data) return null;
        return (
          <DocPreview title={`Предпросмотр КП — ${data.number}`} onDownload={handleDownloadPdf} downloadLabel="Скачать PDF">
            <div className="space-y-6 font-sans text-sm">
              {data.organization && (
                <div className="text-xs text-gray-600">
                  <p className="font-medium">{data.organization.name}</p>
                </div>
              )}

              <div className="text-center">
                <h1 className="text-xl font-bold">КОММЕРЧЕСКОЕ ПРЕДЛОЖЕНИЕ</h1>
                <p className="text-lg">№ {data.number}</p>
                <p className="text-sm text-gray-500">от {new Date(data.createdAt).toLocaleDateString('ru-RU')}</p>
              </div>

              {data.client && (
                <div className="border-b pb-4">
                  <p className="font-medium">Клиент:</p>
                  <p>{data.client.lastName} {data.client.firstName} {data.client.patronymic || ''}</p>
                  {data.client.phone && <p>Тел: {data.client.phone}</p>}
                </div>
              )}

              <div>
                <p><span className="font-medium">Наименование:</span> {data.title}</p>
              </div>

              {data.items && data.items.length > 0 && (
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="border p-2 text-left">Наименование</th>
                      <th className="border p-2 text-right">Кол-во</th>
                      <th className="border p-2 text-center">Ед.</th>
                      <th className="border p-2 text-right">Цена</th>
                      <th className="border p-2 text-right">Сумма</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.items.map((item, index) => (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="border p-2">{item.name}</td>
                        <td className="border p-2 text-right">{item.quantity}</td>
                        <td className="border p-2 text-center">{item.unit || 'шт'}</td>
                        <td className="border p-2 text-right">{item.unitPrice.toLocaleString('ru-RU')} ₽</td>
                        <td className="border p-2 text-right">{item.total.toLocaleString('ru-RU')} ₽</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="bg-gray-100 font-bold">
                      <td colSpan={4} className="border p-2 text-right">ИТОГО:</td>
                      <td className="border p-2 text-right">
                        {data.items.reduce((s, i) => s + i.total, 0).toLocaleString('ru-RU')} ₽
                      </td>
                    </tr>
                  </tfoot>
                </table>
              )}

              {data.notes && (
                <div>
                  <p className="font-medium">Примечания:</p>
                  <p className="whitespace-pre-wrap">{data.notes}</p>
                </div>
              )}

              {data.validUntil && (
                <p><span className="font-medium">Действительно до:</span> {new Date(data.validUntil).toLocaleDateString('ru-RU')}</p>
              )}

              <div className="pt-8 border-t">
                <p>Подпись: ___________________</p>
              </div>
            </div>
          </DocPreview>
        );
      })()}
    </div>
  );
}
