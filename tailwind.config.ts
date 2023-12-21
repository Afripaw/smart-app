import { type Config } from "tailwindcss";
import { fontFamily } from "tailwindcss/defaultTheme";

export default {
  content: ["./src/**/*.tsx"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-sans)", ...fontFamily.sans],
      },
      colors: {
        main: {
          //orange: "#E73B22",
          orange: "#EB4724",
        },
        accent: {
          /*  dark: "#22306e", */
          light: "#F3F04F",
        },
        success: {
          light: "#72c48d",
          dark: "#5a976e",
        },
        error: {
          light: "#de6364",
          dark: "#986568",
        },
      },
    },
  },
  plugins: [],
} satisfies Config;
