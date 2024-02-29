import { type Config } from "tailwindcss";
import { fontFamily } from "tailwindcss/defaultTheme";
import { withUt } from "uploadthing/tw";

export default withUt({
  content: ["./src/**/*.tsx"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-sans)", ...fontFamily.sans],
        //make font of all text 0.95rem
        //https://tailwindcss.com/docs/font-size#app
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

      fontSize: {
        normal: "0.95rem",
      },
    },
  },
  plugins: [],
}) satisfies Config;
