import React, { useState, useMemo } from 'react';
import { FARM_ITEMS, FARM_CATEGORIES, pxToMeters } from '../../types/farm';
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
  Filter
} from 'lucide-react';

export const Sidebar = () => {
  const { addItem, items, selectedItem, snapCoordinate } = useFarm();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [collapsedCategories, setCollapsedCategories] = useState({});

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
      width: itemDef.defaultWidth,
      height: itemDef.defaultHeight,
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

  return (
    <aside className="w-84 md:w-92 h-full flex flex-col bg-stone-950/55 backdrop-blur-md border-r border-amber-950/70 z-20 select-none shadow-2xl">
      {/* Sidebar Header */}
      <div className="p-4 border-b border-amber-950/70 bg-stone-950/70 backdrop-blur-sm space-y-3.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-7 h-7 rounded-lg bg-amber-900/60 border border-amber-600/60 flex items-center justify-center text-amber-300 shadow-inner">
              <Layers className="w-4 h-4" />
            </div>
            <h2 className="text-xs font-bold tracking-wider text-amber-100 uppercase">
              Farm Palette
            </h2>
          </div>
          <span className="text-[10px] font-mono px-2.5 py-0.5 rounded-full bg-amber-950 text-amber-300 border border-amber-800/60 shadow-sm">
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

        {/* Category Filter Pills (Terrain, Crops, Trees, Structures, Irrigation) */}
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
      <div className="flex-1 overflow-y-auto p-4 space-y-5">
        {categoriesToDisplay.length === 0 ? (
          <div className="p-8 text-center text-xs text-stone-500 space-y-1.5">
            <Filter className="w-6 h-6 mx-auto text-stone-600 mb-2" />
            <p className="font-semibold text-stone-400">No elements found</p>
            <p className="text-[10px]">Try clearing search or switching category filter.</p>
          </div>
        ) : (
          categoriesToDisplay.map((catGroup) => {
            const isCollapsed = Boolean(collapsedCategories[catGroup.name]);
            return (
              <div key={catGroup.name} className="space-y-2.5">
                {/* Category Header Accordion */}
                <button
                  type="button"
                  onClick={() => toggleCategoryCollapse(catGroup.name)}
                  className="w-full flex items-center justify-between py-1.5 px-2 text-left rounded-lg hover:bg-stone-900/60 transition-colors"
                >
                  <div className="flex items-center space-x-2">
                    {isCollapsed ? (
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
                {!isCollapsed && (
                  <div className="space-y-2.5 pl-1">
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
          <MousePointerClick className="w-3.5 h-3.5 text-amber-400 mt-0.5 flex-shrink-0" />
          <span>Click any placed plot to move, select, or manage.</span>
        </div>
        <div className="flex items-start space-x-2">
          <Sparkles className="w-3.5 h-3.5 text-emerald-400 mt-0.5 flex-shrink-0" />
          <span>Click placed plots to open the Object Inspector.</span>
        </div>

        {selectedItem && (
          <div className="mt-2 pt-2 border-t border-stone-800 flex items-center justify-between font-mono text-[10px] text-amber-300">
            <span className="truncate">Selected Plot</span>
            <span className="font-bold text-emerald-300 capitalize">{selectedItem.type}</span>
          </div>
        )}
      </div>
    </aside>
  );
};
