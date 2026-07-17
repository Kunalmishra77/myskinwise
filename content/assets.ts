export type ImageAsset = { src: string; alt: string; width: number; height: number };

export const IMAGES = {
  logo: {
    src: "/images/logo.png",
    alt: "Skinwise logo, a rose-pink script wordmark",
    width: 313,
    height: 177,
  },
  heroModel: {
    src: "/images/hero-model.jpg",
    alt: "Woman with clear, healthy, glowing skin smiling gently against a warm brown studio backdrop",
    width: 1708,
    height: 2560,
  },
  bannerLongterm: {
    src: "/images/banner-longterm.jpg",
    alt: "Smiling woman gently touching her glowing cheeks beside the headline promising tailor-made solutions for long-term skin problems",
    width: 1920,
    height: 720,
  },
  bannerScience: {
    src: "/images/banner-science.jpg",
    alt: "Smiling woman with bare shoulders beside the headline about proven skin science renewing skin",
    width: 1920,
    height: 720,
  },
  package45Day: {
    src: "/images/package-45-day.jpg",
    alt: "Skinwise 45-day customised acne treatment bundle with cleanser, spray toner, and two cream jars",
    width: 1080,
    height: 1350,
  },
  package30Day: {
    src: "/images/package-30-day.jpg",
    alt: "Skinwise 30-day customised acne treatment bundle with cleanser bottle and two cream jars",
    width: 1080,
    height: 1350,
  },
  package15Day: {
    src: "/images/package-15-day.jpg",
    alt: "Skinwise 15-day customised acne treatment bundle with cleanser bottle and one cream jar",
    width: 1080,
    height: 1350,
  },
  concernRedness: {
    src: "/images/concern-redness.jpg",
    alt: "Extreme close-up of under-eye skin with visible redness and broken capillaries circled",
    width: 2560,
    height: 1280,
  },
  concernTexture: {
    src: "/images/concern-texture.jpg",
    alt: "Extreme close-up of dry, rough, textured skin with a problem area circled",
    width: 2560,
    height: 1280,
  },
  concernPores: {
    src: "/images/concern-pores.jpg",
    alt: "Close-up of a cheek and nose showing enlarged pores with a problem area circled",
    width: 2560,
    height: 1280,
  },
  concernBlemishes: {
    src: "/images/concern-blemishes.jpg",
    alt: "Close-up of cheek and lip area showing blemishes and enlarged pores with a problem area circled",
    width: 2560,
    height: 1280,
  },
  model1: {
    src: "/images/model-1.jpg",
    alt: "Woman looking upward and smiling with both hands framing her clear, glowing face",
    width: 1440,
    height: 2560,
  },
  galleryLaunchEvent: {
    src: "/images/gallery-launch-event.jpg",
    alt: "Group of four people celebrating at a Skinwise product launch event with balloons, flowers, and a display table",
    width: 1080,
    height: 1350,
  },
  blogSkincareHabits: {
    src: "/images/blog-skincare-habits.png",
    alt: "Close-up of a smiling woman touching her cheeks, illustrating an article on skincare habits",
    width: 1200,
    height: 600,
  },
} as const satisfies Record<string, ImageAsset>;

export type ImageKey = keyof typeof IMAGES;
