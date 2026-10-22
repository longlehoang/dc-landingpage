#!/usr/bin/env python3
"""One-off converter: crawl output -> Strapi-ready seed content.

    python3 cms/scripts/convert-crawl.py <crawl-dir>

Reads <crawl-dir>/{individual,institution,funds,corporate} and writes
  cms/scripts/content/{sites,pages,funds,articles,document-taxonomy}.json
  cms/scripts/content/fund-documents.jsonl.gz
  seed-assets/content/<area>/...   (only referenced assets, optimized with `sips`)

Content files use the Strapi field names. Localized data is shaped
  { <non-localized fields>, "locales": { "vi": {...}, "en": {...} } }
Media references are {"$media": "content/<area>/<file>", "alt": "..."}; images inside
markdown are written as `media:content/...` (seed.js uploads them and rewrites the URL).
Python 3 stdlib only (uses macOS `sips` for image work).
"""
import gzip
import json
import os
import re
import shutil
import subprocess
import sys
from collections import Counter, defaultdict

LOCALES = ('vi', 'en')
HERE = os.path.dirname(os.path.abspath(__file__))
REPO = os.path.abspath(os.path.join(HERE, '..', '..'))
OUT = os.path.join(HERE, 'content')
ASSET_ROOT = os.path.join(REPO, 'seed-assets')

CRAWL = None
DROPS = []  # human-readable notes about dropped / approximated content


def note(msg):
    if msg not in DROPS:
        DROPS.append(msg)


def load(*parts):
    with open(os.path.join(CRAWL, *parts), encoding='utf-8') as f:
        return json.load(f)


def is_loc(o):
    return isinstance(o, dict) and o and set(o.keys()) <= set(LOCALES)


def L(o, loc):
    """Resolve every {vi, en} object to the locale's value (falls back to the other locale)."""
    if is_loc(o):
        v = o.get(loc)
        if v is None:
            v = o.get('en' if loc == 'vi' else 'vi')
        return L(v, loc)
    if isinstance(o, dict):
        return {k: L(v, loc) for k, v in o.items()}
    if isinstance(o, list):
        return [L(v, loc) for v in o]
    return o


def clean(o):
    """Drop None values / empty lists from dicts (keeps Strapi payloads small)."""
    if isinstance(o, dict):
        return {k: clean(v) for k, v in o.items() if v is not None and v != [] and not (k == '$media' and not v)}
    if isinstance(o, list):
        return [clean(v) for v in o]
    return o


