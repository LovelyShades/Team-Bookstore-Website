module.exports = [
"[project]/bookstore-ecommerce/app/favicon.ico.mjs { IMAGE => \"[project]/bookstore-ecommerce/app/favicon.ico (static in ecmascript, tag client)\" } [app-rsc] (structured image object, ecmascript, Next.js Server Component)", ((__turbopack_context__) => {

__turbopack_context__.n(__turbopack_context__.i("[project]/bookstore-ecommerce/app/favicon.ico.mjs { IMAGE => \"[project]/bookstore-ecommerce/app/favicon.ico (static in ecmascript, tag client)\" } [app-rsc] (structured image object, ecmascript)"));
}),
"[externals]/next/dist/shared/lib/no-fallback-error.external.js [external] (next/dist/shared/lib/no-fallback-error.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/shared/lib/no-fallback-error.external.js", () => require("next/dist/shared/lib/no-fallback-error.external.js"));

module.exports = mod;
}),
"[project]/bookstore-ecommerce/app/layout.tsx [app-rsc] (ecmascript, Next.js Server Component)", ((__turbopack_context__) => {

__turbopack_context__.n(__turbopack_context__.i("[project]/bookstore-ecommerce/app/layout.tsx [app-rsc] (ecmascript)"));
}),
"[externals]/stream [external] (stream, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("stream", () => require("stream"));

module.exports = mod;
}),
"[externals]/http [external] (http, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("http", () => require("http"));

module.exports = mod;
}),
"[externals]/url [external] (url, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("url", () => require("url"));

module.exports = mod;
}),
"[externals]/punycode [external] (punycode, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("punycode", () => require("punycode"));

module.exports = mod;
}),
"[externals]/https [external] (https, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("https", () => require("https"));

module.exports = mod;
}),
"[externals]/zlib [external] (zlib, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("zlib", () => require("zlib"));

