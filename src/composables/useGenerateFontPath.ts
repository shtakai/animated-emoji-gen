import { computed, onMounted, ref } from "vue";
import { Font, load } from "opentype.js";

type FontType = {
  serif: {
    bold: Font | null;
    light: Font | null;
    medium: Font | null;
  };
  sans: {
    bold: Font | null;
    light: Font | null;
    medium: Font | null;
  };
};

const initialFonts = {
  serif: {
    bold: null,
    light: null,
    medium: null,
  },
  sans: {
    bold: null,
    light: null,
    medium: null,
  },
};

export const useGenerateFontPath = (initialText: string, viewSize: number) => {
  const text = ref(initialText);
  const fonts = ref<FontType>(initialFonts);
  const fontType = ref<{ family: string; weight: string }>({
    family: "sans",
    weight: "bold",
  });

  const font = computed(
    () =>
      // @ts-ignore TODO
      fonts.value[fontType.value.family][fontType.value.weight] as Font | null
  );

  const rows = computed(() => {
    return text.value.trim().split("\n");
  });

  const paths = computed(() => {
    if (!font.value) {
      return [""];
    }
    return rows.value.map((t, i) => {
      const y = (textSize.value[i].height - 12) * (i + 1);
      return font.value!.getPath(t, 0, y, viewSize).toPathData(2);
    });
  });

  const textSize = computed(() => {
    return rows.value.map((t) => {
      if (!font.value) {
        return {
          height: 0,
          width: 0,
        };
      }
      const { x1, y1, x2, y2 } = font!.value
        .getPath(t, 0, 0, viewSize)
        .getBoundingBox();
      return {
        width: x2 - x1 + 12.8,
        height: y2 - y1 + 12.8,
      };
    });
  });

  const transforms = computed(() => {
    if (!font.value || !text.value.length) {
      return ["scale(1,1)"];
    }
    return rows.value.map((t, i) => {
      const xScale = viewSize / textSize.value[i].width;
      const yScale = viewSize / textSize.value[i].height / rows.value.length;
      return `scale(${xScale}, ${yScale})`;
    });
  });

  const loading = ref(true);

  const loadFonts = async () => {
    const loadedFonts = await Promise.all([
      load("/fonts/NotoSerifJP-Black.otf"),
      load("/fonts/NotoSerifJP-Light.otf"),
      load("/fonts/NotoSerifJP-Medium.otf"),
      load("/fonts/NotoSansJP-Black.otf"),
      load("/fonts/NotoSansJP-Light.otf"),
      load("/fonts/NotoSansJP-Medium.otf"),
    ]);
    fonts.value = {
      serif: {
        bold: loadedFonts[0],
        light: loadedFonts[1],
        medium: loadedFonts[2],
      },
      sans: {
        bold: loadedFonts[3],
        light: loadedFonts[4],
        medium: loadedFonts[5],
      },
    };

    loading.value = false;
  };

  onMounted(async () => {
    loadFonts();
  });

  return {
    paths,
    fontType,
    text,
    transforms,
    loading,
  };
};
