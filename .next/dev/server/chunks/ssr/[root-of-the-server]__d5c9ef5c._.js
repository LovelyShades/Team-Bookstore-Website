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
"[project]/bookstore-ecommerce/lib/supabase/client.ts [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

// lib/supabase/client.ts
__turbopack_context__.s([
    "supabaseClient",
    ()=>supabaseClient
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$bookstore$2d$ecommerce$2f$node_modules$2f40$supabase$2f$ssr$2f$dist$2f$module$2f$index$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/bookstore-ecommerce/node_modules/@supabase/ssr/dist/module/index.js [app-ssr] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$bookstore$2d$ecommerce$2f$node_modules$2f40$supabase$2f$ssr$2f$dist$2f$module$2f$createBrowserClient$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/bookstore-ecommerce/node_modules/@supabase/ssr/dist/module/createBrowserClient.js [app-ssr] (ecmascript)");
;
const supabaseClient = (0, __TURBOPACK__imported__module__$5b$project$5d2f$bookstore$2d$ecommerce$2f$node_modules$2f40$supabase$2f$ssr$2f$dist$2f$module$2f$createBrowserClient$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["createBrowserClient"])(("TURBOPACK compile-time value", "https://xvypuknddbeyfmxdpfdg.supabase.co"), ("TURBOPACK compile-time value", "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh2eXB1a25kZGJleWZteGRwZmRnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjExNzk2ODgsImV4cCI6MjA3Njc1NTY4OH0.wiGKdujzTJKk1RAFBP7l1phRt6dEcLO4AX0icncHksQ"));
}),
"[project]/bookstore-ecommerce/components/AuthForm.tsx [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>AuthForm
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$bookstore$2d$ecommerce$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/bookstore-ecommerce/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react-jsx-dev-runtime.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$bookstore$2d$ecommerce$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/bookstore-ecommerce/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$bookstore$2d$ecommerce$2f$lib$2f$supabase$2f$client$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/bookstore-ecommerce/lib/supabase/client.ts [app-ssr] (ecmascript)");
'use client';
;
;
;
function AuthForm() {
    const [email, setEmail] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$bookstore$2d$ecommerce$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])('');
    const [pw, setPw] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$bookstore$2d$ecommerce$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])('');
    const [mode, setMode] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$bookstore$2d$ecommerce$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])('signin');
    const [msg, setMsg] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$bookstore$2d$ecommerce$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(null);
    /**
   * Handle form submission for sign in/up
   */ async function onSubmit(e) {
        e.preventDefault();
        setMsg(null);
        try {
            // Attempt authentication
            const result = await __TURBOPACK__imported__module__$5b$project$5d2f$bookstore$2d$ecommerce$2f$lib$2f$supabase$2f$client$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["supabaseClient"].auth[mode === 'signin' ? 'signInWithPassword' : 'signUp']({
                email,
                password: pw
            });
            if (result.error) throw result.error;
            // Refresh session to set httpOnly cookies
            const { error: refreshErr } = await __TURBOPACK__imported__module__$5b$project$5d2f$bookstore$2d$ecommerce$2f$lib$2f$supabase$2f$client$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["supabaseClient"].auth.refreshSession();
            if (refreshErr) throw refreshErr;
            // Reload page to sync auth state
            window.location.reload();
        } catch (err) {
            console.error('[Auth Error]', err);
            setMsg(err.message ?? 'Auth error');
        }
    }
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$bookstore$2d$ecommerce$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("form", {
        onSubmit: onSubmit,
        className: "space-y-3 max-w-sm",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$bookstore$2d$ecommerce$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("h2", {
                className: "text-xl font-bold",
                children: mode === 'signin' ? 'Sign In' : 'Sign Up'
            }, void 0, false, {
                fileName: "[project]/bookstore-ecommerce/components/AuthForm.tsx",
                lineNumber: 42,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$bookstore$2d$ecommerce$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                className: "w-full border rounded px-3 py-2",
                placeholder: "email",
                value: email,
                onChange: (e)=>setEmail(e.target.value)
            }, void 0, false, {
                fileName: "[project]/bookstore-ecommerce/components/AuthForm.tsx",
                lineNumber: 43,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$bookstore$2d$ecommerce$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                className: "w-full border rounded px-3 py-2",
                placeholder: "password",
                type: "password",
                value: pw,
                onChange: (e)=>setPw(e.target.value)
            }, void 0, false, {
                fileName: "[project]/bookstore-ecommerce/components/AuthForm.tsx",
                lineNumber: 44,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$bookstore$2d$ecommerce$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                className: "border rounded px-3 py-2",
                children: mode === 'signin' ? 'Sign In' : 'Create Account'
            }, void 0, false, {
                fileName: "[project]/bookstore-ecommerce/components/AuthForm.tsx",
                lineNumber: 45,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$bookstore$2d$ecommerce$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                type: "button",
                className: "text-sm underline ml-3",
                onClick: ()=>setMode(mode === 'signin' ? 'signup' : 'signin'),
                children: mode === 'signin' ? 'Need an account?' : 'Have an account? Sign in'
            }, void 0, false, {
                fileName: "[project]/bookstore-ecommerce/components/AuthForm.tsx",
                lineNumber: 46,
                columnNumber: 7
            }, this),
            msg && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$bookstore$2d$ecommerce$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "text-red-600",
                children: msg
            }, void 0, false, {
                fileName: "[project]/bookstore-ecommerce/components/AuthForm.tsx",
                lineNumber: 49,
                columnNumber: 15
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/bookstore-ecommerce/components/AuthForm.tsx",
        lineNumber: 41,
        columnNumber: 5
    }, this);
}
}),
"[project]/bookstore-ecommerce/app/actions/data:7f645b [app-ssr] (ecmascript) <text/javascript>", ((__turbopack_context__) => {
"use strict";

/* __next_internal_action_entry_do_not_use__ [{"00ca1040413dedac391424b9c4a9b2ecb0ae947efd":"logoutAction"},"bookstore-ecommerce/app/actions/logout.ts",""] */ __turbopack_context__.s([
    "logoutAction",
    ()=>logoutAction
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$bookstore$2d$ecommerce$2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$action$2d$client$2d$wrapper$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/bookstore-ecommerce/node_modules/next/dist/build/webpack/loaders/next-flight-loader/action-client-wrapper.js [app-ssr] (ecmascript)");
"use turbopack no side effects";
;
var logoutAction = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$bookstore$2d$ecommerce$2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$action$2d$client$2d$wrapper$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["createServerReference"])("00ca1040413dedac391424b9c4a9b2ecb0ae947efd", __TURBOPACK__imported__module__$5b$project$5d2f$bookstore$2d$ecommerce$2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$action$2d$client$2d$wrapper$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["callServer"], void 0, __TURBOPACK__imported__module__$5b$project$5d2f$bookstore$2d$ecommerce$2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$action$2d$client$2d$wrapper$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["findSourceMapURL"], "logoutAction"); //# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4vbG9nb3V0LnRzIl0sInNvdXJjZXNDb250ZW50IjpbIid1c2Ugc2VydmVyJztcclxuXHJcbmltcG9ydCB7IHN1cGFiYXNlU2VydmVyIH0gZnJvbSAnQC9saWIvc3VwYWJhc2Uvc2VydmVyJztcclxuaW1wb3J0IHsgcmVkaXJlY3QgfSBmcm9tICduZXh0L25hdmlnYXRpb24nO1xyXG5cclxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGxvZ291dEFjdGlvbigpIHtcclxuICBjb25zdCBzID0gYXdhaXQgc3VwYWJhc2VTZXJ2ZXIoKTtcclxuICBhd2FpdCBzLmF1dGguc2lnbk91dCgpO1xyXG5cclxuICAvLyBSZWRpcmVjdCBhZnRlciBzaWduLW91dFxyXG4gIHJlZGlyZWN0KCcvYXV0aC1leCcpO1xyXG59XHJcbiJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiK1NBS3NCIn0=
}),
"[project]/bookstore-ecommerce/components/LogoutButton.tsx [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>LogoutButton
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$bookstore$2d$ecommerce$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/bookstore-ecommerce/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react-jsx-dev-runtime.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$bookstore$2d$ecommerce$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/bookstore-ecommerce/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$bookstore$2d$ecommerce$2f$app$2f$actions$2f$data$3a$7f645b__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$text$2f$javascript$3e$__ = __turbopack_context__.i("[project]/bookstore-ecommerce/app/actions/data:7f645b [app-ssr] (ecmascript) <text/javascript>");
'use client';
;
;
;
function LogoutButton() {
    const [pending, startTransition] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$bookstore$2d$ecommerce$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useTransition"])();
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$bookstore$2d$ecommerce$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
        onClick: ()=>startTransition(()=>(0, __TURBOPACK__imported__module__$5b$project$5d2f$bookstore$2d$ecommerce$2f$app$2f$actions$2f$data$3a$7f645b__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$text$2f$javascript$3e$__["logoutAction"])()),
        disabled: pending,
        className: "mt-4 px-4 py-2 rounded-xl border border-red-500 text-red-600 hover:bg-red-50",
        children: pending ? 'Logging out…' : 'Log Out'
    }, void 0, false, {
        fileName: "[project]/bookstore-ecommerce/components/LogoutButton.tsx",
        lineNumber: 10,
        columnNumber: 5
    }, this);
}
}),
];

//# sourceMappingURL=%5Broot-of-the-server%5D__d5c9ef5c._.js.map