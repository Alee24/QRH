const fs = require('fs');
const path = require('path');

function replaceInFile(filePath, replacements) {
  const fullPath = path.resolve(filePath);
  if (!fs.existsSync(fullPath)) {
    console.error(`File not found: ${filePath}`);
    return false;
  }
  let content = fs.readFileSync(fullPath, 'utf8');
  let modified = false;

  for (const { search, replace } of replacements) {
    if (typeof search === 'string') {
      if (content.includes(search)) {
        content = content.replace(search, replace);
        modified = true;
      } else {
        console.warn(`[WARN] Search string not found in ${path.basename(filePath)}:\n${search.slice(0, 80)}...`);
      }
    } else if (search instanceof RegExp) {
      if (search.test(content)) {
        content = content.replace(search, replace);
        modified = true;
      } else {
        console.warn(`[WARN] RegExp not found in ${path.basename(filePath)}: ${search}`);
      }
    }
  }

  if (modified) {
    fs.writeFileSync(fullPath, content, 'utf8');
    console.log(`✓ Updated: ${filePath}`);
  } else {
    console.log(`- No changes needed in: ${filePath}`);
  }
  return modified;
}

// 1. App.tsx: Add min-w-0 to flex child & main
replaceInFile('client/src/App.tsx', [
  {
    search: 'className={`flex-1 flex flex-col transition-all duration-300 ease-in-out ${',
    replace: 'className={`flex-1 min-w-0 flex flex-col transition-all duration-300 ease-in-out ${'
  },
  {
    search: '<main className="flex-1 w-full overflow-x-hidden">',
    replace: '<main className="flex-1 min-w-0 w-full overflow-x-hidden">'
  }
]);

// 2. Modal.tsx: Responsive padding, title wrapping, max width protection
replaceInFile('client/src/components/Modal.tsx', [
  {
    search: 'className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn"',
    replace: 'className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm animate-fadeIn overflow-y-auto"'
  },
  {
    search: "className={`relative w-full ${widthMap[maxWidth]} bg-white dark:bg-stone-900 rounded-2xl shadow-2xl border border-stone-200 dark:border-stone-800 overflow-hidden flex flex-col max-h-[90vh]`}",
    replace: "className={`relative w-full ${widthMap[maxWidth]} max-w-[calc(100vw-1.5rem)] bg-white dark:bg-stone-900 rounded-2xl shadow-2xl border border-stone-200 dark:border-stone-800 overflow-hidden flex flex-col max-h-[90vh]`}"
  },
  {
    search: '<h3 className="text-lg font-bold text-stone-900 dark:text-stone-100">{title}</h3>',
    replace: '<h3 className="text-base sm:text-lg font-bold text-stone-900 dark:text-stone-100 break-words pr-2">{title}</h3>'
  },
  {
    search: '<div className="p-6 overflow-y-auto">{children}</div>',
    replace: '<div className="p-4 sm:p-6 overflow-y-auto min-w-0">{children}</div>'
  }
]);

// 3. Header.tsx: Safe wrapping & overflow controls
replaceInFile('client/src/components/Header.tsx', [
  {
    search: '<header className="sticky top-0 z-30 bg-white/95 dark:bg-stone-900/95 backdrop-blur border-b border-stone-200/80 dark:border-stone-800/80 px-3 sm:px-5 h-15 flex items-center justify-between transition-colors shadow-xs">',
    replace: '<header className="sticky top-0 z-30 bg-white/95 dark:bg-stone-900/95 backdrop-blur border-b border-stone-200/80 dark:border-stone-800/80 px-3 sm:px-5 min-h-[56px] py-1.5 flex items-center justify-between transition-colors shadow-xs gap-2 min-w-0">'
  },
  {
    search: 'max-w-[140px] sm:max-w-none',
    replace: 'max-w-[120px] sm:max-w-xs md:max-w-sm lg:max-w-none'
  }
]);

