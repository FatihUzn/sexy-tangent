"""Asalet temalarının zeminlerini üretir: python3 araclar/zeminler.py <ikon-klasoru>
Her tema için iki dosya: icons/zemin-<ad>.svg (giriş: amblem tam) ve icons/zemin-<ad>-uyg.svg (uygulama: amblem silik, kartların ardında).
Kurt çizimleri game-icons.net (GameIcons, CC BY 3.0): wolf-head, wolf-howl. Ay-yıldız Türk bayrağı ölçüleriyle (G=800)."""
import math, random, re, sys
from pathlib import Path
KOK = Path(__file__).resolve().parent.parent
IKON = Path(sys.argv[1]) if len(sys.argv) > 1 else KOK / "araclar" / "ikon"
yol = lambda ad: re.search(r' d="([^"]+)"', (IKON / f"{ad}.svg").read_text()).group(1)
KURT_BAS, KURT_ULUMA = yol("wolf-head"), yol("wolf-howl")

def yildiz(cx, cy, R, rot):
    r = R * 0.381966
    return " ".join(f"{cx + (R if i % 2 == 0 else r) * math.cos(math.radians(rot + 36 * i)):.2f},{cy + (R if i % 2 == 0 else r) * math.sin(math.radians(rot + 36 * i)):.2f}" for i in range(10))

def kivrimlar(tohum, acik_renk, acik_kat, gen=(28, 70), egik=40, blur="yum"):
    random.seed(tohum); out = []; x = -60
    while x < 480:
        w = random.uniform(*gen); e = random.uniform(-egik, egik); a = random.uniform(.10, .32); acik = random.random() < .42
        out.append(f'<path d="M{x:.0f} -20 C{x+e:.0f} 300 {x-e:.0f} 600 {x+e/2:.0f} 880 L{x+w+e/2:.0f} 880 C{x+w-e:.0f} 600 {x+w+e:.0f} 300 {x+w:.0f} -20Z" fill="{acik_renk if acik else "#000"}" opacity="{a*(acik_kat if acik else 1):.2f}" filter="url(#{blur})"/>')
        x += w * random.uniform(.6, 1.05)
    return "".join(out)

ORTAK = '''<filter id="yum" x="-30%" y="-5%" width="160%" height="110%"><feGaussianBlur stdDeviation="15"/></filter>'''
NAKIS = '''<linearGradient id="altin" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#F6E2A8"/><stop offset=".35" stop-color="#D9B868"/><stop offset=".6" stop-color="#B8913F"/><stop offset="1" stop-color="#E9CF8A"/></linearGradient>
  <pattern id="iplik" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(-28)"><rect width="6" height="6" fill="url(#altin)"/><path d="M0 1.5 H6 M0 4.5 H6" stroke="#6E5320" stroke-width=".7" opacity=".55"/></pattern>
  <pattern id="iplik2" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(12)"><rect width="6" height="6" fill="url(#altin)"/><path d="M0 1.5 H6 M0 4.5 H6" stroke="#6E5320" stroke-width=".7" opacity=".5"/></pattern>
  <filter id="nakis" x="-10%" y="-10%" width="120%" height="120%">
    <feGaussianBlur in="SourceAlpha" stdDeviation="1.6" result="b"/>
    <feSpecularLighting in="b" surfaceScale="3" specularConstant=".9" specularExponent="18" lighting-color="#FFF4D0" result="s"><feDistantLight azimuth="235" elevation="45"/></feSpecularLighting>
    <feComposite in="s" in2="SourceAlpha" operator="in" result="s2"/>
    <feComposite in="SourceGraphic" in2="s2" operator="arithmetic" k2="1" k3=".55"/>
    <feDropShadow dx="0" dy="2" stdDeviation="2.5" flood-color="#000" flood-opacity=".6"/>
  </filter>
  <filter id="kadife" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency=".8" numOctaves="3" seed="5"/><feColorMatrix values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 .18 0"/></filter>'''

def svg(defs, govde):
    return f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 420 860" preserveAspectRatio="xMidYMin slice">\n<defs>{ORTAK}{defs}</defs>\n{govde}\n</svg>\n'

# Giriş: amblem üstte (y≈40–230), başlık altında başlar. Uygulama: amblem ortada, silik.
def al(giris):
    cy, s, op = (100, .29, .95) if giris else (300, .62, .16)
    amb = f'''<g opacity="{op}" transform="translate(210 {cy}) scale({s})"><mask id="m"><rect x="-300" y="-300" width="600" height="700" fill="#fff"/><circle cx="0" cy="50" r="160" fill="#000"/></mask>
<circle r="200" fill="#F6EFE6" mask="url(#m)"/><polygon fill="#F6EFE6" points="{yildiz(0, 158.334, 100, -90)}"/></g>'''
    defs = '''<linearGradient id="zg" x1="0" y1="0" x2="0.3" y2="1"><stop offset="0" stop-color="#C8101C"/><stop offset=".55" stop-color="#A50C16"/><stop offset="1" stop-color="#6E060D"/></linearGradient>
  <filter id="ipek" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency=".7 .012" numOctaves="2" seed="3"/><feColorMatrix values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 .035 0"/></filter>
  <radialGradient id="isik" cx=".75" cy=".08" r=".7"><stop offset="0" stop-color="#FFB089" stop-opacity=".35"/><stop offset="1" stop-color="#FFB089" stop-opacity="0"/></radialGradient>
  <radialGradient id="kenar" cx=".5" cy=".45" r=".75"><stop offset=".55" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".45"/></radialGradient>'''
    return svg(defs, f'<rect width="420" height="860" fill="url(#zg)"/>{amb}{kivrimlar(7, "#FFD9C9", .38)}<rect width="420" height="860" filter="url(#ipek)"/><rect width="420" height="860" fill="url(#isik)"/><rect width="420" height="860" fill="url(#kenar)"/>')

