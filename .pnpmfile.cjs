/**
 * pnpm hooks — strip build scripts from packages we don't need them for.
 * msw is pulled in by the shadcn CLI; its postinstall (service worker init)
 * is irrelevant for server-side Next.js builds.
 */
module.exports = {
  hooks: {
    readPackage(pkg) {
      if (pkg.name === "msw") {
        delete pkg.scripts;
      }
      return pkg;
    },
  },
};
