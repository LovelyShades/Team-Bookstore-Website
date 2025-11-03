module.exports = [
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
"[project]/bookstore-ecommerce/app/actions/logout.ts [app-rsc] (ecmascript)", ((__turbopack_context__) => {
"use strict";

/* __next_internal_action_entry_do_not_use__ [{"00ca1040413dedac391424b9c4a9b2ecb0ae947efd":"logoutAction"},"",""] */ __turbopack_context__.s([
    "logoutAction",
    ()=>logoutAction
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$bookstore$2d$ecommerce$2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$server$2d$reference$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/bookstore-ecommerce/node_modules/next/dist/build/webpack/loaders/next-flight-loader/server-reference.js [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$bookstore$2d$ecommerce$2f$lib$2f$supabase$2f$server$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/bookstore-ecommerce/lib/supabase/server.ts [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$bookstore$2d$ecommerce$2f$node_modules$2f$next$2f$dist$2f$api$2f$navigation$2e$react$2d$server$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/bookstore-ecommerce/node_modules/next/dist/api/navigation.react-server.js [app-rsc] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$bookstore$2d$ecommerce$2f$node_modules$2f$next$2f$dist$2f$client$2f$components$2f$navigation$2e$react$2d$server$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/bookstore-ecommerce/node_modules/next/dist/client/components/navigation.react-server.js [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$bookstore$2d$ecommerce$2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$action$2d$validate$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/bookstore-ecommerce/node_modules/next/dist/build/webpack/loaders/next-flight-loader/action-validate.js [app-rsc] (ecmascript)");
;
;
;
async function logoutAction() {
    const s = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$bookstore$2d$ecommerce$2f$lib$2f$supabase$2f$server$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["supabaseServer"])();
    await s.auth.signOut();
    // Redirect after sign-out
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$bookstore$2d$ecommerce$2f$node_modules$2f$next$2f$dist$2f$client$2f$components$2f$navigation$2e$react$2d$server$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["redirect"])('/auth-ex');
}
;
(0, __TURBOPACK__imported__module__$5b$project$5d2f$bookstore$2d$ecommerce$2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$action$2d$validate$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["ensureServerEntryExports"])([
    logoutAction
]);
(0, __TURBOPACK__imported__module__$5b$project$5d2f$bookstore$2d$ecommerce$2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$server$2d$reference$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["registerServerReference"])(logoutAction, "00ca1040413dedac391424b9c4a9b2ecb0ae947efd", null);
}),
"[project]/bookstore-ecommerce/.next-internal/server/app/auth-ex/page/actions.js { ACTIONS_MODULE0 => \"[project]/bookstore-ecommerce/app/actions/logout.ts [app-rsc] (ecmascript)\" } [app-rsc] (server actions loader, ecmascript) <locals>", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([]);
var __TURBOPACK__imported__module__$5b$project$5d2f$bookstore$2d$ecommerce$2f$app$2f$actions$2f$logout$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/bookstore-ecommerce/app/actions/logout.ts [app-rsc] (ecmascript)");
;
}),
"[project]/bookstore-ecommerce/.next-internal/server/app/auth-ex/page/actions.js { ACTIONS_MODULE0 => \"[project]/bookstore-ecommerce/app/actions/logout.ts [app-rsc] (ecmascript)\" } [app-rsc] (server actions loader, ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "00ca1040413dedac391424b9c4a9b2ecb0ae947efd",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$bookstore$2d$ecommerce$2f$app$2f$actions$2f$logout$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["logoutAction"]
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$bookstore$2d$ecommerce$2f2e$next$2d$internal$2f$server$2f$app$2f$auth$2d$ex$2f$page$2f$actions$2e$js__$7b$__ACTIONS_MODULE0__$3d3e$__$225b$project$5d2f$bookstore$2d$ecommerce$2f$app$2f$actions$2f$logout$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$2922$__$7d$__$5b$app$2d$rsc$5d$__$28$server__actions__loader$2c$__ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i('[project]/bookstore-ecommerce/.next-internal/server/app/auth-ex/page/actions.js { ACTIONS_MODULE0 => "[project]/bookstore-ecommerce/app/actions/logout.ts [app-rsc] (ecmascript)" } [app-rsc] (server actions loader, ecmascript) <locals>');
var __TURBOPACK__imported__module__$5b$project$5d2f$bookstore$2d$ecommerce$2f$app$2f$actions$2f$logout$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/bookstore-ecommerce/app/actions/logout.ts [app-rsc] (ecmascript)");
}),
];

//# sourceMappingURL=%5Broot-of-the-server%5D__ced957b9._.js.map