/**
 * Unify - bootstrapped plugin for Zotero 7-10
 * Scope: venue fields for publication tags only.
 */

var Unify;

function install(data, reason) {}

async function startup({ id, version, resourceURI, rootURI }, reason) {
  try {
    try {
      Zotero.Prefs.set("extensions.unify.bootstrapOK", String(Date.now()) + ":" + version);
    } catch (e) {}

    Services.scriptloader.loadSubScript(rootURI + "venue-map.js");
    Services.scriptloader.loadSubScript(rootURI + "usenix.js");
    Services.scriptloader.loadSubScript(rootURI + "normalizer.js");
    Services.scriptloader.loadSubScript(rootURI + "unify.js");
    Unify.init({ id, version, rootURI });
    await Unify.main();
  } catch (e) {
    try {
      Zotero.Prefs.set("extensions.unify.bootstrapError", String(e));
      Zotero.debug("Unify bootstrap FATAL: " + e + "\n" + (e && e.stack));
    } catch (e2) {}
    throw e;
  }
}

function onMainWindowLoad({ window }, reason) {
  if (typeof Unify !== "undefined" && Unify && Unify.onMainWindowLoad) {
    Unify.onMainWindowLoad(window);
  }
}

function onMainWindowUnload({ window }, reason) {}

async function shutdown({ id, version, resourceURI, rootURI }, reason) {
  if (typeof APP_SHUTDOWN !== "undefined" && reason === APP_SHUTDOWN) {
    return;
  }
  if (typeof Unify !== "undefined" && Unify) {
    Unify.shutdown();
  }
  Unify = undefined;
}

function uninstall(data, reason) {}