def truncate(s, n):
    if not s or len(s) <= n:
        return s
    cut = s[: n - 1]
    if ' ' in cut[n // 2:]:
        cut = cut[: cut.rfind(' ')]
    return cut.rstrip(' |,-–:') + '…'


def seo(title, desc):
    if not title:
        return None
    return clean({'metaTitle': truncate(title.strip(), 120), 'metaDescription': truncate((desc or '').strip(), 300) or None})


# ---------------------------------------------------------------- assets

class Assets:
    """Copies referenced assets into seed-assets/content, downscaling/converting on the way."""

    def __init__(self):
        self.map = {}  # src abs path -> dest rel path (relative to seed-assets)

    def _sips_props(self, path):
        out = subprocess.run(['sips', '-g', 'pixelWidth', '-g', 'pixelHeight', '-g', 'hasAlpha', path],
                             capture_output=True, text=True).stdout
        props = dict(re.findall(r'^\s+(\w+): (\S+)', out, re.M))
        return int(props.get('pixelWidth', 0)), int(props.get('pixelHeight', 0)), props.get('hasAlpha') == 'yes'

    def ref(self, area, rel):
        """area: crawl area dir; rel: path relative to that dir (e.g. 'assets/home/x.png').
        Returns dest path relative to seed-assets (e.g. 'content/individual/home/x.png') or None."""
        if not rel:
            return None
        src = os.path.join(CRAWL, area, rel)
        if not os.path.isfile(src):
            note(f'missing asset {area}/{rel}')
            return None
        if src in self.map:
            return self.map[src]
        sub = rel[len('assets/'):] if rel.startswith('assets/') else rel
        if area == 'corporate' and sub.startswith('news/'):
            dest_rel = 'content/' + sub  # article images live in content/news/
        else:
            dest_rel = f'content/{area}/{sub}'
        base, ext = os.path.splitext(dest_rel)
        ext = ext.lower()
        size = os.path.getsize(src)
        action = 'copy'
        if ext == '.svg':
            dest_rel, action = base + '.png', 'svg'
        elif ext in ('.png', '.jpg', '.jpeg', '.webp'):
            w, h, alpha = self._sips_props(src)
            big = max(w, h) > 1600
            if ext == '.png' and not alpha and size > 300_000:
                dest_rel, action = base + '.jpg', 'png2jpg'
            elif ext == '.png' and size > 300_000 and shutil.which('cwebp'):
                # large PNG with an alpha channel: WebP keeps transparency at a fraction of the size
                dest_rel, action = base + '.webp', 'png2webp'
            elif ext in ('.jpg', '.jpeg') and (big or size > 250_000 or dest_rel.startswith('content/news/')):
                action = 'jpg'
            elif big:
                action = 'resize'
        dest = os.path.join(ASSET_ROOT, dest_rel)
        self.map[src] = dest_rel
        # article images are only shown in a ~800px column: smaller cap keeps the seed under budget
        edge, quality = ('1200', '70') if dest_rel.startswith('content/news/') else ('1600', '80')
        if os.path.exists(dest) and os.path.getmtime(dest) >= os.path.getmtime(src):
            return dest_rel
        os.makedirs(os.path.dirname(dest), exist_ok=True)
        q = lambda *a: subprocess.run(['sips', *a], capture_output=True, check=True)  # noqa: E731
        if action == 'copy':
            shutil.copyfile(src, dest)
        elif action == 'resize':
            q('-Z', edge, src, '--out', dest)
        elif action in ('jpg', 'png2jpg'):
            q('-Z', edge, '-s', 'format', 'jpeg', '-s', 'formatOptions', quality, src, '--out', dest)
        elif action == 'png2webp':
            w, h, _ = self._sips_props(src)
            resize = ['-resize', edge, '0'] if w >= h and w > int(edge) else (['-resize', '0', edge] if h > int(edge) else [])
            subprocess.run(['cwebp', '-quiet', '-q', quality, '-alpha_q', '90', *resize, src, '-o', dest], check=True)
        elif action == 'svg':
            self._svg_to_png(src, dest)
        return dest_rel

    def _svg_to_png(self, src, dest):
        with open(src, encoding='utf-8') as f:
            svg = f.read()
        m = re.search(r'<svg\b[^>]*>', svg)
        tag = m.group(0)
        vb = re.search(r'viewBox="\s*[-\d.]+[\s,]+[-\d.]+[\s,]+([\d.]+)[\s,]+([\d.]+)', tag)
        wm = re.search(r'\swidth="([\d.]+)(px)?"', tag)
        hm = re.search(r'\sheight="([\d.]+)(px)?"', tag)
        w = float(wm.group(1)) if wm else (float(vb.group(1)) if vb else 64)
        h = float(hm.group(1)) if hm else (float(vb.group(2)) if vb else 64)
        scale = max(1, min(8, 512 / max(w, h)))
        new = re.sub(r'\s(width|height)="[^"]*"', '', tag)
        if not vb:
            new = new.replace('<svg', f'<svg viewBox="0 0 {w:g} {h:g}"', 1)
        new = new.replace('<svg', f'<svg width="{w * scale:.0f}" height="{h * scale:.0f}"', 1)
        tmp = dest + '.tmp.svg'
        with open(tmp, 'w', encoding='utf-8') as f:
            f.write(svg.replace(tag, new, 1))
        try:
            subprocess.run(['sips', '-s', 'format', 'png', tmp, '--out', dest], capture_output=True, check=True)
        finally:
            os.remove(tmp)


ASSETS = Assets()


def media(area, rel, alt=None):
    dest = ASSETS.ref(area, rel) if rel else None
    if not dest:
        return None
    return clean({'$media': dest, 'alt': alt or None})


# ---------------------------------------------------------------- links

SLUG_BY_SFID = {}
ARTICLE_BY_KEY = {}  # sfContentKey / sfUrlName -> slug


def rewrite_url(u):
    if not isinstance(u, str) or not u.strip():
        return u
    s = u.strip()
    m = re.match(r'^https?://(?:www\.)?dragoncapital\.com\.vn(/.*)?$', s, re.I)
    if m:
        path = m.group(1) or '/'
    elif s.startswith('/'):
        path = s
    else:
        return u
    if '/sfsites/' in path or '/webruntime/' in path:
        return u
    frag = ''
    if '#' in path:
        path, frag = path.split('#', 1)
        frag = '#' + frag
    path = path.split('?', 1)[0]
    segs = [x for x in path.split('/') if x]
    segs = [x for i, x in enumerate(segs) if not (i <= 1 and x.lower() in ('vi', 'en'))]
    if not segs:
        return '/' + frag if frag else '/'
    head = segs[0]
    if head == 'news':
        segs = ['individual', 'news-and-insights'] + segs[1:]
        head = 'individual'
    if head == 'regulatory':
        return '/contact' if len(segs) > 1 and segs[1] == 'contact' else '/regulatory'
    if head in ('individual', 'institution') and len(segs) > 1:
        sub = segs[1]
        if sub == 'product' and len(segs) > 2:
            slug = SLUG_BY_SFID.get(segs[2]) or (segs[3] if len(segs) > 3 else segs[2].lower())
            return f'/{head}/product/{slug}{frag}'
        if sub == 'news-and-insights' and len(segs) > 2:
            key = segs[2]
            slug = ARTICLE_BY_KEY.get(key)
            if not slug:
                for k, v in ARTICLE_BY_KEY.items():
                    if key.endswith('-' + k) or key == k:
                        slug = v
                        break
            return f'/{head}/news-and-insights/{slug or key}'
        if sub == 'staffbio':
            return f'/{head}/about'
        if sub == 'terms-and-conditions':
            return '/terms'
    return '/' + '/'.join(segs) + frag


def rewrite_md(text):
    if not isinstance(text, str):
        return text
    text = re.sub(r'(\]\()([^)\s]+)', lambda m: m.group(1) + rewrite_url(m.group(2)), text)
    text = re.sub(r'(href=")([^"]+)', lambda m: m.group(1) + rewrite_url(m.group(2)), text)
    return text


def link(label, url, new_tab=None):
    if not label or not url:
        return None
    url = rewrite_url(url)
    if new_tab is None:
        new_tab = url.startswith('http')
    return {'label': label, 'url': url, 'openInNewTab': bool(new_tab)}


def contact_url(value, url=None):
    v = (value or '').strip()
    if '@' in v:
        return 'mailto:' + v
    digits = re.sub(r'[^\d+]', '', v)
    if digits:
        return 'tel:' + digits
    return url


# ---------------------------------------------------------------- sections

TONES = {'#FFFFFF': 'light', '#C08F4F': 'gold', '#00BF6F': 'green'}
CONTACT_ANCHOR = 'contact-form'


def hero_block(s, area, loc):
    v = (s.get('variant') or '')
    vl = v.lower()
    b = {'__component': 'blocks.hero', 'title': s.get('title')}
    if s.get('slides'):
        b['variant'] = 'carousel'
        slides = []
        for sl in s['slides']:
            cta = sl.get('cta') or {}
            slides.append(clean({
                'title': sl.get('title'), 'subtitle': sl.get('subtitle'),
                'paginationLabel': sl.get('paginationLabel'),
                'image': media(area, sl.get('image'), sl.get('title')),
                'cta': link(cta.get('label'), '#' + CONTACT_ANCHOR if (cta.get('url') or '').startswith('#') else cta.get('url')),
            }))
        b['slides'] = slides
        b['title'] = b['title'] or s['slides'][0]['title']
        b['mobileImage'] = media(area, s['slides'][0].get('mobileImage'), s['slides'][0].get('title'))
        if any(sl.get('mobileImage') for sl in s['slides'][1:]):
            note('pension hero: per-slide mobile images collapsed to one hero.mobileImage (slides share the same image)')
    elif s.get('titleParts') or s.get('animation') or s.get('lottieDesktop'):
        b['variant'] = 'banner'
    elif s.get('image'):
        b['variant'] = 'banner'
    elif 'plain' in vl:
        b['variant'] = 'plain'
    elif 'light' in vl:
        b['variant'] = 'pageTitleLight'
    else:
        b['variant'] = 'pageTitle'
    if s.get('titleParts'):
        parts = []
        for p in s['titleParts']:
            tone = TONES.get((p.get('color') or '').upper(), 'light')
            parts.append({'text': p['text'], 'tone': tone})
        b['titleParts'] = parts
    b['image'] = media(area, s.get('image'), s.get('alt') or s.get('title'))
    if s.get('imageMobile') or s.get('mobileImage'):
        b['mobileImage'] = media(area, s.get('imageMobile') or s.get('mobileImage'), s.get('alt') or s.get('title'))
    anim = s.get('animation') or {}
    desk = anim.get('desktop') if isinstance(anim, dict) else None
    desk = desk or s.get('lottieDesktop')
    mob = (anim.get('mobile') if isinstance(anim, dict) else None) or s.get('lottieMobile')
    if desk:
        b['animation'] = media(area, desk, 'Hero animation')
    if mob:
        b['mobileAnimation'] = media(area, mob, 'Hero animation (mobile)')
    cta = s.get('cta')
    if cta and cta.get('label'):
        url = cta.get('url') or ('#' + CONTACT_ANCHOR)
        if not cta.get('url'):
            note(f'{area} home hero CTA "{cta["label"]}" has no live target; linked to #{CONTACT_ANCHOR}')
        b['cta'] = link(cta['label'], url)
    contacts = s.get('contacts') or s.get('items')
    if contacts:
        b['contacts'] = [clean({'label': c['label'], 'value': c['value'], 'url': contact_url(c['value'], c.get('url') or c.get('href'))})
                         for c in contacts]
    return clean(b)


def card_variant(s):
    t = ' '.join(str(s.get(k) or '') for k in ('variant', 'layout')).lower()
    title = (s.get('title') or '').lower()
    if 'solution' in t:
        return 'solutions'
    if 'whowe' in t or 'accordion' in t:
        return 'accordion'
    if 'office' in t or (('carousel' in t) and any('address' in json.dumps(i) or i.get('subtitle') for i in s.get('items', []))):
        return 'offices'
    if 'logo' in t:
        return 'logos'
    if 'benefit' in t:
        return 'benefits'
    if 'ctabanner' in t or 'thắc mắc' in title or 'cần hỗ trợ' in title or 'question' in title or 'need help' in title or 'support' in title:
        return 'ctaBanner'
    return 'grid'


def cards_block(s, area, loc):
    variant = card_variant(s)
    items = []
    for it in s.get('items') or []:
        text = it.get('text')
        if variant == 'offices' and text:
            text = re.sub(r' *\n', '  \n', text.strip())
        lk = it.get('link') or {}
        items.append(clean({
            'tag': it.get('tag'),
            'title': it.get('title') or (it.get('alt') if variant == 'logos' else None),
            'subtitle': it.get('subtitle'),
            'text': rewrite_md(text),
            'image': media(area, it.get('image'), it.get('alt') or it.get('title')),
            'link': link(lk.get('label'), lk.get('url')),
        }))
    return clean({
        '__component': 'blocks.cards', 'variant': variant,
        'anchor': 'benefits' if variant == 'benefits' else None,
        'eyebrow': s.get('eyebrow'), 'title': s.get('title'), 'titleHighlight': s.get('titleHighlight'),
        'subtitle': s.get('subtitle'), 'items': items,
    })


def policy_md(text, loc):
    if not text:
        return text
    text = rewrite_md(text)
    if '](' in text:
        return re.sub(r'\[([^\]]+)\]\([^)]*\)', lambda m: f'[{m.group(1)}](/policy)', text)
    for phrase in ('chính sách bảo mật', 'privacy policy'):
        idx = text.lower().rfind(phrase)
        if idx >= 0:
            return text[:idx] + '[' + text[idx: idx + len(phrase)] + '](/policy)' + text[idx + len(phrase):]
    return text


SUCCESS = {'vi': 'Cảm ơn bạn! Chúng tôi sẽ liên hệ với bạn trong thời gian sớm nhất.',
           'en': 'Thank you! We will get back to you shortly.'}


def contact_form_block(s, area, loc, path):
    labels = s.get('labels') or {}
    fields = {f.get('name'): f for f in s.get('fields') or []}
    ph = lambda n: (fields.get(n) or {}).get('placeholder')  # noqa: E731
    if labels:
        name, email, message = labels.get('name'), labels.get('email'), labels.get('message')
        if 'optIn' in labels:   # corporate: optIn = checkbox, consent = disclaimer
            opt_in, disclaimer = labels.get('optIn'), labels.get('consent')
        else:                   # individual: consent = checkbox
            opt_in, disclaimer = labels.get('consent'), labels.get('disclaimer')
        submit = labels.get('submit')
        company = phone = None
    else:
        name, email, message = ph('first_name'), ph('email'), ph('message')
        company, phone = ph('company'), ph('phone')
        opt_in = s.get('consentLabel') or (fields.get('isChecked') or {}).get('label')
        submit, disclaimer = s.get('submitLabel'), s.get('disclaimer')
    centered = path.endswith('contact')
    return clean({
        '__component': 'blocks.contact-form', 'anchor': CONTACT_ANCHOR,
        'variant': 'centered' if centered else 'panel',
        'eyebrow': s.get('eyebrow'), 'title': s.get('title'),
        'image': media(area, s.get('image'), s.get('alt') or s.get('title')),
        'imagePosition': s.get('imagePosition') if s.get('imagePosition') in ('left', 'right') else 'left',
        'nameLabel': name, 'companyLabel': company, 'emailLabel': email, 'phoneLabel': phone,
        'messageLabel': message, 'optInLabel': opt_in, 'submitLabel': submit,
        'disclaimer': policy_md(disclaimer, loc), 'successMessage': SUCCESS[loc],
    })


def faq_block(s, loc, anchor=None):
    groups = []
    for g in s.get('groups') or []:
        groups.append(clean({'name': g.get('name'),
                             'items': [clean({'question': i['question'], 'answer': rewrite_md(i.get('answer'))}) for i in g.get('items') or []]}))
    return clean({'__component': 'blocks.faq', 'anchor': anchor, 'title': s.get('title'), 'groups': groups})


PEOPLE = None


def person_extra(name):
    for p in PEOPLE['people']:
        if name in (p['name'].get('vi'), p['name'].get('en')):
            return p
    return None


def team_block(s, area, loc):
    quote = s.get('quote')
    if not quote and s.get('quotes'):
        q = next((q for q in s['quotes'] if q['title'].startswith('Senior')), s['quotes'][0])
        quote = q['quote']
        note('individual about team: 3 tab quote cards reduced to one team.quote (the "Senior - Quote 1" card)')
    groups = []
    for g in s.get('groups') or []:
        people = []
        for p in g.get('people') or []:
            extra = person_extra(p['name']) or {}
            bio = p.get('bio') or L(extra.get('bio'), loc)
            people.append(clean({
                'name': p['name'], 'role': p.get('role'),
                'image': media(area, p.get('image'), p.get('alt') or p['name']),
                'bio': rewrite_md(bio), 'linkedinUrl': extra.get('linkedin'),
            }))
        groups.append({'name': g['name'], 'people': people})
    return clean({'__component': 'blocks.team', 'title': s.get('title'), 'subtitle': s.get('subtitle'),
                  'quote': quote, 'groups': groups})


DOC_FUND_OPTIONS = {}  # loc -> [{value,label}]


def doc_library_block(s, loc):
    return clean({'__component': 'blocks.document-library', 'anchor': 'documents', 'title': s.get('title'),
                  'defaultFund': 'VFC', 'funds': DOC_FUND_OPTIONS[loc]})


METRIC_PERIOD = {'navChangeIn1Year': '1Y', 'fiveYearsReturn': '5Y', 'ytdReturn': 'ytd', 'navChangeIn3Months': '3M',
                 'navChangeIn1Month': '1M', 'navChangeIn3Years': '3Y', 'last12MonthsReturn': '12M'}


def fund_cards_block(s, area, loc):
    funds = []
    items = s.get('items') or []
    for i, it in enumerate(items):
        slug = it.get('fund') or (s.get('funds') or [None] * len(items))[i]
        if not slug and it.get('link'):
            slug = rewrite_url(it['link']['url']).rstrip('/').split('/')[-1]
        funds.append(clean({
            'fundSlug': slug, 'tag': it.get('category'), 'title': it.get('name') or it.get('title'),
            'subtitle': it.get('subtitle'), 'text': it.get('description') or it.get('text'),
            'icon': media(area, it.get('icon'), it.get('title') or it.get('name')),
            'returnPeriod': METRIC_PERIOD.get(it.get('metric')),
        }))
    return clean({'__component': 'blocks.fund-cards', 'anchor': 'funds' if area == 'institution' else None,
                  'eyebrow': s.get('eyebrow'), 'title': s.get('title'), 'subtitle': s.get('subtitle'), 'funds': funds})


ANCHORS = ['overview', 'benefits', 'funds', 'faq']


def convert_sections(page, area, loc, path):
    out = []
    secs = page['sections']
    listing = path.endswith('news-and-insights')
    for s in secs:
        t = s['type']
        if t == 'hero':
            out.append(hero_block(s, area, loc))
        elif t == 'richText':
            out.append(clean({'__component': 'blocks.rich-text', 'eyebrow': s.get('eyebrow'), 'title': s.get('title'),
                              'subtitle': s.get('subtitle'), 'body': rewrite_md(s.get('body')),
                              'image': media(area, s.get('image'), s.get('alt') or s.get('title')),
                              'imagePosition': s.get('imagePosition') if s.get('imagePosition') in ('left', 'right') else None}))
        elif t == 'cards':
            out.append(cards_block(s, area, loc))
        elif t == 'features':
            out.append(clean({'__component': 'blocks.features', 'title': s.get('title'),
                              'items': [clean({'icon': media(area, i.get('icon'), i['text']), 'text': i['text']}) for i in s['items']]}))
        elif t == 'stats':
            out.append(clean({'__component': 'blocks.stats', 'title': s.get('title'),
                              'items': [{'label': i['label'], 'value': i['value']} for i in s['items']]}))
        elif t == 'testimonials':
            out.append(clean({'__component': 'blocks.testimonials', 'eyebrow': s.get('eyebrow'), 'title': s.get('title'),
                              'items': [clean({'quote': i['quote'], 'name': i['name'],
                                               'image': media(area, i.get('image'), i.get('alt') or i['name'])}) for i in s['items']]}))
        elif t == 'fundCards':
            out.append(fund_cards_block(s, area, loc))
        elif t == 'appPromo':
            out.append(clean({'__component': 'blocks.app-promo', 'anchor': 'dragonx', 'eyebrow': s.get('eyebrow'),
                              'title': s.get('title'), 'text': s.get('text'), 'buttonLabel': s.get('buttonLabel'),
                              'image': media(area, s.get('image'), (s.get('title') or '').replace('\n', ' ')),
                              'appStoreUrl': s.get('appStoreUrl'), 'playStoreUrl': s.get('playStoreUrl')}))
            if s.get('imageMobile'):
                note('individual home appPromo: mobile image variant dropped (app-promo has one image)')
        elif t == 'newsFeed':
            if listing:
                filters = s.get('filters') or s.get('tabs') or []
                out.append({'__component': 'blocks.news-index', 'allLabel': filters[0] if filters else ('Tất Cả' if loc == 'vi' else 'All')})
                if s.get('authorFilter'):
                    note('institution news listing: author dropdown (All / Dragon Capital) not modelled')
            else:
                out.append(clean({'__component': 'blocks.news-feed', 'eyebrow': s.get('eyebrow'), 'title': s.get('title'),
                                  'moreLabel': s.get('moreLabel'), 'moreUrl': rewrite_url(s.get('moreUrl')),
                                  'category': s.get('category'), 'count': s.get('count') or 3}))
        elif t == 'timeline':
            out.append(clean({'__component': 'blocks.timeline', 'title': s.get('title'), 'subtitle': s.get('subtitle'),
                              'items': [clean({'year': i['year'], 'title': i['title'], 'text': i.get('text'),
                                               'image': media(area, i.get('image'), i['title'])}) for i in s['items']]}))
        elif t == 'team':
            out.append(team_block(s, area, loc))
        elif t == 'contactForm':
            out.append(contact_form_block(s, area, loc, path))
        elif t == 'faq':
            out.append(faq_block(s, loc, 'faq' if path.endswith('pension') else None))
        elif t == 'documentLibrary':
            out.append(doc_library_block(s, loc))
        elif t == 'other':
            data = s.get('data') or {}
            if 'tabs' in data:
                out.append({'__component': 'blocks.anchor-nav',
                            'links': [{'label': lab, 'url': '#' + ANCHORS[i], 'openInNewTab': False} for i, lab in enumerate(data['tabs'])]})
            elif 'slides' in data:
                slides = []
                for sl in data['slides']:
                    text = sl.get('text') or ''
                    if sl.get('subtitle'):
                        text = f"**{sl['subtitle']}**\n\n{text}"
                    slides.append(clean({'videoUrl': sl['video'], 'eyebrow': sl.get('eyebrow'), 'title': sl.get('title'), 'text': text}))
                out.append({'__component': 'blocks.video-carousel', 'anchor': 'overview', 'slides': slides})
            elif 'filters' in data:  # corporate news index
                out.append({'__component': 'blocks.news-index', 'allLabel': data['filters'][0]['label']})
            else:
                note(f'dropped "other" section on {path}: {s.get("description", "")[:80]}')
        else:
            note(f'dropped unknown section type {t} on {path}')
    return out


# ---------------------------------------------------------------- pages

PAGE_SOURCES = [
    # (path, site, area, crawl file stem)
    ('individual', 'individual', 'individual', 'home'),
    ('individual/about', 'individual', 'individual', 'about'),
    ('individual/faq', 'individual', 'individual', 'faq'),
    ('individual/report', 'individual', 'individual', 'report'),
    ('individual/contact', 'individual', 'individual', 'contact'),
    ('individual/news-and-insights', 'individual', 'corporate', 'news'),
    ('institution', 'institution', 'institution', 'home'),
    ('institution/about', 'institution', 'institution', 'about'),
    ('institution/faq', 'institution', 'institution', 'faq'),
    ('institution/report', 'institution', 'institution', 'report'),
    ('institution/contact', 'institution', 'institution', 'contact'),
    ('institution/pension', 'institution', 'institution', 'pension'),
    ('institution/sma', 'institution', 'institution', 'sma'),
    ('institution/news-and-insights', 'institution', 'institution', 'news-and-insights'),
    ('contact', 'corporate', 'corporate', 'contact'),
    ('terms', 'corporate', 'corporate', 'terms'),
    ('policy', 'corporate', 'corporate', 'policy'),
    ('regulatory', 'regulatory', 'corporate', 'regulatory'),
]


def build_pages():
    pages = []
    legal_bodies = {}
    for path, site, area, stem in PAGE_SOURCES:
        entry = {'path': path, 'site': site, 'locales': {}}
        for loc in LOCALES:
            pg = load(area, 'pages', f'{stem}.{loc}.json')
            if stem in ('terms', 'policy'):
                bodies = {s.get('lang'): s['body'] for s in pg['sections'] if s['type'] == 'richText'}
                body = rewrite_md(bodies['vi'].rstrip() + '\n\n---\n\n' + bodies['en'].strip())
                hero = next(s for s in pg['sections'] if s['type'] == 'hero')
                sections = [hero_block(hero, area, loc),
                            {'__component': 'blocks.rich-text', 'body': body, 'narrow': True}]
                legal_bodies[path] = body
            else:
                sections = convert_sections(pg, area, loc, path)
            h1 = next((b.get('title') for b in sections if b['__component'] == 'blocks.hero'), None)
            if not h1:
                h1 = next((b.get('title') for b in sections if b.get('title')), None)
            mt, md = pg.get('metaTitle'), pg.get('metaDescription')
            if path == 'regulatory':
                mt = 'Công bố thông tin | Dragon Capital' if loc == 'vi' else 'Regulatory Disclosure | Dragon Capital'
            if path == 'individual/news-and-insights' and not any(b['__component'] == 'blocks.hero' for b in sections):
                pass
            entry['locales'][loc] = clean({'title': (h1 or mt or path).replace('\n', ' '), 'seo': seo(mt or h1, md),
                                           'sections': sections})
        pages.append(entry)
    return pages


# ---------------------------------------------------------------- sites

def nav_items_individual(nav):
    items = []
    for n in nav:
        if 'groups' in n:
            groups = [{'title': g['label'], 'links': [link(i['label'], i['url'], False) for i in g['items']]} for g in n['groups']]
            other = n.get('otherProducts')
            if other:
                groups.append({'title': other['label'], 'links': [link(i['label'], i['url'], False) for i in other['items']]})
                note('site nav "other products": explanatory sentence dropped (shared.nav-group has title + links only)')
            items.append(clean({'label': n['label'], 'panelTitle': n.get('title'), 'groups': groups}))
        elif 'items' in n:
            items.append(clean({'label': n['label'], 'panelTitle': n.get('title'),
                                'groups': [{'links': [link(i['label'], i['url'], False) for i in n['items']]}]}))
        else:
            items.append({'label': n['label'], 'url': rewrite_url(n['url'])})
    return items


def nav_items_institution(nav):
    items = []
    for n in nav:
        if n.get('children'):
            groups = []
            for g in n['children']:
                if g.get('description'):
                    note('site nav "other products": explanatory sentence dropped (shared.nav-group has title + links only)')
                groups.append(clean({'title': g.get('group'), 'links': [link(i['label'], i['url'], False) for i in g['links']]}))
            items.append(clean({'label': n['label'], 'panelTitle': n.get('dropdownTitle'), 'groups': groups}))
        else:
            items.append({'label': n['label'], 'url': rewrite_url(n['url'])})
    return items


def group(title, links):
    return {'title': title, 'links': [link(i['label'], i['url'], False) for i in links]}


def build_sites():
    sites = []
    # individual
    ind = load('individual', 'site.json')
    v = ind['vi']
    entry = {
        'key': 'individual',
        'logo': media('individual', v['logo']['image'], 'Dragon Capital'),
        'footerLogo': media('individual', v['footer']['logo'], 'Dragon Capital'),
        'appStoreUrl': v['footer']['appStore']['url'], 'playStoreUrl': v['footer']['playStore']['url'],
        'appStoreBadge': media('individual', v['footer']['appStore']['image'], 'App Store'),
        'playStoreBadge': media('individual', v['footer']['playStore']['image'], 'Google Play'),
        'zaloUrl': v['floatingButton']['url'], 'locales': {},
    }
    note('individual footer: the "Sản phẩm" heading over the 3 product sub-columns is flattened (each fund group is its own footer column)')
    note('individual site: mobile-only nav item "Liên hệ" not stored as a nav item (headerCta is the DragonX CTA)')
    for loc in LOCALES:
        d = ind[loc]
        f = d['footer']
        m = d['dragonXModal']
        cols = [group(c['title'], c['items']) for c in f['productColumns']] + [group(c['title'], c['items']) for c in f['columns']]
        entry['locales'][loc] = clean({
            'label': d['siteName'], 'nav': nav_items_individual(d['nav']),
            'headerCta': link(d['cta']['label'], '#dragonx', False),
            'footerColumns': cols,
            'socialLinks': [{'network': s['name'], 'url': s['url']} for s in f['social']],
            'appTitle': f['appHeading'],
            'legalLinks': [link(x['label'], x['url'], False) for x in f['legal']],
            'copyright': f['copyright'],
            'appModal': clean({'eyebrow': m['title'], 'title': m['subtitle'], 'text': m['description'],
                               'qr': media('individual', m['qrImage'], 'DragonX QR'),
                               'appStoreUrl': m['appStoreUrl'], 'playStoreUrl': m['playStoreUrl'],
                               'moreText': m['moreText'], 'moreLink': link(m['moreLink']['label'], m['moreLink']['url'], True)}),
        })
    sites.append(entry)

    # institution
    ins = load('institution', 'site.json')
    v = ins['vi']
    entry = {'key': 'institution',
             'logo': media('institution', v['header']['logo']['image'], 'Dragon Capital'),
             'footerLogo': media('institution', v['footer']['logo']['image'], 'Dragon Capital'),
             'zaloUrl': next((s['url'] for s in v['footer']['social'] if s['type'].lower() == 'zalo'), None),
             'locales': {}}
    note('institution footer: the "Sản Phẩm" heading over its 4 sub-groups is flattened (each group is its own footer column)')
    for loc in LOCALES:
        d = ins[loc]
        f = d['footer']
        cols = []
        for c in f['columns']:
            if c.get('groups'):
                cols += [group(g['title'], g['links']) for g in c['groups']]
            else:
                cols.append(group(c['title'], c['links']))
        entry['locales'][loc] = clean({
            'label': d['siteName'], 'nav': nav_items_institution(d['header']['nav']),
            'headerCta': link(d['header']['cta']['label'], d['header']['cta']['url'], False),
            'footerColumns': cols,
            'socialLinks': [{'network': s['type'].lower(), 'url': s['url']} for s in f['social']],
            'legalLinks': [link(x['label'], x['url'], False) for x in f['legal']],
            'copyright': f['copyright'],
        })
    sites.append(entry)

    # corporate + regulatory
    corp = load('corporate', 'site.json')
    for key in ('corporate', 'regulatory'):
        c = corp[key]
        entry = {'key': key, 'logo': media('corporate', c['logo']['image'], 'Dragon Capital'),
                 'footerLogo': media('corporate', c['footerLogo']['image'], 'Dragon Capital'), 'locales': {}}
        for loc in LOCALES:
            d = c[loc]
            entry['locales'][loc] = clean({
                'label': ('Công bố thông tin' if loc == 'vi' else 'Regulatory Disclosure') if key == 'regulatory' else None,
                'nav': [],
                'headerCta': link(d['headerCta']['label'], d['headerCta']['url'], False),
                'footerColumns': [group(x['title'], x['links']) for x in d['footerColumns']],
                'legalLinks': [link(x['label'], x['url'], False) for x in d['legalLinks']],
                'copyright': d['copyright'],
            })
        sites.append(entry)
    return sites


# ---------------------------------------------------------------- funds

PRODUCT_FUNDS = {
    'individual': ['dcds', 'dcde', 'dcip', 'dcbf', 'dcba', 'vn30', 'vndiamond', 'vnmidcap', 'thinh-an', 'phuc-an'],
    'institution': ['dcip', 'vn30', 'vndiamond', 'vnmidcap', 'thinh-an', 'phuc-an'],
}


def kv_list(items, loc):
    out = []
    for it in items or []:
        val = L(it.get('value'), loc)
        if isinstance(val, list):
            val = '\n'.join(str(x) for x in val)
        lab = L(it.get('label'), loc)
        if lab:
            out.append(clean({'label': lab, 'value': val}))
    return out


def compact_pricing(f):
    p = f.get('pricing')
    if not p:
        return None
    raw = load('funds', p['seriesFile'])
    num = lambda x: None if x in (None, '') else (round(float(x), 4))  # noqa: E731
    chart = [[r['date'], num(r.get('navPerShare')), num(r.get('closePrice')), num(r.get('tradingLastVolume'))]
             for r in raw['pricingChartData']]
    premium = [[r['date__c'][:10], num(r.get('deltaChangeWithNav__c')), num(r.get('deltaChangeWithNavPercentage__c'))]
               for r in raw['fundPricingList']]
    trading = sorted(raw['fundTradingList'], key=lambda r: r['dateTime__c'])
    primary = [[r['dateTime__c'][:10], num(r.get('issuedShare__c')), num(r.get('additionalLots__c')), num(r.get('buybackLots__c'))]
               for r in trading if r.get('issuedShare__c') is not None]
    last = next((r for r in reversed(trading) if r.get('differenceIssuedShare__c') is not None), None)
    creation = None
    if last:
        keys = ['AdditionalLots', 'BuybackLots', 'IssuedShare', 'ClosingPrice', 'NavAssetValue', 'NavAssetPerLot', 'NavPerShare', 'BenchMarkIndex']
        lc = lambda k: k[0].lower() + k[1:]  # noqa: E731
        creation = {'date': last['dateTime__c'][:10], 'navDate': (last.get('navDate__c') or '')[:10] or None,
                    'lastDate': (last.get('lastDate__c') or '')[:10] or None,
                    'lastNavDate': (last.get('lastNavDate__c') or '')[:10] or None,
                    'rows': {lc(k): {'current': num(last.get(lc(k) + '__c')), 'last': num(last.get('last' + k + '__c')),
                                     'difference': num(last.get('difference' + k + '__c'))} for k in keys}}
    avg30 = next((num(r.get('tradingAvgVolume30d__c')) for r in reversed(trading) if r.get('tradingAvgVolume30d__c')), None)
    lc_ = p.get('latestClose') or {}
    latest_close = {k.replace('__c', ''): v for k, v in lc_.items() if k.endswith('__c') and k not in ('fundCode__c', 'reportCode__c')}
    rebal = sorted(({'date': r['Date__c'], 'remark': {'vi': r.get('Remark_VI__c'), 'en': r.get('Remark_EN__c')}}
                    for r in raw['fundRebalanceList']), key=lambda r: r['date'], reverse=True)
    return {
        'ticker': p.get('ticker'), 'indexName': p.get('indexName'), 'iNavApi': p.get('iNavApi'),
        'remarks': p.get('remarks'), 'latestClose': latest_close, 'avgVolume30d': avg30,
        'rebalanceNotices': rebal, 'creationRedemption': creation,
        'series': {
            'chartColumns': ['date', 'nav', 'closePrice', 'volume'], 'chart': chart,
            'premiumColumns': ['date', 'premium', 'premiumPct'], 'premium': premium,
            'primaryColumns': ['date', 'issuedShares', 'creationUnits', 'redemptionUnits'], 'primary': primary,
        },
    }


SEO_AUDIENCE = {'individual': ('Khách hàng cá nhân', 'Personal Investors'),
                'institution': ('Khách hàng doanh nghiệp', 'Institutional Investors')}


def build_funds():
    data = load('funds', 'funds.json')
    SLUG_BY_SFID.update(data['slugBySfId'])
    by_slug = {f['slug']: f for f in data['funds']}
    out = []
    order = 0
    for audience in ('individual', 'institution'):
        for slug in PRODUCT_FUNDS[audience]:
            order += 1
            f = by_slug[slug]
            primary = f.get('primaryAudienceContent') or 'individual'
            content = dict(f)
            ov = f.get(audience) if audience != primary else None
            pension_individual = audience == 'individual' and f['fundType'] == 'PENSION'
            if ov:
                if pension_individual:
                    # Live individual pension pages show English CMS stubs; use the institution text (canonical VI)
                    content.update({k: ov[k] for k in ('heroStats',) if k in ov})
                    note('individual Thịnh An / Phúc An: institution text used (live individual pages show English stubs)')
                else:
                    content.update(ov)
            seo_src = content.get('seo') or {}
            if pension_individual or L(seo_src, 'vi').get('metaTitle') in (None, 'Fund Detail'):
                seo_src = f.get('seo') or {}
                other = 'institution' if audience == 'individual' else 'individual'
                fix = {}
                for i, loc in enumerate(LOCALES):
                    s = dict(L(seo_src, loc))
                    s['metaTitle'] = (s.get('metaTitle') or '').replace(SEO_AUDIENCE[other][i], SEO_AUDIENCE[audience][i])
                    if audience == 'individual':
                        s['metaTitle'] = s['metaTitle'].replace('Corporate Solutions', SEO_AUDIENCE['individual'][i])
                    fix[loc] = s
                seo_src = fix
            cta = content.get('cta') or {}
            cta_label = cta.get('label')
            if pension_individual:
                cta_label = by_slug['dcds']['cta']['label']
            page = {loc: load('funds', 'pages', f'{audience}-product-{slug}.{loc}.json') for loc in LOCALES}
            entry = {
                'slug': slug, 'audience': audience, 'code': f['code'], 'ticker': f.get('ticker'),
                'fundCode': f.get('fundCode'), 'fundReportCode': f.get('fundReportCode'), 'fundType': f['fundType'],
                'hasProductPage': True, 'displayOrder': order, 'inceptionDate': f.get('inceptionDate'),
                'asOfDate': f.get('asOfDate'),
                'ctaAction': 'dragonx' if audience == 'individual' else 'contact',
                'benchmarkHidden': bool((f.get('benchmark') or {}).get('hiddenOnChart')),
                'latestNav': f.get('latestNav'), 'benchmarkLatest': f.get('benchmarkLatest'),
                'performance': f.get('performance'), 'expenseRatio12M': f.get('expenseRatio12M'),
                'trackingError': f.get('trackingError'),
                'navHistory': [{'date': r['date'], 'nav': r['nav'], 'cumReturnPct': r.get('cumReturnPct')} for r in f.get('navHistory') or []],
                'benchmarkHistory': [{'date': r['date'], 'value': r.get('value'), 'cumReturnPct': r.get('cumReturnPct')} for r in f.get('benchmarkHistory') or []] or None,
                'navHistoryRecent': f.get('navHistoryRecent'),
                'portfolioStats': f.get('portfolioStats'),
                'pricing': compact_pricing(f),
                'locales': {},
            }
            if entry['portfolioStats'] is not None:
                entry['portfolioStats'] = dict(entry['portfolioStats'], asOfDate=f.get('portfolioAsOfDate') or entry['portfolioStats'].get('asOfDate'))
            for loc in LOCALES:
                obj = content.get('objective') or {}
                strat = content.get('investmentStrategy') or {}
                managers = []
                for m in content.get('managers') or []:
                    managers.append(clean({'name': m['name'], 'role': L(m.get('role'), loc),
                                           'photo': media('funds', m.get('image'), m['name']),
                                           'stats': [{'label': L(s['label'], loc), 'value': L(s['value'], loc)} for s in m.get('stats') or []]}))
                sections = []
                if audience == 'institution':
                    cf = next((s for s in page[loc]['sections'] if s['type'] == 'contactForm'), None)
                    if cf:
                        sections.append(contact_form_block(cf, 'funds', loc, f'{audience}/product/{slug}'))
                s_loc = L(seo_src, loc)
                entry['locales'][loc] = clean({
                    'category': L(content.get('category'), loc),
                    'displayName': L(content.get('displayName'), loc) or f['code'],
                    'name': L(content.get('name'), loc),
                    'tagline': L(content.get('tagline'), loc),
                    'ctaLabel': L(cta_label, loc),
                    'heroDownloads': [link(L(d['label'], loc), d['url'], True) for d in content.get('heroDownloads') or []],
                    'heroStats': [L(s, loc) for s in content.get('heroStats') or []],
                    'objectiveTitle': L(obj.get('title'), loc), 'objective': rewrite_md(L(obj.get('body'), loc)),
                    'strategyTitle': L(strat.get('title'), loc), 'strategy': rewrite_md(L(strat.get('body'), loc)),
                    'keyFactsTitle': L(content.get('keyFactsTitle'), loc),
                    'keyFacts': kv_list(content.get('keyFacts'), loc),
                    'fees': kv_list(f.get('fees'), loc),
                    'managersTitle': L(content.get('managersTitle'), loc),
                    'managers': managers,
                    'benchmarkName': L((f.get('benchmark') or {}).get('name'), loc),
                    'performanceRemark': L(f.get('performanceRemark'), loc),
                    'allocation': L(f.get('allocation'), loc),
                    'topHoldings': L(f.get('topHoldings'), loc),
                    'minimumInvestment': L(content.get('minimumInvestment'), loc),
                    'seo': seo(s_loc.get('metaTitle'), s_loc.get('metaDescription')),
                    'sections': sections,
                })
            entry = clean(entry)
            size = len(json.dumps(entry))
            if size > 1_500_000:
                note(f'fund {slug}/{audience} JSON is {size / 1e6:.1f} MB (> 1.5 MB target)')
            out.append(entry)
    return out


# ---------------------------------------------------------------- articles

def build_articles():
    arts = load('corporate', 'articles.json')
    out = []
    for a in arts:
        cat = a.get('category') or a.get('categoryGuess')
        cover = a.get('coverImage') or {}
        fp = a.get('featuredPriority')
        entry = {'slug': a['slug'], 'category': cat, 'date': a['date'], 'author': a.get('author'),
                 'cover': media('corporate', cover.get('image'), cover.get('alt') or L(a['title'], 'vi')),
                 'featuredPriority': int(fp) if fp not in (None, '', 'null') and str(fp).lstrip('-').isdigit() else None,
                 'locales': {}}
        for loc in LOCALES:
            body = L(a.get('body'), loc) or ''
            # inline images -> media:content/news/<file> (after optimisation, which may change the extension)
            def img(m):
                dest = ASSETS.ref('corporate', m.group(2))
                return m.group(1) + ('media:' + dest if dest else m.group(2))
            body = re.sub(r'(\]\(|src=")(assets/news/[^)"\s]+)', img, body)
            body = rewrite_md(body)
            excerpt = L(a.get('excerpt'), loc)
            if not excerpt or excerpt.strip().lower() in ('undefined', 'null'):
                excerpt = None
            title = L(a['title'], loc)
            entry['locales'][loc] = clean({
                'title': title, 'excerpt': excerpt, 'body': body,
                'attachments': [link(x.get('label') or 'Tài liệu', x['url'], True) for x in a.get('attachments') or []],
                'seo': seo((a.get('seo') or {}).get('seoTitle') or title, (a.get('seo') or {}).get('metaDescription') or excerpt),
            })
        out.append(clean(entry))
    return out


# ---------------------------------------------------------------- documents

def build_documents():
    corp = load('corporate', 'documents.json')
    docs = {}
    for d in corp:
        docs[d['id']] = {
            'docId': d['id'], 'fundCode': d['fundCode'], 'type': d.get('type'), 'category': d.get('category'),
            'year': int(d['year']) if d.get('year') else None,
            'titleVi': (d.get('title') or {}).get('vi'), 'titleEn': (d.get('title') or {}).get('en'),
            'date': d.get('date'), 'fileUrl': d.get('fileUrl'),
            'inVi': 'vi' in (d.get('locales') or []), 'inEn': 'en' in (d.get('locales') or []),
            'displayOrder': d.get('displayOrder'),
        }
    base = len(docs)
    # retail (individual) full set: different folder taxonomy -> map onto the regulatory one via the overlap
    raw = load('individual', 'raw', 'docs', 'documents_raw.json')
    retail = {}
    for code, v in raw.items():
        for loc in LOCALES:
            for year, folders in (v.get(loc) or {}).items():
                for fo in folders:
                    folder = fo['folder']
                    for fi in fo['files']:
                        r = retail.setdefault(fi['Id'], {'code': (folder.get('relatedFund__r') or {}).get('fundCode__c') or code,
                                                         'rtype': folder.get('documentType__c'), 'rcat': folder.get('documentSection__c'),
                                                         'file': fi, 'titles': {}, 'year': fi.get('activeFileYear__c') or year})
                        r['titles'][loc] = fi.get('Name')
    # funds area per-fund full lists (same retail taxonomy; type=section, category=type)
    fund_meta = {f['slug']: f for f in load('funds', 'funds.json')['funds']}
    for fn in sorted(os.listdir(os.path.join(CRAWL, 'funds', 'data'))):
        m = re.match(r'documents-(.+)\.json$', fn)
        if not m:
            continue
        code = fund_meta[m.group(1)]['fundCode']
        for d in load('funds', 'data', fn):
            r = retail.setdefault(d['id'], {'code': code, 'rtype': d.get('category'), 'rcat': d.get('type'),
                                            'file': {'downloadUrl__c': d.get('url'), 'displayDate__c': d.get('date'),
                                                     'displayOrder__c': d.get('displayOrder')},
                                            'titles': {}, 'year': d.get('year')})
            for loc in d.get('languages') or []:
                r['titles'].setdefault(loc, (d.get('title') or {}).get(loc) or d.get('fileName'))
    votes = defaultdict(Counter)
    for i, r in retail.items():
        if i in docs:
            votes[(r['rtype'], r['rcat'])][(docs[i]['type'], docs[i]['category'])] += 1
    tmap = {k: c.most_common(1)[0][0] for k, c in votes.items()}
    unmapped = Counter()
    for i, r in retail.items():
        if i in docs:
            continue
        typ, cat = tmap.get((r['rtype'], r['rcat']), (r['rtype'], r['rcat']))
        if (r['rtype'], r['rcat']) not in tmap:
            unmapped[(r['rtype'], r['rcat'])] += 1
        fi = r['file']
        date = fi.get('displayDate__c') or fi.get('effectiveSortDate__c') or (fi.get('CreatedDate') or '')[:10] or None
        docs[i] = {'docId': i, 'fundCode': r['code'], 'type': typ, 'category': cat,
                   'year': int(r['year']) if r.get('year') else None,
                   'titleVi': r['titles'].get('vi'), 'titleEn': r['titles'].get('en'),
                   'date': date, 'fileUrl': fi.get('downloadUrl__c'),
                   'inVi': 'vi' in r['titles'], 'inEn': 'en' in r['titles'], 'displayOrder': fi.get('displayOrder__c')}
    if unmapped:
        note(f'fund documents: retail-only folder types kept as-is (no regulatory equivalent): {dict(unmapped)}')
    print(f'  documents: {base} regulatory + {len(docs) - base} retail-only = {len(docs)}')
    return list(docs.values()), sorted({d['type'] for d in docs.values() if d['type']}), sorted({d['category'] for d in docs.values() if d['category']})


def build_taxonomy(types_used, cats_used):
    corp = load('corporate', 'documents.filters.json')
    ind = load('individual', 'documents.filters.json')
    out = {'locales': {}}
    for loc in LOCALES:
        types = {o['value']: L(o['label'], loc) for o in ind['type']['options']}
        types.update({o['value']: L(o['label'], loc) for o in corp['type']['options']})
        cats = {k: L(v, loc) for k, v in ind['sections'].items()}
        cats.update({k: L(v, loc) for k, v in corp['sections'].items()})
        for t in types_used:
            types.setdefault(t, t.replace('_', ' ').title())
        for c in cats_used:
            cats.setdefault(c, c.replace('_', ' ').title())
        out['locales'][loc] = {'labels': {
            'funds': DOC_FUND_OPTIONS[loc],
            'types': {k: v for k, v in types.items() if k in types_used},
            'categories': {k: v for k, v in cats.items() if k in cats_used},
            'ui': {'fund': L(corp['fund']['label'], loc), 'type': L(corp['type']['label'], loc),
                   'year': L(corp['year']['label'], loc), 'allTypes': L(corp['type']['allLabel'], loc),
                   'columns': L(corp['tableHeaders'], loc), 'empty': L(corp['empty'], loc), 'noMatch': L(corp['noMatch'], loc)},
        }}
    return out


# ---------------------------------------------------------------- main

def write_json(name, data):
    os.makedirs(OUT, exist_ok=True)
    with open(os.path.join(OUT, name), 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=1 if name != 'funds.json' else None, separators=None if name != 'funds.json' else (',', ':'))
        f.write('\n')


def main():
    global CRAWL, PEOPLE
    if len(sys.argv) < 2:
        sys.exit('usage: convert-crawl.py <crawl-dir>')
    CRAWL = os.path.abspath(sys.argv[1])
    PEOPLE = load('individual', 'people.json')
    for a in load('corporate', 'articles.json'):
        ARTICLE_BY_KEY[a['sfContentKey']] = a['slug']
        ARTICLE_BY_KEY[a['sfUrlName']] = a['slug']
    corp_filters = load('corporate', 'documents.filters.json')
    for loc in LOCALES:
        DOC_FUND_OPTIONS[loc] = [{'value': o['value'], 'label': L(o['label'], loc)} for o in corp_filters['fund']['options']]

    print('funds…')
    funds = build_funds()  # fills SLUG_BY_SFID first (used by link rewriting)
    print('sites…')
    sites = build_sites()
    print('pages…')
    pages = build_pages()
    print('articles…')
    articles = build_articles()
    print('documents…')
    docs, types_used, cats_used = build_documents()
    taxonomy = build_taxonomy(types_used, cats_used)

    write_json('sites.json', sites)
    write_json('pages.json', pages)
    write_json('funds.json', funds)
    write_json('articles.json', articles)
    write_json('document-taxonomy.json', taxonomy)
    with gzip.open(os.path.join(OUT, 'fund-documents.jsonl.gz'), 'wt', encoding='utf-8') as f:
        for d in docs:
            f.write(json.dumps(d, ensure_ascii=False) + '\n')

    total = sum(os.path.getsize(os.path.join(ASSET_ROOT, p)) for p in set(ASSETS.map.values()))
    print(f'sites {len(sites)}, pages {len(pages)}, funds {len(funds)}, articles {len(articles)}, documents {len(docs)}')
    print(f'assets: {len(set(ASSETS.map.values()))} files, {total / 1e6:.1f} MB')
    if DROPS:
        print('notes:')
        for d in DROPS:
            print('  -', d)


if __name__ == '__main__':
    main()
