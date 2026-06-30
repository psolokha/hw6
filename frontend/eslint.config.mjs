import next from "eslint-config-next/core-web-vitals"

const eslintConfig = [
  ...next,
  {
    rules: {
      // Новое строгое правило (react-hooks v7). В проекте setState в эффекте используется
      // для инициализации из localStorage/размеров окна при монтировании — оставляем как warning.
      "react-hooks/set-state-in-effect": "warn",
    },
  },
  {
    ignores: [".next/**", "node_modules/**", "next-env.d.ts"],
  },
]

export default eslintConfig
