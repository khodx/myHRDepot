// mhd_module_attention_counts() returns one row per module that has a real
// "needs attention" queue for the signed-in user: the route the module lives at
// (its stable identity in the nav, the same string a NavLink targets) and the
// count of open, human-actionable items. A route with no row — or a zero —
// shows no badge. Keyed by route so adding a module's alert never needs a new
// frontend field.
export type MhdModuleAlertCounts = Readonly<Record<string, number>>;
