/**
 * Copy for the cart page, the checkout flow, and the RecommendedCombo card.
 *
 * Pure data (no imports) so the i18n translator's "*" mode sources every
 * string — see scripts/translate-content.mjs. Same pattern as scanner.ts /
 * pages.ts. Interactive components render these via the client <T> wrapper
 * (static text) and tc() (aria / dynamic).
 */

export const COMBO = {
  eyebrow: "Recommended combo",
  title: "A starter routine for you",
  body: "A simple set our experts often build from. Each one is customised for you — your expert confirms the final routine after your Skin Check.",
  addCombo: "Add the combo to cart",
  inCart: "Combo in cart",
} as const;

export const CART_PAGE = {
  title: "Your cart",
  empty: "Your cart is empty.",
  emptyBody: "Add a formulation or a recommended combo and it will show up here.",
  browse: "Browse formulations",
  itemLabel: "item",
  itemsLabel: "items",
  quantity: "Quantity",
  increase: "Increase quantity",
  decrease: "Decrease quantity",
  remove: "Remove",
  clear: "Clear cart",
  subtotal: "Subtotal",
  subtotalNote: "Priced items only. Compounded formulations are confirmed on WhatsApp.",
  someOnWhatsapp: "Some items are priced when our team confirms your order on WhatsApp.",
  proceed: "Proceed to checkout",
  keepShopping: "Keep shopping",
  priceOnConfirmation: "price on confirmation",
} as const;

export const CHECKOUT = {
  title: "Checkout",
  reviewHeading: "Review your order",
  detailsHeading: "Your details",
  nameLabel: "Your name",
  namePlaceholder: "e.g. Aisha Khan",
  phoneLabel: "WhatsApp number",
  phonePlaceholder: "e.g. 98765 43210",
  notePlaceholder: "Anything you'd like our team to know (optional)",
  noteLabel: "Note for the team",
  howItWorks: "How ordering works",
  howItWorksBody: "There is no online payment. When you place your order it opens WhatsApp with your items ready to send. Our team confirms availability, the final price for any customised formulation, and how to pay — all on WhatsApp.",
  place: "Place order on WhatsApp",
  placing: "Opening WhatsApp…",
  back: "Back to cart",
  emptyRedirect: "Your cart is empty — add something first.",
  nameRequired: "Please add your name so our team knows who they're helping.",
  phoneRequired: "Please add a WhatsApp number so we can confirm your order.",
  // Confirmation state.
  confirmedTitle: "Your order is on its way to WhatsApp",
  confirmedBody: "We've opened WhatsApp with your order. Send the message and our team will confirm availability, the final price and payment. If WhatsApp didn't open, tap the button below.",
  openAgain: "Open WhatsApp again",
  continueShopping: "Continue shopping",
  subtotalPaidLater: "Payment is arranged on WhatsApp — nothing is charged here.",
} as const;
