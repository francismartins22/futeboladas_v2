/* Confirmacao com o visual da app em vez do window.confirm/prompt do browser.
   Uso: if (await confirmDialog({ title, message, confirmLabel, danger, requireText })) { ... }
   O <ConfirmDialogHost /> (montado uma vez no App) mostra o dialogo; sem ele, cai no window.confirm. */
let show = null;

export const setConfirmHandler = (fn) => { show = fn; };

export const confirmDialog = (opts) =>
  new Promise((resolve) => (show ? show({ ...opts, resolve }) : resolve(window.confirm(opts.message || opts.title))));