def kadife(renkler, isik, tohum, acik):
    return f'''<radialGradient id="zg" cx=".5" cy=".35" r=".8"><stop offset="0" stop-color="{renkler[0]}"/><stop offset=".6" stop-color="{renkler[1]}"/><stop offset="1" stop-color="{renkler[2]}"/></radialGradient>
  <radialGradient id="isik" cx=".5" cy=".25" r=".5"><stop offset="0" stop-color="{isik}" stop-opacity=".18"/><stop offset="1" stop-color="{isik}" stop-opacity="0"/></radialGradient>''' + NAKIS, f'<rect width="420" height="860" fill="url(#zg)"/>{kivrimlar(tohum, acik, .35, (50, 110), 30, "yum")}<rect width="420" height="860" fill="url(#isik)"/>'

def kurt(giris):   # hırlayan kurt başı + hilal, koyu kırmızı kadife
    defs, zemin = kadife(("#7A0A12", "#4A0509", "#1C0204"), "#FF8A5C", 4, "#FF5A4A")
    k, y = (.36, 16) if giris else (.75, 150)
    amb = f'''<g filter="url(#nakis)" opacity="{.95 if giris else .2}" transform="translate({210 - 210*k} {y}) scale({k})">
  <mask id="ay"><rect x="-300" y="-300" width="600" height="600" fill="#fff"/><circle cx="0" cy="-50" r="160" fill="#000"/></mask>
  <g transform="translate(210 372) scale(.6)"><circle r="200" fill="url(#iplik)" mask="url(#ay)"/></g>
  <g transform="translate(122 118) scale(.36)"><path d="{KURT_BAS}" fill="url(#iplik2)"/></g></g>'''
    return svg(defs, zemin + amb + '<rect width="420" height="860" filter="url(#kadife)"/>')

def uluyan(giris):   # uluyan kurt (ay içinde), gece laciverdi kadife
    defs, zemin = kadife(("#1F2D5A", "#111A38", "#060A18"), "#9DB4FF", 12, "#7F9CFF")
    s, y = (.36, 28) if giris else (.62, 160)
    amb = f'''<g filter="url(#nakis)" opacity="{.95 if giris else .2}" transform="translate({210 - 256*s} {y}) scale({s})"><path d="{KURT_ULUMA}" fill="url(#iplik)"/></g>'''
    yildizlar = "".join(f'<circle cx="{random.uniform(0,420):.0f}" cy="{random.uniform(0,520):.0f}" r="{random.uniform(.5,1.4):.1f}" fill="#F6E2A8" opacity="{random.uniform(.25,.7):.2f}"/>' for _ in range(40))
    return svg(defs, zemin + yildizlar + amb + '<rect width="420" height="860" filter="url(#kadife)"/>')

def gok(giris):
    s, cx, cy, op = (.3, 192, 120, 1) if giris else (.36, 182, 200, .3)
    defs = '''<linearGradient id="gok" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2F6FB0"/><stop offset=".45" stop-color="#5C95CC"/><stop offset="1" stop-color="#A9CBE9"/></linearGradient>
  <filter id="bulut" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency=".006 .011" numOctaves="5" seed="11"/><feColorMatrix values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 2.6 -1.35"/><feGaussianBlur stdDeviation="2"/></filter>
  <radialGradient id="bm" cx=".5" cy=".5" r=".5"><stop offset=".45" stop-color="#000"/><stop offset="1" stop-color="#fff"/></radialGradient>
  <mask id="kenar"><rect width="420" height="860" fill="url(#bm)"/></mask>
  <mask id="ay"><rect x="-300" y="-300" width="900" height="600" fill="#fff"/><circle cx="50" cy="0" r="160" fill="#000"/></mask>
  <filter id="gol"><feDropShadow dx="0" dy="3" stdDeviation="6" flood-color="#0B2A50" flood-opacity=".25"/></filter>'''
    return svg(defs, f'''<rect width="420" height="860" fill="url(#gok)"/><g mask="url(#kenar)"><rect width="420" height="860" filter="url(#bulut)" opacity=".95"/></g>
<g transform="translate({cx} {cy}) scale({s})" fill="#fff" filter="url(#gol)" opacity="{op}"><circle r="200" mask="url(#ay)"/><polygon points="{yildiz(158.334, 0, 100, 180)}"/></g>''')

random.seed(1)
for ad, f in [("al", al), ("kurt", kurt), ("uluyan", uluyan), ("gok", gok)]:
    (KOK / "icons" / f"zemin-{ad}.svg").write_text(f(True), encoding="utf-8")
    (KOK / "icons" / f"zemin-{ad}-uyg.svg").write_text(f(False), encoding="utf-8")
    print(ad, "tamam")