// 4. CashierPOS.tsx: KPI cards & Floor tables
replaceInFile('client/src/pages/cashier/CashierPOS.tsx', [
  {
    search: '<div className="grid grid-cols-2 sm:grid-cols-4 gap-4">',
    replace: '<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">'
  },
  {
    search: 'className={`p-3.5 rounded-2xl border-2 cursor-pointer transition-all flex flex-col justify-between h-32 ${',
    replace: 'className={`p-3.5 rounded-2xl border-2 cursor-pointer transition-all flex flex-col justify-between min-h-[125px] ${'
  },
  {
    search: '<div className="grid grid-cols-2 sm:grid-cols-4 gap-3">',
    replace: '<div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">'
  },
  {
    search: '<div className="grid grid-cols-4 gap-2">',
    replace: '<div className="grid grid-cols-2 sm:grid-cols-4 gap-2">'
  }
]);

// 5. KitchenDisplay.tsx: KDS top bar wrapping
replaceInFile('client/src/pages/kds/KitchenDisplay.tsx', [
  {
    search: '<div className="h-16 px-6 bg-stone-950 border-b border-stone-800 flex items-center justify-between">',
    replace: '<div className="min-h-[56px] py-2 px-3 sm:px-6 bg-stone-950 border-b border-stone-800 flex flex-wrap items-center justify-between gap-3">'
  },
  {
    search: '<div className="flex-1 p-6 grid grid-cols-1 md:grid-cols-3 gap-6 overflow-x-auto">',
    replace: '<div className="flex-1 p-3 sm:p-6 grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 overflow-x-auto min-w-0">'
  }
]);

// 6. ReportsDashboard.tsx: KPI cards & M-Pesa header
replaceInFile('client/src/pages/reports/ReportsDashboard.tsx', [
  {
    search: '<div className="grid grid-cols-2 lg:grid-cols-4 gap-4">',
    replace: '<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">'
  },
  {
    search: '<div className="p-5 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-sm space-y-4">\n            <div className="flex items-center justify-between">',
    replace: '<div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-sm space-y-4">\n            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">'
  }
]);

// 7. DeliveryManager.tsx: KPI cards
replaceInFile('client/src/pages/delivery/DeliveryManager.tsx', [
  {
    search: '<div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">',
    replace: '<div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 xl:grid-cols-6 gap-2.5">'
  }
]);

// 8. HotelRooms.tsx: Fix fixed h-44
replaceInFile('client/src/pages/hotel/HotelRooms.tsx', [
  {
    search: 'className="p-5 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-sm flex flex-col justify-between h-44"',
    replace: 'className="p-5 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-sm flex flex-col justify-between min-h-[170px]"'
  }
]);

// 9. InventoryManager.tsx: Wrap tables in overflow-x-auto & tabs in overflow-x-auto
replaceInFile('client/src/pages/inventory/InventoryManager.tsx', [
  {
    search: '<div className="flex items-center gap-2 border-b border-stone-200 dark:border-stone-800 pb-2 text-xs font-bold">',
    replace: '<div className="flex items-center gap-2 border-b border-stone-200 dark:border-stone-800 pb-2 text-xs font-bold overflow-x-auto">'
  },
  {
    search: '<div className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800 overflow-hidden shadow-sm">\n            <table className="w-full text-left text-xs">',
    replace: '<div className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800 overflow-hidden shadow-sm">\n            <div className="overflow-x-auto">\n            <table className="w-full text-left text-xs">'
  },
  {
    search: '</table>\n          </div>',
    replace: '</table>\n            </div>\n          </div>'
  }
]);

// 10. UserManager.tsx: Wrap table in overflow-x-auto
replaceInFile('client/src/pages/users/UserManager.tsx', [
  {
    search: '<div className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800 overflow-hidden shadow-sm">\n          <table className="w-full text-left text-xs">',
    replace: '<div className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800 overflow-hidden shadow-sm">\n          <div className="overflow-x-auto">\n          <table className="w-full text-left text-xs">'
  },
  {
    search: '</table>\n        </div>',
    replace: '</table>\n          </div>\n        </div>'
  }
]);

// 11. CateringManager.tsx: KPI cards
replaceInFile('client/src/pages/catering/CateringManager.tsx', [
  {
    search: '<div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">',
    replace: '<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">'
  }
]);

console.log('All responsive layout replacements completed.');
