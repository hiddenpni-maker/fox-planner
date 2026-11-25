import type { FontFamilyPreset, FontScalePreset } from '../types/planner';

export interface TypographyStyleLike {
  fontSize?: number;
  lineHeight?: number;
  fontWeight?: string | number;
  fontFamily?: string;
}

export interface FontPresetMeta {
  id: FontFamilyPreset;
  nameFa: string;
  nameEn: string;
  sampleFa: string;
  descFa: string;
  descEn: string;
  regularFamily?: string;
  mediumFamily?: string;
  boldFamily?: string;
}

export const FONT_PRESETS: Record<FontFamilyPreset, FontPresetMeta> = {
  vazirmatn: {
    id: 'vazirmatn',
    nameFa: 'وزیرمتن (استاندارد و مدرن)',
    nameEn: 'Vazirmatn (Clean & Modern)',
    sampleFa: 'برنامه‌ریزی هوشمند با روباه',
    descFa: 'فونت محبوب، خوانا و استاندارد برای متون طولانی فارسی',
    descEn: 'Crisp, balanced & ultra-readable Persian UI typography',
    regularFamily: 'Vazirmatn_400Regular',
    mediumFamily: 'Vazirmatn_500Medium',
    boldFamily: 'Vazirmatn_800ExtraBold',
  },
  baloo: {
    id: 'baloo',
    nameFa: 'بالو (گرد و بامزه)',
    nameEn: 'Baloo Bhaijaan (Rounded)',
    sampleFa: 'حس خوب و روباهی امروز',
    descFa: 'حروف نرم، گرد و صمیمی متناسب با حال‌وهوای روباه',
    descEn: 'Friendly rounded strokes full of warmth and charm',
    regularFamily: 'BalooBhaijaan2_400Regular',
    mediumFamily: 'BalooBhaijaan2_500Medium',
    boldFamily: 'BalooBhaijaan2_800ExtraBold',
  },
  readex: {
    id: 'readex',
    nameFa: 'ریدکس پرو (هندسی و شیک)',
    nameEn: 'Readex Pro (Geometric)',
    sampleFa: 'تمرکز عمیق و آرامش ذهن',
    descFa: 'فونت مدرن و منظم برای مطالعه و یادداشت‌برداری',
    descEn: 'Sleek geometric balance built for focus and notes',
    regularFamily: 'ReadexPro_400Regular',
    mediumFamily: 'ReadexPro_500Medium',
    boldFamily: 'ReadexPro_700Bold',
  },
  lalezar: {
    id: 'lalezar',
    nameFa: 'لاله‌زار (فانتزی و تیترمحور)',
    nameEn: 'Lalezar (Bold Poster)',
    sampleFa: 'فاکس پلنر همیشه پرانرژی!',
    descFa: 'فونت ضخیم و پرانرژی برای تیترها و متن‌های پرجلوه',
    descEn: 'Expressive high-energy display script',
    regularFamily: 'Lalezar_400Regular',
    mediumFamily: 'Lalezar_400Regular',
    boldFamily: 'Lalezar_400Regular',
  },
  system: {
    id: 'system',
    nameFa: 'فونت پیش‌فرض دستگاه',
    nameEn: 'System Default',
    sampleFa: 'نمای استاندارد سیستم‌عامل',
    descFa: 'استفاده از فونت پیش‌فرض گوشی یا مرورگر شما',
    descEn: 'Use your device native font',
  },
};

export interface FontScaleMeta {
  id: FontScalePreset;
  multiplier: number;
  labelFa: string;
  labelEn: string;
}

export const FONT_SCALE_PRESETS: Record<FontScalePreset, FontScaleMeta> = {
  sm: { id: 'sm', multiplier: 0.88, labelFa: 'کوچک', labelEn: 'Compact' },
  md: { id: 'md', multiplier: 1.0, labelFa: 'عادی', labelEn: 'Normal' },
  lg: { id: 'lg', multiplier: 1.13, labelFa: 'بزرگ', labelEn: 'Large' },
  xl: { id: 'xl', multiplier: 1.25, labelFa: 'خیلی بزرگ', labelEn: 'Extra Large' },
};

export function resolveFontFamilyForWeight(
  preset: FontFamilyPreset,
  weight?: string | number
): string | undefined {
  const meta = FONT_PRESETS[preset] ?? FONT_PRESETS.vazirmatn;
  if (meta.id === 'system') return undefined;
  const w = String(weight ?? '400');
  if (w === 'bold' || w === '700' || w === '800' || w === '900') {
    return meta.boldFamily ?? meta.regularFamily;
  }
  if (w === '500' || w === '600') {
    return meta.mediumFamily ?? meta.regularFamily;
  }
  return meta.regularFamily;
}

/**
 * Scales fontSize and lineHeight according to user preference while keeping
 * oversized timer/emoji glyphs from overflowing circular rings.
 */
export function buildScaledTextStyle<T extends TypographyStyleLike>(
  flat: T,
  fontPreset: FontFamilyPreset,
  scalePreset: FontScalePreset,
  fontsReady: boolean
): T & TypographyStyleLike {
  const scaleMeta = FONT_SCALE_PRESETS[scalePreset] ?? FONT_SCALE_PRESETS.md;
  const baseFontSize = typeof flat.fontSize === 'number' ? flat.fontSize : 14;
  const effectiveMultiplier =
    baseFontSize >= 26 ? Math.min(1.1, Math.max(0.92, scaleMeta.multiplier)) : scaleMeta.multiplier;

  const scaledSize = Math.round(baseFontSize * effectiveMultiplier * 10) / 10;
  const scaledLineHeight =
    typeof flat.lineHeight === 'number'
      ? Math.round(flat.lineHeight * effectiveMultiplier * 10) / 10
      : undefined;

  const customFamily = fontsReady ? resolveFontFamilyForWeight(fontPreset, flat.fontWeight) : undefined;

  return {
    ...flat,
    fontSize: scaledSize,
    ...(scaledLineHeight !== undefined ? { lineHeight: scaledLineHeight } : {}),
    ...(customFamily
      ? {
          fontFamily: customFamily,
          // Remove numeric fontWeight when binding explicit TTF weight file so Android renders the custom font reliably.
          fontWeight: undefined,
        }
      : {}),
  } as T & TypographyStyleLike;
}
