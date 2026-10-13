import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { FARM_ITEMS, FARM_CATEGORIES } from '../../types/farm';
import { PaletteCard } from '../palette/PaletteCard';
import { useFarm } from '../../hooks/useFarm';
import { 
  Layers, 
  Search, 
  X, 
  MousePointerClick, 
  Sparkles,
  ChevronDown,
  ChevronRight,
  Filter,
  PanelLeftClose,
  PanelLeftOpen
} from 'lucide-react';

export const Sidebar = () => {
  const { addItem, items, selectedItem, snapCoordinate } = useFarm();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [collapsedCategories, setCollapsedCategories] = useState({});

  // Palette Collapsed State
  const [isCollapsed, setIsCollapsed] = useState(false);

  const toggleCollapse = (collapsed) => {
    setIsCollapsed(collapsed);
  };

  // Palette Width Resizing State
  const [paletteWidth, setPaletteWidth] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('greentwin_palette_width');
      if (saved) {
        const parsed = parseInt(saved, 10);
        if (!isNaN(parsed) && parsed >= 260 && parsed <= 560) return parsed;
      }
    }
    return 340;
  });
  const [isResizingSidebar, setIsResizingSidebar] = useState(false);

  const sidebarRef = useRef(null);

  // Drag-to-resize sidebar width handlers
  const handleResizeStart = useCallback((e) => {
    e.preventDefault();
    setIsResizingSidebar(true);
  }, []);

  useEffect(() => {
    if (!isResizingSidebar) return;

    const handleMouseMove = (e) => {
      // Clamped between 260px and 540px
      const newWidth = Math.min(540, Math.max(260, e.clientX));
      setPaletteWidth(newWidth);
    };

    const handleMouseUp = () => {
      setIsResizingSidebar(false);
      if (typeof window !== 'undefined') {
        localStorage.setItem('greentwin_palette_width', String(paletteWidth));
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizingSidebar, paletteWidth]);

  const handleQuickAdd = (itemDef) => {
    // Generate position staggered based on item count
    const offset = (items.length % 5) * 40;
    const x = snapCoordinate(260 + offset);
    const y = snapCoordinate(120 + offset);

    addItem({
      id: `item-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      type: itemDef.type,
      x,
      y,
      width: itemDef.width || itemDef.defaultWidth,
      height: itemDef.height || itemDef.defaultHeight,
      minWidth: itemDef.minWidth,
      minHeight: itemDef.minHeight,
      isPointIcon: Boolean(itemDef.isPointIcon),
    });
  };

  const toggleCategoryCollapse = (cat) => {
    setCollapsedCategories((prev) => ({
      ...prev,
      [cat]: !prev[cat],
    }));
  };

  // Filtered items based on search and category tab
  const filteredItems = useMemo(() => {
    return FARM_ITEMS.filter((item) => {
      const matchesSearch = 
        !searchQuery.trim() ||
        item.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.description.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesCategory = 
        selectedCategory === 'All' || item.category === selectedCategory;

      return matchesSearch && matchesCategory;
    });
  }, [searchQuery, selectedCategory]);

  // Group items by category
  const categoriesToDisplay = useMemo(() => {
    const cats = selectedCategory === 'All' 
      ? ['Terrain', 'Crops', 'Trees', 'Structures', 'Irrigation']
      : [selectedCategory];

    return cats.map((cat) => ({
      name: cat,
      items: filteredItems.filter((i) => i.category === cat),
    })).filter((group) => group.items.length > 0);
  }, [filteredItems, selectedCategory]);

  if (isCollapsed) {
    return (
      <aside 
        className="w-13 h-full flex flex-col items-center py-4 bg-stone-950/80 backdrop-blur-md border-r border-amber-950/70 z-20 select-none shadow-2xl shrink-0 transition-all duration-200"
      >
        {/* Expand button at top */}
        <button
          type="button"
          onClick={() => toggleCollapse(false)}
          title="Expand Farm Palette"
          aria-label="Expand Farm Palette"
          className="w-9 h-9 rounded-xl bg-amber-900/60 border border-amber-600/70 flex items-center justify-center text-amber-300 hover:text-amber-100 hover:bg-amber-800/80 transition-all shadow-md group active:scale-95"
        >
          <PanelLeftOpen className="w-4 h-4 group-hover:scale-110 transition-transform" />
        </button>

        {/* Vertical Strip Click to Expand */}
        <button
          type="button"
          onClick={() => toggleCollapse(false)}
          title="Click to expand Farm Palette"
          aria-label="Click to expand Farm Palette"
          className="flex-1 w-full flex flex-col items-center justify-center py-6 space-y-4 hover:bg-white/[0.02] transition-colors cursor-pointer group"
        >
          <span className="[writing-mode:vertical-rl] rotate-180 text-[11px] font-mono font-bold tracking-widest text-amber-200/80 group-hover:text-amber-300 uppercase select-none">
            Farm Palette
          </span>
          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-amber-950 text-amber-400 border border-amber-800/60 shadow-sm">
            {filteredItems.length}
          </span>
        </button>

        {/* Bottom Expand Arrow */}
        <button
          type="button"
          onClick={() => toggleCollapse(false)}
          title="Expand Farm Palette"
          aria-label="Expand Farm Palette"
          className="p-2 text-stone-500 hover:text-amber-300 transition-colors"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </aside>
    );
  }

  return (
    <aside 
      ref={sidebarRef}
      style={{ width: `${paletteWidth}px` }}
      className="h-full flex flex-col bg-stone-950/70 backdrop-blur-md border-r border-amber-950/70 z-20 select-none shadow-2xl relative transition-[width] duration-75 shrink-0"
    >
      {/* Draggable right border handle for resizing Farm Palette width */}
      <div
        role="separator"
        aria-label="Resize Farm Palette"
        aria-orientation="vertical"
        tabIndex={0}
        onMouseDown={handleResizeStart}
        onDoubleClick={() => setPaletteWidth(340)}
        title="Drag to resize Farm Palette width (Double-click to reset)"
        className={`absolute top-0 right-0 w-2.5 h-full cursor-ew-resize hover:bg-amber-500/40 transition-colors z-30 group flex items-center justify-center ${
          isResizingSidebar ? 'bg-amber-500/60' : 'bg-transparent'
        }`}
      >
        <div className="w-0.5 h-8 bg-stone-700 group-hover:bg-amber-400 rounded-full transition-colors" />
      </div>

      {/* Sidebar Header */}
      <div className="p-4 border-b border-amber-950/70 bg-stone-950/70 backdrop-blur-sm space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-7 h-7 rounded-lg bg-amber-900/60 border border-amber-600/60 flex items-center justify-center text-amber-300 shadow-inner">
              <Layers className="w-4 h-4" />
            </div>
            <h2 className="text-xs font-bold tracking-wider text-amber-100 uppercase">
              Farm Palette
            </h2>
            {/* Collapse button on the side of Farm Palette text */}
            <button
              type="button"
              onClick={() => toggleCollapse(true)}
              title="Collapse Farm Palette"
              aria-label="Collapse Farm Palette"
              className="p-1 rounded-md text-stone-400 hover:text-amber-200 hover:bg-stone-850/80 transition-colors ml-0.5"
            >
              <PanelLeftClose className="w-3.5 h-3.5" />
            </button>
          </div>

          <span className="text-[10px] font-mono px-2.5 py-0.5 rounded-full bg-amber-950 text-amber-300 border border-amber-800/60 shadow-sm font-semibold">
            {filteredItems.length} Elements
          </span>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-stone-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search elements (wheat, neem, well)..."
            className="w-full pl-9 pr-8 py-2 rounded-xl bg-stone-900/90 border border-stone-800 focus:border-amber-500 text-xs text-amber-100 placeholder-stone-500 focus:outline-none focus:ring-1 focus:ring-amber-500/40 shadow-inner"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-amber-200"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Category Filter Pills */}
        <div className="flex items-center space-x-2 overflow-x-auto no-scrollbar pb-1 text-[11px]">
          {FARM_CATEGORIES.map((cat) => {
            const isActive = selectedCategory === cat;
            return (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`flex-shrink-0 px-3 py-1.5 rounded-lg font-medium transition-all ${
                  isActive
                    ? 'bg-amber-600 text-stone-950 font-bold shadow-md'
                    : 'bg-stone-900/80 text-stone-400 hover:text-stone-200 hover:bg-stone-850 border border-stone-800/70'
                }`}
              >
                {cat}
              </button>
            );
          })}
        </div>
      </div>

      {/* Item List (Grouped or Filtered) */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {categoriesToDisplay.length === 0 ? (
          <div className="p-8 text-center text-xs text-stone-500 space-y-1.5">
            <Filter className="w-6 h-6 mx-auto text-stone-600 mb-2" />
            <p className="font-semibold text-stone-400">No elements found</p>
            <p className="text-[10px]">Try clearing search or switching category filter.</p>
          </div>
        ) : (
          categoriesToDisplay.map((catGroup) => {
            const isCategoryCollapsed = Boolean(collapsedCategories[catGroup.name]);
            return (
              <div key={catGroup.name} className="space-y-2">
                {/* Category Header Accordion */}
                <button
                  type="button"
                  onClick={() => toggleCategoryCollapse(catGroup.name)}
                  className="w-full flex items-center justify-between py-1 px-1.5 text-left rounded-lg hover:bg-stone-900/60 transition-colors"
                >
                  <div className="flex items-center space-x-2">
                    {isCategoryCollapsed ? (
                      <ChevronRight className="w-3.5 h-3.5 text-stone-500" />
                    ) : (
                      <ChevronDown className="w-3.5 h-3.5 text-amber-400" />
                    )}
                    <span className="text-[11px] font-mono font-bold tracking-wider text-amber-200 uppercase">
                      {catGroup.name}
                    </span>
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-stone-900 text-stone-400 border border-stone-800">
                    {catGroup.items.length}
                  </span>
                </button>

                {/* Cards in this Category */}
                {!isCategoryCollapsed && (
                  <div className="space-y-2 pl-0.5">
                    {catGroup.items.map((item) => (
                      <PaletteCard
                        key={item.type}
                        itemDef={item}
                        onQuickAdd={handleQuickAdd}
                      />
                    ))}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Helpful Instructions Footer */}
      <div className="p-3 border-t border-amber-950/80 bg-stone-900/40 text-[11px] text-stone-400 space-y-1.5">
        <div className="flex items-start space-x-2">
          <MousePointerClick className="w-3.5 h-3.5 text-amber-400 mt-0.5 shrink-0" />
          <span>Click any placed plot to move, select, or manage.</span>
        </div>
        <div className="flex items-start space-x-2">
          <Sparkles className="w-3.5 h-3.5 text-emerald-400 mt-0.5 shrink-0" />
          <span>Point icons (Trees, Wells) have fixed 2m×2m footprint.</span>
        </div>

        {selectedItem && (
          <div className="mt-2 pt-2 border-t border-stone-800 flex items-center justify-between text-amber-300 font-mono text-[10px]">
            <span>Selected: {selectedItem.type}</span>
            <span>{selectedItem.x}m, {selectedItem.y}m</span>
          </div>
        )}
      </div>
    </aside>
  );
};
