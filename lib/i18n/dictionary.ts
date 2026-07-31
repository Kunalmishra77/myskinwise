import type { Locale } from "@/lib/i18n/config";

/**
 * UI string dictionary. Keys are dot-namespaced; every key must have both an
 * `en` and a `hi` value so a missing translation is a type error, not a blank
 * on the page.
 *
 * Brand and product names, ingredient (INCI) names and the word "WhatsApp" are
 * deliberately NOT translated here — they are proper nouns or regulated label
 * text, and translating them would be wrong.
 */
export const DICTIONARY = {
  "nav.home": { en: "Home", hi: "होम" },
  "nav.skinAi": { en: "Skin AI", hi: "स्किन एआई" },
  "nav.skinCheck": { en: "Skin Check", hi: "स्किन चेक" },
  "nav.analyzer": { en: "AI Skin Analyzer", hi: "एआई स्किन एनालाइज़र" },
  "nav.assistant": { en: "AI Assistant", hi: "एआई असिस्टेंट" },
  "nav.voice": { en: "Talk to Skinwise AI", hi: "स्किनवाइज़ एआई से बात करें" },
  "nav.skinProblem": { en: "Skin Problem", hi: "त्वचा की समस्या" },
  "nav.formulations": { en: "Formulations", hi: "फ़ॉर्मूलेशन" },
  "nav.expertise": { en: "Our Expertise", hi: "हमारी विशेषज्ञता" },
  "nav.contact": { en: "Contact", hi: "संपर्क करें" },
  "nav.concerns": { en: "Skin concerns", hi: "त्वचा की समस्याएँ" },
  "nav.ingredients": { en: "Ingredients", hi: "सामग्री" },
  "nav.skinTypes": { en: "Skin types", hi: "त्वचा के प्रकार" },
  "nav.learn": { en: "Learn", hi: "जानें" },
  "nav.me": { en: "My Skinwise", hi: "मेरा स्किनवाइज़" },

  "cta.startSkinCheck": { en: "Start your Skin Check", hi: "अपना स्किन चेक शुरू करें" },
  "cta.startSkinCheckShort": { en: "Start Skin Check", hi: "स्किन चेक शुरू करें" },
  "cta.scanYourSkin": { en: "Scan your skin", hi: "अपनी त्वचा स्कैन करें" },
  "cta.messageExpert": { en: "Message an expert", hi: "विशेषज्ञ को संदेश भेजें" },
  "cta.talkToExpert": { en: "Talk to a Skinwise expert", hi: "स्किनवाइज़ विशेषज्ञ से बात करें" },
  "cta.orderWhatsapp": { en: "Order on WhatsApp", hi: "WhatsApp पर ऑर्डर करें" },
  "cta.addToCart": { en: "Add to cart", hi: "कार्ट में जोड़ें" },
  "cta.inCart": { en: "In cart", hi: "कार्ट में है" },
  "cta.viewAll": { en: "View all formulations", hi: "सभी फ़ॉर्मूलेशन देखें" },

  "bottomNav.home": { en: "Home", hi: "होम" },
  "bottomNav.voice": { en: "Voice", hi: "वॉइस" },
  "bottomNav.shop": { en: "Shop", hi: "शॉप" },
  "bottomNav.scan": { en: "Scan", hi: "स्कैन" },
  "bottomNav.ask": { en: "Ask", hi: "पूछें" },
  "bottomNav.me": { en: "Me", hi: "मेरा" },

  "whatsapp.aria": { en: "Chat with us on WhatsApp", hi: "WhatsApp पर हमसे चैट करें" },
  "action.backToTop": { en: "Back to top", hi: "ऊपर जाएँ" },

  "cart.title": { en: "Your cart", hi: "आपका कार्ट" },
  "cart.empty": { en: "Your cart is empty.", hi: "आपका कार्ट खाली है।" },
  "cart.browse": { en: "Browse formulations", hi: "फ़ॉर्मूलेशन देखें" },
  "cart.clear": { en: "Clear cart", hi: "कार्ट खाली करें" },
  "cart.priceOnWhatsapp": { en: "Price confirmed on WhatsApp", hi: "कीमत WhatsApp पर तय होगी" },
  "cart.note": {
    en: "Skinwise formulations are compounded per customer, so our team confirms the final price and arranges payment over WhatsApp.",
    hi: "स्किनवाइज़ फ़ॉर्मूलेशन हर ग्राहक के लिए अलग से बनाए जाते हैं, इसलिए हमारी टीम अंतिम कीमत तय करके WhatsApp पर भुगतान की व्यवस्था करती है।",
  },
  "cart.subtotal": { en: "Subtotal", hi: "उप-योग" },
  "cart.checkout": { en: "Go to checkout", hi: "चेकआउट पर जाएँ" },

  "voice.title": { en: "Talk to Skinwise", hi: "स्किनवाइज़ से बात करें" },
  "voice.persona": { en: "Riya", hi: "रिया" },
  "voice.personaTag": { en: "Your Skinwise skincare guide", hi: "आपकी स्किनवाइज़ स्किनकेयर गाइड" },
  "voice.tapToSpeak": { en: "Tap to speak", hi: "बोलने के लिए टैप करें" },
  "voice.tapToTalk": { en: "Tap to talk to Riya", hi: "रिया से बात करने के लिए टैप करें" },
  "voice.listening": { en: "Listening…", hi: "सुन रही हूँ…" },
  "voice.gotIt": { en: "Got it…", hi: "समझ गई…" },
  "voice.thinking": { en: "Thinking…", hi: "सोच रही हूँ…" },
  "voice.speaking": { en: "Speaking… just talk to interrupt", hi: "बोल रही हूँ… रोकने के लिए बस बोलें" },
  "voice.tapToRetry": { en: "Tap to try again", hi: "फिर कोशिश करने के लिए टैप करें" },
  "voice.typeInstead": { en: "Type instead", hi: "इसके बजाय लिखें" },
  "voice.startOver": { en: "Start over", hi: "फिर से शुरू करें" },
  "voice.close": { en: "Close voice assistant", hi: "वॉइस असिस्टेंट बंद करें" },
  "voice.send": { en: "Send", hi: "भेजें" },
  "voice.typeMessage": { en: "Type your message…", hi: "अपना संदेश लिखें…" },
  "voice.useVoice": { en: "Use voice instead", hi: "इसके बजाय आवाज़ का उपयोग करें" },
  "voice.scanCta": { en: "Scan your face for detailed analysis", hi: "विस्तृत विश्लेषण के लिए अपना चेहरा स्कैन करें" },
  "voice.hearResults": { en: "Tap to hear your skin analysis", hi: "अपना त्वचा विश्लेषण सुनने के लिए टैप करें" },
  "voice.emptyHint": {
    en: "Tap the circle and Riya will say hello, then just talk — about a concern, an ingredient, your routine, anything.",
    hi: "गोले पर टैप करें, रिया नमस्ते कहेगी, फिर बस बात करें — किसी समस्या, सामग्री, अपनी रूटीन, कुछ भी के बारे में।",
  },
  "voice.intro": {
    en: "Tap the mic and ask anything about your skin — I'll answer out loud, and keep listening so you can just talk.",
    hi: "माइक पर टैप करें और अपनी त्वचा के बारे में कुछ भी पूछें — मैं बोलकर जवाब दूँगी, और सुनती रहूँगी ताकि आप बस बात करते रहें।",
  },

  "lang.label": { en: "Language", hi: "भाषा" },
} as const;

export type MessageKey = keyof typeof DICTIONARY;

/** Translate a key. Falls back to English if a Hindi value is ever missing. */
export function translate(locale: Locale, key: MessageKey): string {
  const entry = DICTIONARY[key];
  return entry[locale] ?? entry.en;
}
