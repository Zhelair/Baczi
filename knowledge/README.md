# BaZi Knowledge Library

Drop `.md` files anywhere in this folder (subfolders are fine too).
Drop `.html` files in `html/` — the scraper reads those too.

Run `npm run scrape` to push everything into Supabase.

---

## File format for .md rules

Each rule is a `##` section. Three metadata lines follow the heading,
then a blank line, then the rule description (one or more paragraphs).
Rules are separated by `---` or the next `##`.

```
## pattern_name
tags: Tag1, Tag2, Tag3
school: classical
confidence: high

Rule description goes here. Can be multiple sentences.
Explain the effect clearly in English.
```

**pattern** — short identifier, use pinyin names. Examples:
- `Jia_Yi_combine` `Zi_Wu_clash` `Geng_strong_daymaster` `Chen_Xu_Chou_Wei_punishment`

**tags** — comma-separated. Include all stems/branches involved + topic words.
Available topics: `clash`, `combine`, `punishment`, `destruction`, `harm`,
`element`, `daymaster`, `luck_cycle`, `year`, `month`, `day`, `hour`,
`heavenly_stem`, `earthly_branch`, `strong`, `weak`, `resource`, `output`,
`wealth`, `power`, `companion`

**school** — `classical` | `zi_ping` | `dong_gong` | `joey_yap` | `unknown`

**confidence** — `high` | `medium` | `low`

---

## Example: Zi_Wu_clash
tags: Zi, Wu, clash, earthly_branch, water, fire
school: classical
confidence: high

Zi (Rat) and Wu (Horse) form a direct clash of Water against Fire. When this clash activates in the luck cycle or annual pillar, it destabilizes the area of life governed by those branches. For a day master with Zi in the day branch, a Wu year brings relationship turbulence and health stress to the heart and kidneys.

---

## Example: Jia_Ji_combine
tags: Jia, Ji, combine, heavenly_stem, wood, earth
school: classical
confidence: high

Jia (Yang Wood) and Ji (Yin Earth) combine and transform to Earth when Earth is the dominant element in the chart. This combination weakens Jia day masters by removing their self-element. When the combination does not transform, the Jia stem is "occupied" and loses its outward drive energy.

---

## Example: strong_Geng_daymaster_water_output
tags: Geng, Xin, water, output, daymaster, strong, metal
school: classical
confidence: medium

A strong Metal day master (Geng or Xin) benefits greatly from Water output stars (Ren or Gui). Water washes and refines Metal, expressing its quality. Favorable years are those with strong Water in annual and luck pillars. Career breakthroughs often coincide with Ren or Gui stems appearing in the luck cycle.
