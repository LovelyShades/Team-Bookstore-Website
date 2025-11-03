module.exports = [
"[turbopack-node]/transforms/postcss.ts { CONFIG => \"[project]/bookstore-ecommerce/postcss.config.mjs [postcss] (ecmascript)\" } [postcss] (ecmascript, async loader)", ((__turbopack_context__) => {

__turbopack_context__.v((parentImport) => {
    return Promise.all([
  "chunks/63158_fba36e88._.js",
  "chunks/[root-of-the-server]__1c35d38f._.js"
].map((chunk) => __turbopack_context__.l(chunk))).then(() => {
        return parentImport("[turbopack-node]/transforms/postcss.ts { CONFIG => \"[project]/bookstore-ecommerce/postcss.config.mjs [postcss] (ecmascript)\" } [postcss] (ecmascript)");
    });
});
}),
];