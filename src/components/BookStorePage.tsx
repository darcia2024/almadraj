import React, { useState, useMemo } from 'react';
import {
  ArrowLeft,
  ArrowUpRight,
  BookOpen,
  Calendar,
  Check,
  CheckCircle2,
  ChevronRight,
  Compass,
  Copy,
  CreditCard,
  ExternalLink,
  Filter,
  GraduationCap,
  Heart,
  HelpCircle,
  Info,
  Layers,
  MapPin,
  MessageCircle,
  Package,
  RotateCcw,
  Search,
  Share2,
  ShieldCheck,
  Sparkles,
  Tag,
  Truck,
  UserRound,
  X
} from 'lucide-react';
import {
  BOOK_CATEGORIES,
  BOOKS_DATA,
  BOOKSTORE_CONTACT,
  BookCategory,
  BookItem
} from '../data/booksData';

export const BookStorePage: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState<BookCategory>('Semua');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeBook, setActiveBook] = useState<BookItem | null>(null);
  const [copiedSlug, setCopiedSlug] = useState<string | null>(null);
  const [copiedAccount, setCopiedAccount] = useState<string | null>(null);

  // Filter books based on category and search query
  const filteredBooks = useMemo(() => {
    return BOOKS_DATA.filter((book) => {
      const matchCategory = selectedCategory === 'Semua' || book.category === selectedCategory;
      const q = searchQuery.toLowerCase().trim();
      const matchQuery =
        !q ||
        book.title.toLowerCase().includes(q) ||
        (book.subtitle && book.subtitle.toLowerCase().includes(q)) ||
        book.arabicTitle.toLowerCase().includes(q) ||
        book.author.toLowerCase().includes(q) ||
        (book.foreword && book.foreword.toLowerCase().includes(q)) ||
        book.publisher.toLowerCase().includes(q) ||
        book.category.toLowerCase().includes(q);
      return matchCategory && matchQuery;
    });
  }, [selectedCategory, searchQuery]);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0
    }).format(price);
  };

  const handleShare = (book: BookItem, e: React.MouseEvent) => {
    e.stopPropagation();
    const url = window.location.origin + `/buku#${book.slug}`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(url);
      setCopiedSlug(book.slug);
      setTimeout(() => setCopiedSlug(null), 2000);
    }
  };

  const handleCopyAccount = (accountNum: string) => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(accountNum);
      setCopiedAccount(accountNum);
      setTimeout(() => setCopiedAccount(null), 2000);
    }
  };

  const getWhatsAppOrderUrl = (book: BookItem) => {
    const waNumber = book.contactPerson?.whatsapp || BOOKSTORE_CONTACT.whatsappNumber;
    const text = book.whatsappMessage || 
      `Assalamu'alaikum Admin Al Madraj, saya tertarik memesan Kitab *${book.title}* (${formatPrice(book.price)}). Apakah stok masih tersedia?`;
    return `https://wa.me/${waNumber}?text=${encodeURIComponent(text)}`;
  };


  return (
    <div className="bookstore-page min-h-screen bg-[#f7faf8] text-[#162720] selection:bg-[#83c5be] selection:text-[#004d54] font-sans">
      {/* 1. TOP BAR NAVIGATION */}
      <header className="sticky top-0 z-40 w-full border-b border-[#006d77]/10 bg-white/95 backdrop-blur-md shadow-[0_4px_20px_rgba(0,109,119,0.04)]">
        <div className="mx-auto flex h-16 w-full max-w-[1320px] items-center justify-between px-4 sm:px-8 lg:px-10">
          {/* Brand Logo & Back to Home */}
          <div className="flex items-center gap-3">
            <a
              href="/website"
              className="flex items-center gap-2 rounded-full py-1.5 pr-3 text-xs font-semibold text-[#006d77] transition-all hover:bg-[#83c5be]/15"
              title="Kembali ke Beranda Al Madraj"
            >
              <ArrowLeft className="h-4 w-4" />
              <span className="hidden sm:inline">Beranda</span>
            </a>
            <div className="h-4 w-px bg-slate-200 hidden sm:block" />
            <a href="/buku" className="flex items-center gap-2.5">
              <img
                src="/al-madroj-brand.png"
                alt="Logo Al Madraj"
                className="h-8 w-10 sm:h-9 sm:w-11 object-contain"
              />
              <div className="flex flex-col">
                <span className="text-[14px] sm:text-[15px] font-bold tracking-[0.04em] text-[#006d77] leading-none">
                  AL MADRAJ
                </span>
                <span className="text-[9px] font-bold uppercase tracking-[0.14em] text-[#83c5be] mt-0.5">
                  Maktabah & Toko Buku
                </span>
              </div>
            </a>
          </div>

          {/* Right Action Links */}
          <div className="flex items-center gap-3">
            <a
              href="/website#katalog"
              className="hidden md:flex items-center gap-1.5 text-xs font-semibold text-[#557064] transition-colors hover:text-[#006d77]"
            >
              <GraduationCap className="h-4 w-4 text-[#006d77]" />
              <span>Katalog Dars</span>
            </a>
            <a
              href={`https://wa.me/${BOOKSTORE_CONTACT.whatsappNumber}?text=${encodeURIComponent("Assalamu'alaikum Admin Al Madraj, saya ingin konsultasi pemesanan kitab turats.")}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-full bg-[#006d77] px-4 py-2 text-xs font-bold text-white shadow-xs transition-all hover:bg-[#00565e] active:scale-95"
            >
              <MessageCircle className="h-3.5 w-3.5 text-[#83c5be]" />
              <span>Hubungi Admin</span>
            </a>
          </div>
        </div>
      </header>

      {/* 2. HERO HEADER SECTION */}
      <section className="relative overflow-hidden bg-gradient-to-b from-white via-[#f3f9f6] to-[#e4f2ec] px-4 pb-12 pt-8 sm:px-8 sm:pb-16 sm:pt-16 lg:px-10 lg:pb-20 lg:pt-20">
        {/* Ambient Glow Orbs */}
        <div className="pointer-events-none absolute -left-20 -top-20 h-72 w-72 rounded-full bg-[#83c5be]/30 blur-3xl" />
        <div className="pointer-events-none absolute -right-20 -bottom-20 h-80 w-80 rounded-full bg-[#006d77]/15 blur-3xl" />

        <div className="relative z-10 mx-auto max-w-4xl text-center">
          {/* Overline Badge */}
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#006d77]">
            Katalog Terbitan Resmi · Al-Madraj Publishing
          </p>

          {/* Grand Headline matching Landing Page */}
          <h1 className="mt-6 max-w-3xl mx-auto text-[clamp(2.8rem,5.3vw,5.8rem)] font-normal leading-[0.9] tracking-[-0.04em] text-[#006d77]">
            Pustaka <span className="whitespace-nowrap font-serif italic font-normal text-[#167a5b]">Al Madraj.</span>
          </h1>

          {/* Description Paragraphs matching Landing Page */}
          <p className="mt-6 max-w-xl mx-auto text-[15px] leading-6 text-[#557064] sm:text-lg sm:leading-7">
            Karya-karya ilmiah orisinal asatidz alumni Universitas Al-Azhar Kairo di bawah naungan Al-Madraj Publishing.
          </p>
          <p className="mt-3 max-w-xl mx-auto text-[15px] leading-6 text-[#557064] sm:text-lg sm:leading-7">
            Tersedia edisi cetak Pre-Order dengan harga spesial untuk wilayah Mesir dan Indonesia, diproses amanah langsung oleh tim Al Madraj.
          </p>

          {/* Search Bar Input matching Landing Page Dock */}
          <div className="mt-8 mx-auto max-w-xl">
            <label className="flex min-h-12 w-full items-center gap-3 rounded-full border border-[#cfe2d6] bg-white px-4 text-sm text-[#4d695b] shadow-[0_2px_12px_rgba(7,84,71,0.04)] transition-all focus-within:border-[#006d77] focus-within:ring-2 focus-within:ring-[#006d77]/10">
              <Search className="h-4 w-4 shrink-0 text-[#167a5b]" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari judul buku, pengarang, atau kata kunci..."
                className="min-w-0 flex-1 bg-transparent text-[#133227] outline-none placeholder:text-[#9ab1a4]"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="flex h-5 w-5 items-center justify-center rounded-full bg-[#e3efe7] text-[10px] text-[#557263] hover:bg-[#d5e8dc]"
                  title="Hapus pencarian"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </label>
          </div>

          {/* Category Filter Pills matching Landing Page */}
          <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
            {BOOK_CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`min-h-10 sm:min-h-11 rounded-full px-4 sm:px-5 text-xs sm:text-sm font-semibold transition-all ${
                  selectedCategory === cat
                    ? 'bg-[#006d77] text-white shadow-sm'
                    : 'bg-white/90 text-[#486659] border border-[#d2e7de] hover:border-[#83c5be] hover:bg-white'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Trust Highlights Strip matching Landing Page Card Style */}
          <div className="mt-10 grid grid-cols-2 gap-3 sm:grid-cols-4 max-w-3xl mx-auto text-left">
            <div className="flex items-center gap-2.5 rounded-2xl bg-white/80 p-3.5 border border-[#dce8df] shadow-[0_2px_12px_rgba(7,84,71,0.04)]">
              <ShieldCheck className="h-5 w-5 shrink-0 text-[#006d77]" />
              <div className="min-w-0">
                <p className="text-xs font-bold text-[#006d77]">100% Karya Orisinal</p>
                <p className="text-[11px] text-[#618072] truncate">Asatidz Al-Azhar Kairo</p>
              </div>
            </div>
            <div className="flex items-center gap-2.5 rounded-2xl bg-white/80 p-3.5 border border-[#dce8df] shadow-[0_2px_12px_rgba(7,84,71,0.04)]">
              <Sparkles className="h-5 w-5 shrink-0 text-[#006d77]" />
              <div className="min-w-0">
                <p className="text-xs font-bold text-[#006d77]">Kajian Berbobot</p>
                <p className="text-[11px] text-[#618072] truncate">Aswaja & Turats Mu'tamad</p>
              </div>
            </div>
            <div className="flex items-center gap-2.5 rounded-2xl bg-white/80 p-3.5 border border-[#dce8df] shadow-[0_2px_12px_rgba(7,84,71,0.04)]">
              <Truck className="h-5 w-5 shrink-0 text-[#006d77]" />
              <div className="min-w-0">
                <p className="text-xs font-bold text-[#006d77]">Mesir & Indonesia</p>
                <p className="text-[11px] text-[#618072] truncate">Jalur Distribusi Resmi</p>
              </div>
            </div>
            <div className="flex items-center gap-2.5 rounded-2xl bg-white/80 p-3.5 border border-[#dce8df] shadow-[0_2px_12px_rgba(7,84,71,0.04)]">
              <MessageCircle className="h-5 w-5 shrink-0 text-[#006d77]" />
              <div className="min-w-0">
                <p className="text-xs font-bold text-[#006d77]">Pesan Langsung</p>
                <p className="text-[11px] text-[#618072] truncate">WhatsApp Resmi Ustadz</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. BOOK CATALOG GRID SECTION */}
      <section className="mx-auto max-w-[1320px] px-4 py-12 sm:px-8 sm:py-16 lg:px-10">
        {/* Results Header matching Landing Page */}
        <div className="mb-10 text-center max-w-2xl mx-auto pb-6 border-b border-[#dcebe3]">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#006d77]">
            Katalog Terbitan Al-Madraj Publishing
          </p>
          <h2 className="mt-3 text-3xl font-normal leading-[1.05] tracking-[-0.03em] text-[#0d2a20] sm:text-5xl lg:text-[54px]">
            Pilihan buku ilmiah <br className="hidden sm:inline" />
            <span className="font-serif italic font-normal text-[#167a5b]">karya asatidz Al-Madraj.</span>
          </h2>
          <p className="mt-3 text-sm leading-7 text-[#587365] sm:text-base">
            Dapatkan karya orisinal berbobot dengan metodologi Ahlussunnah wal Jama'ah yang jernih, langsung dari penulis dan penerbit resmi Al-Madraj Publishing.
          </p>

          {searchQuery && (
            <div className="mt-4 inline-flex items-center gap-2 text-xs sm:text-sm text-[#5f7e71] bg-white px-3.5 py-1.5 rounded-full border border-[#dcebe3]">
              <span>Hasil pencarian: <strong>"{searchQuery}"</strong></span>
              <button
                onClick={() => setSearchQuery('')}
                className="text-[#006d77] font-semibold underline hover:text-[#004d54]"
              >
                Reset
              </button>
            </div>
          )}
        </div>

        {/* Empty State */}
        {filteredBooks.length === 0 && (
          <div className="rounded-3xl border border-dashed border-[#b8dbcf] bg-white p-12 text-center my-8">
            <BookOpen className="mx-auto h-12 w-12 text-[#83c5be]" />
            <h3 className="mt-4 text-base font-medium text-[#006d77]">
              Buku yang dicari tidak ditemukan
            </h3>
            <p className="mt-1 text-xs text-[#638274] max-w-md mx-auto">
              Coba gunakan kata kunci lain atau pilih kategori yang berbeda. Kamu juga bisa memesan judul khusus via WhatsApp Admin.
            </p>
            <div className="mt-5 flex justify-center gap-3">
              <button
                onClick={() => {
                  setSelectedCategory('Semua');
                  setSearchQuery('');
                }}
                className="rounded-full bg-[#006d77] px-4 py-2 text-xs font-semibold text-white hover:bg-[#00545d]"
              >
                Tampilkan Semua Buku
              </button>
              <a
                href={`https://wa.me/${BOOKSTORE_CONTACT.whatsappNumber}?text=${encodeURIComponent(`Assalamu'alaikum Admin, saya mencari buku: "${searchQuery}". Apakah bisa dipesankan?`)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-full border border-[#83c5be] bg-white px-4 py-2 text-xs font-semibold text-[#006d77] hover:bg-[#83c5be]/10"
              >
                Tanya Admin via WA
              </a>
            </div>
          </div>
        )}

        {/* Books Grid - Centered 3 items */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 sm:gap-7 max-w-[360px] sm:max-w-5xl mx-auto">
          {filteredBooks.map((book) => {
            const hasDiscount = book.originalPrice && book.originalPrice > book.price;
            const discountPercent = hasDiscount
              ? Math.round(((book.originalPrice! - book.price) / book.originalPrice!) * 100)
              : 0;
            const isPreOrder = book.stockStatus === 'preorder';

            return (
              <article
                key={book.id}
                onClick={() => setActiveBook(book)}
                className="group relative flex h-full cursor-pointer flex-col overflow-hidden rounded-[16px] sm:rounded-[22px] border border-[#dce8df] bg-white shadow-[0_3px_16px_rgba(7,84,71,0.04)] transition-all duration-300 ease-out hover:-translate-y-1 hover:border-[#006d77]/50 hover:shadow-[0_16px_36px_rgba(7,84,71,0.10)]"
              >
                {/* Book Cover Container with 3D Spine Effect */}
                <div className="relative aspect-[3/4] sm:aspect-[4/5] w-full overflow-hidden shadow-xs bg-[#eef5f1]">
                  {book.coverImage ? (
                    <img
                      src={book.coverImage}
                      alt={book.title}
                      loading="lazy"
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  ) : (
                    /* Elegant Gradient Placeholder Cover */
                    <div
                      className={`h-full w-full bg-gradient-to-br ${book.gradientCover} p-3 sm:p-4 text-white flex flex-col justify-between relative overflow-hidden`}
                    >
                      {/* Book Spine Texture Line */}
                      <div className="absolute inset-y-0 left-0 w-3 bg-black/20 border-r border-white/20 shadow-inner" />
                      
                      {/* Top Header on Cover */}
                      <div className="pl-3 space-y-1">
                        <span className="text-[8px] sm:text-[9px] font-bold uppercase tracking-wider text-[#83c5be] bg-black/25 px-2 py-0.5 rounded-full backdrop-blur-xs">
                          {book.category}
                        </span>
                      </div>

                      {/* Arabic Title on Cover */}
                      <div className="pl-3 my-auto text-center">
                        <p className="font-serif text-sm sm:text-base lg:text-lg font-medium text-white/95 leading-snug drop-shadow-sm line-clamp-3">
                          {book.arabicTitle}
                        </p>
                      </div>

                      {/* Bottom Mu'allif on Cover */}
                      <div className="pl-3 border-t border-white/20 pt-2 text-[8px] sm:text-[9px] text-white/80 line-clamp-1">
                        {book.author}
                      </div>
                    </div>
                  )}

                  {/* Stock Status / Discount Badges */}
                  <div className="absolute top-2.5 right-2.5 flex flex-col items-end gap-1">
                    {hasDiscount && (
                      <span className="rounded-full bg-rose-500 px-2 py-0.5 text-[9px] font-black text-white shadow-xs">
                        -{discountPercent}%
                      </span>
                    )}
                    {isPreOrder ? (
                      <span className="rounded-full bg-gradient-to-r from-amber-600 to-amber-500 px-2 py-0.5 text-[8px] sm:text-[9px] font-bold text-white backdrop-blur-xs shadow-xs">
                        Pre-Order
                      </span>
                    ) : (
                      <span className="rounded-full bg-emerald-600/90 px-2 py-0.5 text-[8px] sm:text-[9px] font-bold text-white backdrop-blur-xs shadow-xs">
                        Ready
                      </span>
                    )}
                  </div>
                </div>

                {/* Card Body matching ProgramCard in WebsitePage */}
                <div className="flex flex-1 flex-col p-4 sm:p-5 text-center items-center">
                  {/* Category & Region Pill */}
                  <div className="flex items-center justify-center gap-1.5 mb-2 flex-wrap">
                    <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-[#006d77] bg-[#83c5be]/20 px-2.5 py-0.5 rounded-full">
                      {book.category}
                    </span>
                    {book.targetRegion && (
                      <span className="text-[9px] sm:text-[10px] text-[#5c7a6e] font-medium truncate max-w-[150px]">
                        📍 {book.targetRegion.replace('Khusus Domisili ', '')}
                      </span>
                    )}
                  </div>

                  {/* Judul Kitab */}
                  <h3 className="text-center text-sm sm:text-[17px] font-bold leading-snug tracking-tight text-[#143428] transition-colors group-hover:text-[#006d77] line-clamp-2 min-h-[36px] sm:min-h-[46px]">
                    {book.title}
                  </h3>

                  {/* Subjudul jika ada */}
                  {book.subtitle ? (
                    <p className="text-center mt-1 text-[11px] sm:text-[12px] italic text-[#167a5b] line-clamp-2">
                      {book.subtitle}
                    </p>
                  ) : null}

                  {/* Ringkasan Deskripsi */}
                  <p className="text-center mt-2 text-[11.5px] sm:text-[12.5px] leading-relaxed text-[#597365] line-clamp-2 min-h-[32px] sm:min-h-[36px]">
                    {book.description}
                  </p>

                  {/* Kata Pengantar jika ada */}
                  {book.foreword && (
                    <p className="text-center mt-2 text-[10px] sm:text-[11px] text-[#2c5344] bg-[#eef7f2] px-2.5 py-1 rounded-md font-medium max-w-full truncate">
                      Pengantar: {book.foreword.split('(')[0]}
                    </p>
                  )}

                  {/* Elegant Hairline Metadata Divider matching WebsitePage */}
                  <div className="w-full mt-3 pt-2.5 border-t border-[#eaf1ec] flex items-center justify-center gap-3 text-xs text-[#527061]">
                    <div className="flex items-center gap-1.5">
                      <UserRound className="h-3.5 w-3.5 text-[#86a292] shrink-0" />
                      <span className="font-medium text-[11px] sm:text-[12px]">{book.author}</span>
                    </div>
                    <span className="text-[#86a292]">•</span>
                    <span className="text-[11px] sm:text-[12px] font-medium text-[#739282]">
                      {book.publisher.split('(')[0]}
                    </span>
                  </div>

                  {/* Footer: Harga & Tombol Aksi matching WebsitePage */}
                  <div className="w-full mt-auto flex flex-col items-center justify-center gap-2.5 pt-4 text-center">
                    <div className="text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <p className="text-[9px] sm:text-[10px] font-medium uppercase tracking-wider text-[#789585]">
                          {isPreOrder ? 'HARGA PO' : 'HARGA'}
                        </p>
                        {hasDiscount && (
                          <span className="text-[10px] text-[#93ada0] line-through">
                            {formatPrice(book.originalPrice!)}
                          </span>
                        )}
                      </div>
                      <p className="mt-0.5 text-base sm:text-xl font-extrabold tracking-tight text-[#006d77]">
                        {formatPrice(book.price)}
                      </p>
                    </div>

                    <span className="flex min-h-9 w-full max-w-[200px] items-center justify-center gap-1.5 rounded-full bg-[#006d77] px-4 text-xs font-bold text-white shadow-[0_4px_12px_rgba(2,118,128,0.18)] transition-all duration-300 group-hover:bg-[#00565e]">
                      Lihat Detail <ChevronRight className="h-3.5 w-3.5" />
                    </span>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      {/* 4. BOOK DETAIL MODAL (QUICK VIEW) */}
      {activeBook && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs transition-opacity animate-in fade-in"
          onClick={() => setActiveBook(null)}
        >
          <div
            className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-[32px] bg-white p-5 sm:p-7 shadow-2xl border border-[#cfe5dc]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button
              onClick={() => setActiveBook(null)}
              className="absolute right-4 top-4 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-[#f0f6f3] text-[#446657] hover:bg-[#dbeee4] hover:text-[#006d77] transition-all"
              title="Tutup"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="grid gap-6 sm:grid-cols-[200px_1fr]">
              {/* Left: Book Cover */}
              <div>
                <div className="relative aspect-[3/4] w-full overflow-hidden rounded-2xl shadow-md bg-[#eef5f1]">
                  {activeBook.coverImage ? (
                    <img
                      src={activeBook.coverImage}
                      alt={activeBook.title}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div
                      className={`h-full w-full bg-gradient-to-br ${activeBook.gradientCover} p-4 text-white flex flex-col justify-between relative overflow-hidden`}
                    >
                      <div className="absolute inset-y-0 left-0 w-3.5 bg-black/20 border-r border-white/20 shadow-inner" />
                      <span className="pl-3 text-[9px] font-bold uppercase tracking-wider text-[#83c5be] bg-black/30 px-2.5 py-0.5 rounded-full w-fit">
                        {activeBook.category}
                      </span>
                      <p className="pl-3 font-serif text-base font-medium text-center leading-snug my-auto">
                        {activeBook.arabicTitle}
                      </p>
                      <p className="pl-3 text-[10px] text-white/80 border-t border-white/20 pt-2 line-clamp-1">
                        {activeBook.author}
                      </p>
                    </div>
                  )}
                </div>

                {/* Price Display in Mobile Modal */}
                <div className="mt-4 rounded-2xl bg-[#f0f8f4] p-3 text-center border border-[#d6ebe0]">
                  {activeBook.originalPrice && activeBook.originalPrice > activeBook.price && (
                    <p className="text-xs text-[#8ca699] line-through">
                      {formatPrice(activeBook.originalPrice)}
                    </p>
                  )}
                  <p className="text-lg font-bold text-[#006d77]">
                    {formatPrice(activeBook.price)}
                  </p>
                  {activeBook.stockStatus === 'preorder' ? (
                    <span className="inline-block mt-1 rounded-full bg-amber-100 px-2.5 py-0.5 text-[10px] font-bold text-amber-800">
                      Pre-Order
                    </span>
                  ) : (
                    <span className="inline-block mt-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-[10px] font-bold text-emerald-800">
                      Stok Tersedia
                    </span>
                  )}
                </div>

                {/* Target Region Meta Box */}
                {activeBook.targetRegion && (
                  <div className="mt-3 rounded-2xl bg-[#fbf8f0] p-3 text-left border border-[#eddcb7] text-xs">
                    <div className="flex items-start gap-1.5 text-[#6d5119]">
                      <MapPin className="h-3.5 w-3.5 text-[#b07d19] shrink-0 mt-0.5" />
                      <div>
                        <span className="text-[10px] font-bold block uppercase">Wilayah Pemesanan:</span>
                        <span className="font-semibold text-[11px]">{activeBook.targetRegion}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Right: Book Details & Specs */}
              <div className="space-y-4 text-left">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="rounded-full bg-[#83c5be]/20 px-2.5 py-0.5 text-[10px] font-bold text-[#006d77]">
                      {activeBook.category}
                    </span>
                    <span className="text-xs text-[#638475]">• {activeBook.publisher}</span>
                  </div>
                  <h3 className="mt-2 text-lg sm:text-xl font-medium tracking-tight text-[#004d54] leading-snug">
                    {activeBook.title}
                  </h3>
                  {activeBook.subtitle && (
                    <p className="font-sans text-xs sm:text-sm font-semibold italic text-[#167a5b] mt-0.5">
                      {activeBook.subtitle}
                    </p>
                  )}
                  <p className="font-serif text-sm sm:text-base font-normal text-[#167a5b] mt-1">
                    {activeBook.arabicTitle}
                  </p>
                  <p className="text-xs text-[#527364] mt-1">
                    Karya: <strong>{activeBook.author}</strong>
                  </p>
                </div>

                {/* Foreword Box */}
                {activeBook.foreword && (
                  <div className="rounded-2xl bg-[#f0f8f4] p-3 border border-[#d2ebe0] text-xs text-[#204a3c]">
                    <span className="text-[10px] uppercase font-bold text-[#006d77] tracking-wider block">
                      Kata Pengantar
                    </span>
                    <p className="mt-0.5 font-semibold">{activeBook.foreword}</p>
                  </div>
                )}

                {/* Synopsis */}
                <div className="rounded-2xl bg-[#f9fbf9] p-3.5 border border-[#e4efe8] text-xs leading-relaxed text-[#3f5d50]">
                  {activeBook.description}
                </div>

                {/* Specifications Grid */}
                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <div className="rounded-xl bg-[#f4f9f6] p-2 border border-[#e1efe6]">
                    <span className="text-[#759385] block text-[10px]">Tebal Halaman</span>
                    <strong className="text-[#143428]">{activeBook.pages} Halaman</strong>
                  </div>
                  <div className="rounded-xl bg-[#f4f9f6] p-2 border border-[#e1efe6]">
                    <span className="text-[#759385] block text-[10px]">Jenis Jilid</span>
                    <strong className="text-[#143428]">{activeBook.coverType}</strong>
                  </div>
                  <div className="rounded-xl bg-[#f4f9f6] p-2 border border-[#e1efe6]">
                    <span className="text-[#759385] block text-[10px]">Jenis Kertas</span>
                    <strong className="text-[#143428]">{activeBook.paperType}</strong>
                  </div>
                  <div className="rounded-xl bg-[#f4f9f6] p-2 border border-[#e1efe6]">
                    <span className="text-[#759385] block text-[10px]">Perkiraan Berat</span>
                    <strong className="text-[#143428]">{activeBook.weight}</strong>
                  </div>
                </div>

                {/* Key Features */}
                {activeBook.keyFeatures?.length > 0 && (
                  <div className="space-y-1.5 pt-1">
                    <p className="text-[11px] font-bold text-[#006d77]">Keunggulan Edisi Ini:</p>
                    <ul className="space-y-1 text-xs text-[#446657]">
                      {activeBook.keyFeatures.map((feat, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <Check className="h-3.5 w-3.5 text-[#006d77] shrink-0 mt-0.5" />
                          <span>{feat}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Bank Account Info (if book has specific bank) */}
                {activeBook.bankAccount && (
                  <div className="rounded-2xl bg-[#fffbf2] p-3.5 border border-[#eedcba] text-xs text-[#634812]">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <CreditCard className="h-4 w-4 text-[#b2791d]" />
                        <strong className="font-bold text-[#4d360a]">Rekening Pembayaran:</strong>
                      </div>
                      <button
                        onClick={() => handleCopyAccount(activeBook.bankAccount!.accountNumber)}
                        className="flex items-center gap-1 text-[11px] font-bold text-[#006d77] bg-white px-2.5 py-1 rounded-full border border-[#d6cfbe] hover:bg-[#faf4e8] transition-all"
                      >
                        {copiedAccount === activeBook.bankAccount.accountNumber ? (
                          <>
                            <Check className="h-3 w-3 text-emerald-600" />
                            <span className="text-emerald-700">Tersalin!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="h-3 w-3" />
                            <span>Salin Rekening</span>
                          </>
                        )}
                      </button>
                    </div>
                    <p className="mt-1.5 text-xs font-mono font-bold text-[#1f2b24]">
                      {activeBook.bankAccount.bank} : {activeBook.bankAccount.accountNumber}
                    </p>
                    <p className="text-[11px] text-[#7a602e]">
                      a.n {activeBook.bankAccount.accountName}
                    </p>
                  </div>
                )}

                {/* Contact Person Box */}
                {activeBook.contactPerson && (
                  <div className="rounded-2xl bg-[#eef7f3] p-3 border border-[#cbe6d8] flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <span className="text-[10px] uppercase font-bold text-[#006d77] tracking-wider block">
                        Contact Person Pemesanan
                      </span>
                      <p className="text-xs font-bold text-[#143428] truncate">{activeBook.contactPerson.name}</p>
                      <p className="text-[11px] text-[#557567]">{activeBook.contactPerson.whatsappDisplay}</p>
                    </div>
                    <a
                      href={getWhatsAppOrderUrl(activeBook)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex shrink-0 items-center gap-1.5 rounded-full bg-[#25D366] px-3.5 py-2 text-xs font-bold text-white shadow-xs hover:bg-[#1ebd59] transition-all"
                    >
                      <MessageCircle className="h-3.5 w-3.5" />
                      <span>Chat WA</span>
                    </a>
                  </div>
                )}

                {/* Step-by-Step Cara Pemesanan */}
                {activeBook.orderSteps && activeBook.orderSteps.length > 0 && (
                  <div className="space-y-1.5 rounded-2xl bg-[#f8faf9] p-3 border border-[#e1ece5]">
                    <p className="text-[11px] font-bold text-[#006d77]">Cara Pemesanan:</p>
                    <ol className="space-y-1 text-xs text-[#3b5e4f] list-decimal list-inside">
                      {activeBook.orderSteps.map((step, idx) => (
                        <li key={idx} className="leading-relaxed">
                          <span>{step}</span>
                        </li>
                      ))}
                    </ol>
                  </div>
                )}

                {/* Actions: WhatsApp Direct & Marketplace */}
                <div className="pt-3 border-t border-[#e2efe7] flex flex-col sm:flex-row gap-2.5">
                  <a
                    href={getWhatsAppOrderUrl(activeBook)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 flex items-center justify-center gap-2 rounded-full bg-[#006d77] px-5 py-3 text-xs font-bold text-white shadow-sm hover:bg-[#00545d] active:scale-95 transition-all"
                  >
                    <MessageCircle className="h-4 w-4 text-[#83c5be]" />
                    <span>
                      {activeBook.stockStatus === 'preorder' ? 'Pesan Pre-Order via WhatsApp' : 'Pesan via WhatsApp'}
                    </span>
                  </a>

                  {activeBook.purchaseUrl ? (
                    <a
                      href={activeBook.purchaseUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center gap-2 rounded-full border border-[#83c5be] bg-white px-4 py-3 text-xs font-semibold text-[#006d77] hover:bg-[#83c5be]/10 transition-all"
                    >
                      <span>Beli di Toko Online</span>
                      <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                  ) : (
                    <button
                      onClick={(e) => handleShare(activeBook, e)}
                      className="flex items-center justify-center gap-1.5 rounded-full border border-[#d2e7dd] bg-white px-4 py-3 text-xs font-semibold text-[#507062] hover:bg-[#f4f9f6] transition-all"
                    >
                      <Share2 className="h-3.5 w-3.5" />
                      <span>{copiedSlug === activeBook.slug ? 'Tersalin!' : 'Bagi Link'}</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}


      {/* 5. ORDER & SHIPPING INFO ACCORDION */}
      <section className="bg-gradient-to-b from-white to-[#edf6f1] py-14 border-t border-[#d8ece1]">
        <div className="mx-auto max-w-4xl px-4 sm:px-8">
          <div className="text-center">
            <h2 className="text-2xl font-normal tracking-[-0.02em] text-[#006d77]">
              Panduan <span className="font-serif italic text-[#167a5b]">Pemesanan & Pengiriman</span>
            </h2>
            <p className="mt-2 text-xs sm:text-sm text-[#527364]">
              Proses mudah, amanah, dan terpercaya langsung diproses oleh tim Al Madraj.
            </p>
          </div>

          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            <div className="rounded-3xl bg-white p-5 border border-[#d2e7dd] shadow-xs">
              <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#83c5be]/20 text-[#006d77] font-bold text-sm">
                1
              </span>
              <h3 className="mt-4 text-sm font-semibold text-[#1e3d33]">Pilih Judul Kitab</h3>
              <p className="mt-1 text-xs text-[#527364] leading-relaxed">
                Pilih kitab yang kamu butuhkan atau sesuaikan dengan maddah kuliah / talaqqi yang sedang kamu ikuti.
              </p>
            </div>

            <div className="rounded-3xl bg-white p-5 border border-[#d2e7dd] shadow-xs">
              <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#83c5be]/20 text-[#006d77] font-bold text-sm">
                2
              </span>
              <h3 className="mt-4 text-sm font-semibold text-[#1e3d33]">Konfirmasi WhatsApp</h3>
              <p className="mt-1 text-xs text-[#527364] leading-relaxed">
                Klik tombol "Pesan via WhatsApp". Admin akan mengonfirmasi ketersediaan cetakan dan menghitung ongkos kirim.
              </p>
            </div>

            <div className="rounded-3xl bg-white p-5 border border-[#d2e7dd] shadow-xs">
              <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#83c5be]/20 text-[#006d77] font-bold text-sm">
                3
              </span>
              <h3 className="mt-4 text-sm font-semibold text-[#1e3d33]">Kirim & Terima</h3>
              <p className="mt-1 text-xs text-[#527364] leading-relaxed">
                Kitab dipacking aman dengan bubble wrap tebal dan kardus pelindung agar tiba tanpa cacat di tanganmu.
              </p>
            </div>
          </div>

          {/* Delivery Note Box */}
          <div className="mt-6 flex items-start gap-3 rounded-2xl bg-[#e6f4ed] p-4 text-xs text-[#2f5e4c] border border-[#c1e2d2]">
            <Truck className="h-5 w-5 shrink-0 text-[#006d77] mt-0.5" />
            <div>
              <strong className="font-bold">Info Ekspedisi & Titipan Kairo:</strong>
              <p className="mt-0.5">{BOOKSTORE_CONTACT.deliveryNotes}</p>
            </div>
          </div>
        </div>
      </section>

      {/* 6. FOOTER */}
      <footer className="border-t border-[#d8ece1] bg-white py-8 text-center text-xs text-[#6b8b7d]">
        <div className="mx-auto max-w-[1320px] px-4">
          <div className="flex items-center justify-center gap-2 font-bold text-[#006d77]">
            <img src="/al-madroj-brand.png" alt="Logo Al Madraj" className="h-6 w-8 object-contain" />
            <span>AL MADRAJ — Maktabah & Pusat Belajar Masisir</span>
          </div>
          <p className="mt-2 text-[11px] text-[#8aa69a]">
            © {new Date().getFullYear()} Al Madraj. Seluruh hak cipta dilindungi undang-undang.
          </p>
        </div>
      </footer>
    </div>
  );
};