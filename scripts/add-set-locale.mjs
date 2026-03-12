import fs from 'fs';

const files = [
  'app/[locale]/chef-tools/converter/page.tsx',
  'app/[locale]/chef-tools/ingredient-analyzer/page.tsx',
  'app/[locale]/chef-tools/ingredients/page.tsx',
  'app/[locale]/chef-tools/ingredients/[slug]/page.tsx',
  'app/[locale]/chef-tools/nutrition/[slug]/page.tsx',
  'app/[locale]/chef-tools/converter/[conversion]/page.tsx',
  'app/[locale]/chef-tools/fish-season/[month]/page.tsx',
  'app/[locale]/chef-tools/how-many/[...query]/page.tsx',
  'app/[locale]/chef-tools/page.tsx',
  'app/[locale]/page.tsx',
  'app/[locale]/contact/page.tsx',
  'app/[locale]/restaurants/page.tsx',
  'app/[locale]/blog/page.tsx',
  'app/[locale]/blog/[slug]/page.tsx',
  'app/[locale]/demos/restaurant-ai/page.tsx',
  'app/[locale]/demos/sushi-delivery/page.tsx',
];

// Fix: when locale was aliased as "l", setRequestLocale(locale) was inserted
// before locale was declared. Replace those with setRequestLocale(l).
for (const f of files) {
  let src = fs.readFileSync(f, 'utf8');
  let changed = false;

  // Fix pattern: "{ locale: l } = await params;\n  setRequestLocale(locale);"
  // → replace setRequestLocale(locale) with setRequestLocale(l)
  const fixed = src.replace(
    /(\bconst \{ locale: l[^}]*\} = await params;\n(\s*))setRequestLocale\(locale\);/g,
    '$1setRequestLocale(l);'
  );

  if (fixed !== src) {
    changed = true;
    console.log('Fixed alias in:', f);
    fs.writeFileSync(f, fixed);
  }
}
console.log('Done.');