module.exports = mod;
}),
"[project]/bookstore-ecommerce/lib/supabase/server.ts [app-rsc] (ecmascript)", ((__turbopack_context__) => {
"use strict";

// lib/supabase/server.ts
__turbopack_context__.s([
    "supabaseServer",
    ()=>supabaseServer
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$bookstore$2d$ecommerce$2f$node_modules$2f40$supabase$2f$ssr$2f$dist$2f$module$2f$index$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/bookstore-ecommerce/node_modules/@supabase/ssr/dist/module/index.js [app-rsc] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$bookstore$2d$ecommerce$2f$node_modules$2f40$supabase$2f$ssr$2f$dist$2f$module$2f$createServerClient$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/bookstore-ecommerce/node_modules/@supabase/ssr/dist/module/createServerClient.js [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$bookstore$2d$ecommerce$2f$node_modules$2f$next$2f$headers$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/bookstore-ecommerce/node_modules/next/headers.js [app-rsc] (ecmascript)");
;
;
async function supabaseServer() {
    // Next 16 returns a Promise
    const cookieStore = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$bookstore$2d$ecommerce$2f$node_modules$2f$next$2f$headers$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["cookies"])();
    return (0, __TURBOPACK__imported__module__$5b$project$5d2f$bookstore$2d$ecommerce$2f$node_modules$2f40$supabase$2f$ssr$2f$dist$2f$module$2f$createServerClient$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["createServerClient"])(("TURBOPACK compile-time value", "https://xvypuknddbeyfmxdpfdg.supabase.co"), ("TURBOPACK compile-time value", "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh2eXB1a25kZGJleWZteGRwZmRnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjExNzk2ODgsImV4cCI6MjA3Njc1NTY4OH0.wiGKdujzTJKk1RAFBP7l1phRt6dEcLO4AX0icncHksQ"), {
        cookies: {
            get (name) {
                return cookieStore.get(name)?.value;
            },
            set (name, value, options) {
                try {
                    cookieStore.set({
                        name,
                        value,
                        ...options ?? {}
                    });
                } catch  {}
            },
            remove (name, options) {
                try {
                    cookieStore.set({
                        name,
                        value: '',
                        ...options ?? {},
                        maxAge: 0
                    });
                } catch  {}
            }
        }
    });
}
}),
"[project]/bookstore-ecommerce/app/page.tsx [app-rsc] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>Page
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$bookstore$2d$ecommerce$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/bookstore-ecommerce/node_modules/next/dist/server/route-modules/app-page/vendored/rsc/react-jsx-dev-runtime.js [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$bookstore$2d$ecommerce$2f$lib$2f$supabase$2f$server$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/bookstore-ecommerce/lib/supabase/server.ts [app-rsc] (ecmascript)");
;
;
async function Page({ searchParams }) {
    // Get and parse search parameters
    const params = await searchParams;
    const q = String(params?.q ?? ''); // Search query
    const sort = String(params?.sort ?? 'created_at'); // Sort field
    const available = String(params?.available) === '1'; // In stock filter
    // Initialize Supabase client
    const supabase = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$bookstore$2d$ecommerce$2f$lib$2f$supabase$2f$server$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["supabaseServer"])();
    // Check if user is admin
    const { data: { user } } = await supabase.auth.getUser();
    const { data: profile } = user ? await supabase.from('profiles').select('role').eq('id', user.id).single() : {
        data: null
    };
    const isAdmin = profile?.role === 'admin';
    // Build the base query
    let query = supabase.from('items').select('id, name, price_cents, stock, img_url, active, created_at');
    // Add search filter if query exists
    if (q) {
        query = query.ilike('name', `%${q.trim()}%`);
    }
    // Apply visibility and stock filters
    if (!isAdmin) {
        // Regular users only see active items
        query = query.eq('active', true);
    }
    // Apply stock filter if requested
    if (available) {
        query = query.gt('stock', 0);
    }
    // Apply sorting (ascending for names, descending for others)
    query = query.order(sort, {
        ascending: sort === 'name'
    });
    // Execute query
    const { data: items, error } = await query;
    if (error) return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$bookstore$2d$ecommerce$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "p-6 text-red-600",
        children: [
            "Error: ",
            error.message
        ]
    }, void 0, true, {
        fileName: "[project]/bookstore-ecommerce/app/page.tsx",
        lineNumber: 49,
        columnNumber: 21
    }, this);
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$bookstore$2d$ecommerce$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("main", {
        className: "p-6 space-y-4",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$bookstore$2d$ecommerce$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("h1", {
                className: "text-2xl font-bold",
                children: "Catalog (example)"
            }, void 0, false, {
                fileName: "[project]/bookstore-ecommerce/app/page.tsx",
                lineNumber: 53,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$bookstore$2d$ecommerce$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("form", {
                className: "flex flex-wrap gap-2",
                "aria-label": "catalog filters",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$bookstore$2d$ecommerce$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                        htmlFor: "q",
                        className: "sr-only",
                        children: "Search"
                    }, void 0, false, {
                        fileName: "[project]/bookstore-ecommerce/app/page.tsx",
                        lineNumber: 55,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$bookstore$2d$ecommerce$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                        id: "q",
                        name: "q",
                        placeholder: "Search by name…",
                        defaultValue: q,
                        className: "border rounded px-3 py-2"
                    }, void 0, false, {
                        fileName: "[project]/bookstore-ecommerce/app/page.tsx",
                        lineNumber: 56,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$bookstore$2d$ecommerce$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                        htmlFor: "sort",
                        className: "flex items-center",
                        children: [
                            "Sort:",
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$bookstore$2d$ecommerce$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("select", {
                                id: "sort",
                                name: "sort",
                                defaultValue: sort,
                                className: "ml-2 border rounded px-3 py-2",
                                "aria-label": "Sort items",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$bookstore$2d$ecommerce$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                        value: "created_at",
                                        children: "Newest"
                                    }, void 0, false, {
                                        fileName: "[project]/bookstore-ecommerce/app/page.tsx",
                                        lineNumber: 59,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$bookstore$2d$ecommerce$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                        value: "name",
                                        children: "Name"
                                    }, void 0, false, {
                                        fileName: "[project]/bookstore-ecommerce/app/page.tsx",
                                        lineNumber: 60,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$bookstore$2d$ecommerce$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                        value: "price_cents",
                                        children: "Price"
                                    }, void 0, false, {
                                        fileName: "[project]/bookstore-ecommerce/app/page.tsx",
                                        lineNumber: 61,
                                        columnNumber: 13
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/bookstore-ecommerce/app/page.tsx",
                                lineNumber: 58,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/bookstore-ecommerce/app/page.tsx",
                        lineNumber: 57,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$bookstore$2d$ecommerce$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                        className: "flex items-center gap-2",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$bookstore$2d$ecommerce$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                type: "checkbox",
                                name: "available",
                                value: "1",
                                defaultChecked: available
                            }, void 0, false, {
                                fileName: "[project]/bookstore-ecommerce/app/page.tsx",
                                lineNumber: 65,
                                columnNumber: 11
                            }, this),
                            " In stock only"
                        ]
                    }, void 0, true, {
                        fileName: "[project]/bookstore-ecommerce/app/page.tsx",
                        lineNumber: 64,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$bookstore$2d$ecommerce$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                        className: "border rounded px-3 py-2",
                        children: "Apply"
                    }, void 0, false, {
                        fileName: "[project]/bookstore-ecommerce/app/page.tsx",
                        lineNumber: 67,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/bookstore-ecommerce/app/page.tsx",
                lineNumber: 54,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$bookstore$2d$ecommerce$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("section", {
                className: "grid gap-4 sm:grid-cols-2 lg:grid-cols-3",
                children: items?.map((it)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$bookstore$2d$ecommerce$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("article", {
                        className: "rounded-2xl shadow p-4",
                        children: [
                            it.img_url && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$bookstore$2d$ecommerce$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("img", {
                                src: it.img_url,
                                alt: it.name,
                                className: "w-full h-40 object-cover rounded-xl"
                            }, void 0, false, {
                                fileName: "[project]/bookstore-ecommerce/app/page.tsx",
                                lineNumber: 73,
                                columnNumber: 28
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$bookstore$2d$ecommerce$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "mt-2 font-semibold",
                                children: it.name
                            }, void 0, false, {
                                fileName: "[project]/bookstore-ecommerce/app/page.tsx",
                                lineNumber: 74,
                                columnNumber: 13
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$bookstore$2d$ecommerce$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                children: [
                                    "$",
                                    (it.price_cents / 100).toFixed(2)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/bookstore-ecommerce/app/page.tsx",
                                lineNumber: 75,
                                columnNumber: 13
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$bookstore$2d$ecommerce$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "mt-2 text-sm text-gray-500",
                                children: [
                                    "ID: ",
                                    it.id
                                ]
                            }, void 0, true, {
                                fileName: "[project]/bookstore-ecommerce/app/page.tsx",
                                lineNumber: 76,
                                columnNumber: 13
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$bookstore$2d$ecommerce$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "flex gap-2 mt-3",
                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$bookstore$2d$ecommerce$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("a", {
                                    href: `/book-ex?id=${it.id}`,
                                    className: "inline-block border rounded-xl px-3 py-2 bg-blue-50 hover:bg-blue-100",
                                    children: "View Details"
                                }, void 0, false, {
                                    fileName: "[project]/bookstore-ecommerce/app/page.tsx",
                                    lineNumber: 78,
                                    columnNumber: 15
                                }, this)
                            }, void 0, false, {
                                fileName: "[project]/bookstore-ecommerce/app/page.tsx",
                                lineNumber: 77,
                                columnNumber: 13
                            }, this)
                        ]
                    }, it.id, true, {
                        fileName: "[project]/bookstore-ecommerce/app/page.tsx",
                        lineNumber: 72,
                        columnNumber: 11
                    }, this))
            }, void 0, false, {
                fileName: "[project]/bookstore-ecommerce/app/page.tsx",
                lineNumber: 70,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/bookstore-ecommerce/app/page.tsx",
        lineNumber: 52,
        columnNumber: 5
    }, this);
}
}),
"[project]/bookstore-ecommerce/app/page.tsx [app-rsc] (ecmascript, Next.js Server Component)", ((__turbopack_context__) => {

__turbopack_context__.n(__turbopack_context__.i("[project]/bookstore-ecommerce/app/page.tsx [app-rsc] (ecmascript)"));
}),
];

//# sourceMappingURL=%5Broot-of-the-server%5D__f484c6b9._.js.map